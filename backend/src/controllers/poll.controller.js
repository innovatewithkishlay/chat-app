import Poll from "../models/poll.model.js";
import Conversation from "../models/conversation.model.js";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

const checkPermission = async (userId, id) => {
    // 1. Check if it's a Group
    const group = await Group.findById(id);
    if (group) {
        const isMember = group.members.some(m => m.toString() === userId.toString());
        if (!isMember) throw new Error("Not authorized");
        return { context: group, type: "group" };
    }

    // 2. Check if it's a Conversation ID directly
    const conversation = await Conversation.findById(id);
    if (conversation) {
        const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
        if (!isParticipant) throw new Error("Not authorized");
        return { context: conversation, type: "conversation" };
    }

    // 3. Check if it's a User ID (for 1-1 chat target)
    // We assume if it's not a group or conversation, it might be a user ID we are chatting with
    // But strict check is safer. Let's rely on frontend sending valid IDs (Group ID or User ID for 1-1)

    // If frontend sends Partner User ID for 1-1, we need to find the conversation
    // Import User dynamically or just use the passed ID to find conversation
    const conv = await Conversation.findOne({
        participants: { $all: [userId, id] }
    });

    if (conv) {
        return { context: conv, type: "conversation" };
    }

    throw new Error("Chat context not found");
};

export const getPolls = async (req, res) => {
    try {
        const { conversationId: id } = req.params;
        const userId = req.user._id;

        const { context, type } = await checkPermission(userId, id);

        let query = {};
        if (type === "group") {
            query.groupId = context._id;
        } else {
            query.conversationId = context._id;
        }

        const polls = await Poll.find(query).sort({ createdAt: -1 });
        res.status(200).json(polls);
    } catch (error) {
        console.error("Error in getPolls:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createPoll = async (req, res) => {
    try {
        const { conversationId: id, question, options } = req.body;
        const userId = req.user._id;

        const { context, type } = await checkPermission(userId, id);

        const formattedOptions = options.map(opt => ({ text: opt, voteCount: 0 }));

        const newPoll = new Poll({
            conversationId: type === "conversation" ? context._id : undefined,
            groupId: type === "group" ? context._id : undefined,
            question,
            options: formattedOptions,
            createdBy: userId,
        });

        await newPoll.save();

        // Create Poll Message in Chat
        let recieverId;
        if (type === "conversation") {
            recieverId = context.participants.find(p => p.toString() !== userId.toString());
        }

        const newMessage = new Message({
            senderId: userId,
            recieverId, // undefined if group
            groupId: type === "group" ? context._id : undefined,
            pollId: newPoll._id,
            type: "poll",
            text: `📊 Poll: ${question}`, // Fallback text
        });

        await newMessage.save();

        // Emit Message
        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullname profilePic")
            .populate("pollId");

        if (type === "group") {
            // Notify group members
            context.members.forEach(memberId => {
                const socketId = getReceiverSocketId(memberId);
                if (socketId) io.to(socketId).emit("newMessage", populatedMessage);
            });
        } else {
            // Notify receiver
            const receiverSocketId = getReceiverSocketId(recieverId);
            if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", populatedMessage);

            // Notify sender (self)
            const senderSocketId = getReceiverSocketId(userId);
            if (senderSocketId) io.to(senderSocketId).emit("newMessage", populatedMessage);
        }

        // Also emit to productivity tab listeners
        const emissionId = type === "group" ? context._id : (id); // Use the ID frontend passed/listening to
        io.to(emissionId.toString()).emit("poll:created", newPoll);

        res.status(201).json(newPoll);
    } catch (error) {
        console.error("Error in createPoll:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const votePoll = async (req, res) => {
    try {
        const { pollId } = req.params;
        const { optionIndex } = req.body;
        const userId = req.user._id;

        const poll = await Poll.findById(pollId);
        if (!poll) return res.status(404).json({ message: "Poll not found" });

        // Use groupId or conversationId to check permission
        // We can reuse checkPermission but need to pass the correct ID
        // Or just manual check since we have the Poll object
        let contextId;
        if (poll.groupId) contextId = poll.groupId;
        else if (poll.conversationId) contextId = poll.conversationId; // This is the Conversation ID

        // We can't use checkPermission(userId, contextId) efficiently because if it's a ConversationID, checkPermission expects...
        // Actually checkPermission handles ConversationID.
        // If it's a GroupID, checkPermission handles it.
        // So this works!

        await checkPermission(userId, contextId);

        // Check if user already voted
        const existingVoteIndex = poll.votes.findIndex(v => v.userId.toString() === userId.toString());

        if (existingVoteIndex !== -1) {
            // Remove old vote
            const oldOptionIndex = poll.votes[existingVoteIndex].optionIndex;
            poll.options[oldOptionIndex].voteCount = Math.max(0, poll.options[oldOptionIndex].voteCount - 1);
            poll.votes.splice(existingVoteIndex, 1);
        }

        // Add new vote
        poll.votes.push({ userId, optionIndex });
        poll.options[optionIndex].voteCount += 1;

        await poll.save();

        if (poll.groupId) {
            const group = await Group.findById(poll.groupId);
            if (group) {
                group.members.forEach(memberId => {
                    const socketId = getReceiverSocketId(memberId);
                    if (socketId) io.to(socketId).emit("poll:updated", poll);
                });
            }
        } else if (poll.conversationId) {
            io.to(poll.conversationId.toString()).emit("poll:updated", poll);
        }

        // We might also want to update the message in chat if we showed live votes there
        // But for now, user just asked for "saved there for in the group history" aka the created message.

        res.status(200).json(poll);
    } catch (error) {
        console.error("Error in votePoll:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
