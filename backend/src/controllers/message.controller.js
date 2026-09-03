import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import Group from "../models/group.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { incrementUsage } from "../middlewares/limit.middleware.js";

export const clearChat = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const group = await Group.findById(userToChatId).select("members");
    if (group && !group.members.some((m) => m.toString() === myId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Clears messages either between me and userToChatId (1-1), or in the
    // group identified by userToChatId - a single query handles both since
    // a user id will never coincide with a group id.
    await Message.updateMany(
      {
        $or: [
          { senderId: myId, recieverId: userToChatId },
          { senderId: userToChatId, recieverId: myId },
          { groupId: userToChatId }
        ],
      },
      {
        $addToSet: { deletedFor: myId }
      }
    );

    // Also clear seen status locally if needed? No need.
    // Emit clear event if user has other tabs open
    const socketId = getReceiverSocketId(myId);
    if (socketId) {
      io.to(socketId).emit("chat:cleared", { userToChatId });
    }

    res.status(200).json({ message: "Chat cleared successfully" });
  } catch (error) {
    console.error("Error in clearChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      participants: userId,
      hiddenFor: { $ne: userId }, // Filter out hidden conversations
    })
      .populate({
        path: "participants",
        select: "-password",
      })
      .populate({
        path: "lastMessage",
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getConversations: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    conversation.hiddenFor.addToSet(userId);
    await conversation.save();

    const socketId = getReceiverSocketId(userId);
    if (socketId) {
      io.to(socketId).emit("conversation:deleted", { conversationId });
    }

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error in deleteChat: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Escapes regex metacharacters so a search term is treated as a literal
// string rather than a user-controlled regular expression.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Whether userId can see this message: either a direct participant (1-1),
// or a member of the group it belongs to.
async function canAccessMessage(message, userId) {
  const idStr = userId.toString();
  if (message.senderId.toString() === idStr || message.recieverId?.toString() === idStr) {
    return true;
  }
  if (message.groupId) {
    return Group.exists({ _id: message.groupId, members: userId });
  }
  return false;
}

export const searchMessages = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const { q } = req.query;
    const myId = req.user._id;

    if (!q || !q.trim()) {
      return res.status(200).json([]);
    }

    // If chatId is a group, the searcher must be a member - otherwise the
    // groupId clause below would let anyone search any group's messages.
    const group = await Group.findById(chatId).select("members");
    if (group && !group.members.some((m) => m.toString() === myId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, recieverId: chatId },
        { senderId: chatId, recieverId: myId },
        { groupId: chatId },
      ],
      deletedFor: { $ne: myId },
      isDeleted: { $ne: true },
      text: { $regex: escapeRegex(q.trim()), $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("_id text senderId createdAt type");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in searchMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, recieverId: userToChatId },
        { senderId: userToChatId, recieverId: myId },
      ],
      deletedFor: { $ne: myId }, // Filter out messages deleted for me
      // We DO NOT filter out isDeleted/deletedForEveryone here anymore, 
      // because we want to show "This message was deleted" placeholder.
    })
      .populate("pollId")
      .populate({
        path: "replyTo",
        select: "text image type senderId",
        populate: {
          path: "senderId",
          select: "fullname profilePic"
        }
      });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const receiver = await User.findById(receiverId).select("blockedUsers");
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const senderBlockedReceiver = req.user.blockedUsers?.includes(receiverId);
    const receiverBlockedSender = receiver.blockedUsers?.includes(senderId);

    if (senderBlockedReceiver || receiverBlockedSender) {
      return res.status(403).json({ message: "You cannot send messages to this user." });
    }

    const newMessage = new Message({
      senderId,
      recieverId: receiverId,
      text,
      image: imageUrl,
      replyTo: replyTo || null,
    });

    await newMessage.save();

    await newMessage.populate({
      path: "senderId",
      select: "fullname profilePic"
    });

    if (newMessage.replyTo) {
      await newMessage.populate({
        path: "replyTo",
        select: "text image type senderId",
        populate: {
          path: "senderId",
          select: "fullname"
        }
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const receiverIdString = receiverId.toString();
    const senderIdString = senderId.toString();

    conversation.lastMessage = newMessage._id;

    // Unhide conversation for both users
    conversation.hiddenFor = conversation.hiddenFor.filter(
      id => id.toString() !== senderIdString && id.toString() !== receiverIdString
    );

    // Increment unread count for receiver
    const currentUnread = conversation.unreadCount.get(receiverIdString) || 0;
    conversation.unreadCount.set(receiverIdString, currentUnread + 1);

    await conversation.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate({ path: "participants", select: "-password" })
      .populate("lastMessage");

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(receiverSocketId).emit("conversationUpdated", populatedConversation);
    }

    if (image) {
      await incrementUsage(senderId, "image");
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { type } = req.query; // "me" or "everyone"
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (type === "everyone") {
      // DELETE FOR EVERYONE
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Unauthorized to delete for everyone" });
      }

      // Optional: Check time limit (e.g. 1 hour)
      // const timeDiff = (Date.now() - message.createdAt) / 1000 / 60; // minutes
      // if (timeDiff > 60) return res.status(400).json({ message: "Too late to delete for everyone" });

      message.deletedForEveryone = true;
      message.text = "This message was deleted";
      message.image = null;
      message.type = "text"; // Reset type to text to show the placeholder
      await message.save();

      // Notify everyone
      const isGroup = !!message.groupId;
      if (isGroup) {
        const group = await import("../models/group.model.js").then(m => m.default.findById(message.groupId));
        if (group) {
          group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) io.to(socketId).emit("messageUpdated", message);
          });
        }
      } else {
        const receiverSocketId = getReceiverSocketId(message.recieverId);
        if (receiverSocketId) io.to(receiverSocketId).emit("messageUpdated", message);

        const senderSocketId = getReceiverSocketId(userId); // Also update sender's view
        if (senderSocketId) io.to(senderSocketId).emit("messageUpdated", message);
      }

    } else {
      // DELETE FOR ME (Default)
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }

      // No need to notify others, just confirm to sender
      res.status(200).json({ message: "Message deleted for you" });
      return;
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check time limit (e.g., 15 mins) - Optional, but good practice. 
    // User didn't specify, but "allowed time" was mentioned in prompt.
    const timeDiff = (Date.now() - message.createdAt) / 1000 / 60;
    if (timeDiff > 15) {
      return res.status(400).json({ message: "Edit time limit exceeded (15 mins)" });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    const updatedMessage = await Message.findById(messageId); // Return full object

    // Notify
    const isGroup = !!message.groupId;
    if (isGroup) {
      const group = await import("../models/group.model.js").then(m => m.default.findById(message.groupId));
      if (group) {
        group.members.forEach(memberId => {
          const socketId = getReceiverSocketId(memberId);
          if (socketId) io.to(socketId).emit("messageUpdated", updatedMessage);
        });
      }
    } else {
      const receiverSocketId = getReceiverSocketId(message.recieverId);
      if (receiverSocketId) io.to(receiverSocketId).emit("messageUpdated", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("Error in editMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body; // e.g. "👍"
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (!(await canAccessMessage(message, userId))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if user already reacted
    const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId.toString());

    if (existingReactionIndex > -1) {
      // If same emoji, remove it (toggle). If different, update it.
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Notify
    const isGroup = !!message.groupId;
    if (isGroup) {
      const group = await import("../models/group.model.js").then(m => m.default.findById(message.groupId));
      if (group) {
        group.members.forEach(memberId => {
          const socketId = getReceiverSocketId(memberId);
          if (socketId) io.to(socketId).emit("messageReactionUpdate", { messageId, reactions: message.reactions, groupId: message.groupId });
        });
      }
    } else {
      const receiverSocketId = getReceiverSocketId(message.recieverId);
      if (receiverSocketId) io.to(receiverSocketId).emit("messageReactionUpdate", { messageId, reactions: message.reactions });

      // Also emit to sender (myself) if I'm reacting, but frontend usually updates optimistically. 
      // But for consistency, let's emit to sender too if they are on another device.
      // Actually, frontend will listen to this event.
    }

    res.status(200).json(message);
  } catch (error) {
    console.error("Error in reactToMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleStarMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (!(await canAccessMessage(message, userId))) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const alreadyStarred = message.starredBy.some((id) => id.toString() === userId.toString());
    if (alreadyStarred) {
      message.starredBy = message.starredBy.filter((id) => id.toString() !== userId.toString());
    } else {
      message.starredBy.push(userId);
    }
    await message.save();

    res.status(200).json({ starred: !alreadyStarred });
  } catch (error) {
    console.error("Error in toggleStarMessage: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStarredMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({ starredBy: userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("senderId", "fullname profilePic")
      .populate("recieverId", "fullname profilePic")
      .populate("groupId", "name avatar members");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getStarredMessages: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id: targetId } = req.params; // userId (1-1) or groupId
    const myId = req.user._id;

    // Check if targetId is a group
    // We can try to find it in Group model.
    // Dynamic import to avoid circular dependency issues if any, though usually fine at top level.
    // But let's just use the imported Group model if we imported it. 
    // Wait, I didn't import Group in this file yet.
    // I need to import Group at the top or dynamically.
    const group = await import("../models/group.model.js").then(m => m.default.findById(targetId));

    if (group) {
      // It's a group
      // Update messages in this group where I haven't read them yet
      await Message.updateMany(
        { groupId: targetId, readBy: { $ne: myId } },
        { $addToSet: { readBy: myId } }
      );

      // Check if any messages are now read by ALL members (excluding sender)
      const unreadMessages = await Message.find({ groupId: targetId, status: { $ne: "read" } });

      for (const msg of unreadMessages) {
        const readers = new Set(msg.readBy.map(id => id.toString()));
        readers.add(myId.toString()); // Ensure current user is counted

        const allMembersRead = group.members.every(memberId => {
          if (memberId.toString() === msg.senderId.toString()) return true; // Sender doesn't count
          return readers.has(memberId.toString());
        });

        if (allMembersRead) {
          msg.status = "read";
          await msg.save();

          // Notify everyone that this message is fully seen
          group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
              io.to(socketId).emit("messageStatusUpdate", {
                messageId: msg._id,
                status: "read",
                groupId: targetId
              });
            }
          });
        }
      }

    } else {
      // 1-1 Conversation
      const conversation = await Conversation.findOne({
        participants: { $all: [myId, targetId] },
      });

      if (conversation) {
        conversation.unreadCount.set(myId.toString(), 0);
        await conversation.save();
      }

      await Message.updateMany(
        { senderId: targetId, recieverId: myId, status: { $ne: "read" } },
        { $set: { status: "read" } }
      );

      const senderSocketId = getReceiverSocketId(targetId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          conversationId: conversation?._id,
          seenBy: myId,
        });
      }
    }

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    console.log("Error in markMessagesAsSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
