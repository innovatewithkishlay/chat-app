import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { incrementUsage } from "../middlewares/limit.middleware.js";

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "-password",
      })
      .populate({
        path: "lastMessage",
      })
      .sort({ updatedAt: -1 });

    // Transform data to be frontend-friendly if needed, 
    // but sending the raw conversation object with populated fields is usually fine.
    // The frontend will need to filter out the current user from participants.

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error in getConversations: ", error.message);
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
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo, intent } = req.body;
    const { id: recieverId } = req.params;
    const senderId = req.user._id;

    // --- PERMISSION CHECK START ---
    // Check if conversation exists. If not, user cannot send message.
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recieverId] },
    });

    if (!conversation) {
      return res.status(403).json({ message: "You must have an accepted talk request to send messages." });
    }
    // --- PERMISSION CHECK END ---

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      recieverId,
      text,
      image: imageUrl,
      type: imageUrl ? "image" : "text",
      replyTo: replyTo || null,
      intent: intent || "none",
    });

    await newMessage.save();

    // Increment usage if image sent
    if (imageUrl) {
      await incrementUsage(senderId, "image");
    }

    conversation.lastMessage = newMessage._id;

    // Increment unread count for receiver
    const currentUnread = conversation.unreadCount.get(recieverId.toString()) || 0;
    conversation.unreadCount.set(recieverId.toString(), currentUnread + 1);

    await conversation.save();

    // Populate conversation for real-time update
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate({ path: "participants", select: "-password" })
      .populate({ path: "lastMessage" });

    const receiverSocketId = getReceiverSocketId(recieverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(receiverSocketId).emit("conversationUpdated", populatedConversation);
    }

    // Emit to sender as well to update their sidebar (move to top, show last message)
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("conversationUpdated", populatedConversation);
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
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this message" });
    }

    // Soft delete
    message.isDeleted = true;
    message.text = "This message was deleted";
    message.image = null;
    await message.save();

    // Notify receiver/group
    const emitTo = message.groupId ? message.groupId : message.recieverId;
    const isGroup = !!message.groupId;

    if (isGroup) {
      // We need to fetch group members to emit to them, or just emit to room if we had rooms.
      // Since we don't have rooms set up for groups in socket.js (we iterate members), 
      // let's fetch the group.
      const group = await import("../models/group.model.js").then(m => m.default.findById(message.groupId));
      if (group) {
        group.members.forEach(memberId => {
          const socketId = getReceiverSocketId(memberId);
          if (socketId) {
            io.to(socketId).emit("messageDeleted", { messageId, isSoft: true });
          }
        });
      }
    } else {
      const receiverSocketId = getReceiverSocketId(message.recieverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", { messageId, isSoft: true });
      }
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
    console.log("Error in reactToMessage: ", error.message);
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
      const unreadMessages = await Message.find({ groupId: targetId, status: { $ne: "seen" } });

      for (const msg of unreadMessages) {
        const readers = new Set(msg.readBy.map(id => id.toString()));
        readers.add(myId.toString()); // Ensure current user is counted

        const allMembersRead = group.members.every(memberId => {
          if (memberId.toString() === msg.senderId.toString()) return true; // Sender doesn't count
          return readers.has(memberId.toString());
        });

        if (allMembersRead) {
          msg.status = "seen";
          await msg.save();

          // Notify everyone that this message is fully seen
          group.members.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
              io.to(socketId).emit("messageStatusUpdate", {
                messageId: msg._id,
                status: "seen",
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
        { senderId: targetId, recieverId: myId, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
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
