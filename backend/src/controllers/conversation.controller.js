import Conversation from "../models/conversation.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const addMemory = async (req, res) => {
    try {
        const { id: conversationId } = req.params;
        const { text, referenceMsgId } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        // Check if user is participant
        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const newMemory = { text, referenceMsgId };
        conversation.memory.push(newMemory);
        await conversation.save();

        // Notify participants
        conversation.participants.forEach(participantId => {
            const socketId = getReceiverSocketId(participantId);
            if (socketId) {
                io.to(socketId).emit("memoryUpdated", { conversationId, memory: conversation.memory });
            }
        });

        res.status(200).json(conversation.memory);
    } catch (error) {
        console.error("Error adding memory:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const removeMemory = async (req, res) => {
    try {
        const { id: conversationId, memoryId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        conversation.memory = conversation.memory.filter(m => m._id.toString() !== memoryId);
        await conversation.save();

        // Notify participants
        conversation.participants.forEach(participantId => {
            const socketId = getReceiverSocketId(participantId);
            if (socketId) {
                io.to(socketId).emit("memoryUpdated", { conversationId, memory: conversation.memory });
            }
        });

        res.status(200).json(conversation.memory);
    } catch (error) {
        console.error("Error removing memory:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
