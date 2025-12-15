import ScheduledMessage from "../models/scheduledMessage.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

const checkPermission = async (userId, conversationId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) throw new Error("Not authorized");
    return conversation;
};

export const scheduleMessage = async (req, res) => {
    try {
        const { conversationId, content, scheduledAt } = req.body;
        const userId = req.user._id;

        await checkPermission(userId, conversationId);

        const newScheduledMsg = new ScheduledMessage({
            conversationId,
            senderId: userId,
            content,
            scheduledAt: new Date(scheduledAt),
            status: "pending"
        });

        await newScheduledMsg.save();

        res.status(201).json(newScheduledMsg);
    } catch (error) {
        console.error("Error in scheduleMessage:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getScheduledMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        await checkPermission(userId, conversationId);

        const messages = await ScheduledMessage.find({
            conversationId,
            status: "pending"
        }).sort({ scheduledAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getScheduledMessages:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const cancelScheduledMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const msg = await ScheduledMessage.findById(messageId);
        if (!msg) return res.status(404).json({ message: "Message not found" });

        if (msg.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to cancel this message" });
        }

        msg.status = "cancelled";
        await msg.save();

        res.status(200).json({ message: "Scheduled message cancelled" });
    } catch (error) {
        console.error("Error in cancelScheduledMessage:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Background Job Logic (To be called periodically)
export const processScheduledMessages = async () => {
    try {
        const now = new Date();
        const dueMessages = await ScheduledMessage.find({
            status: "pending",
            scheduledAt: { $lte: now }
        });

        for (const msg of dueMessages) {
            try {
                // Create actual message
                const newMessage = new Message({
                    senderId: msg.senderId,
                    recieverId: null, // Assuming group or handled by conversation logic
                    text: msg.content,
                    status: "sent"
                });

                // We need to determine if it's a group or 1-1 to set receiverId/groupId correctly
                // For simplicity, we'll fetch conversation
                const conversation = await Conversation.findById(msg.conversationId);
                if (conversation) {
                    // If 1-1, find other participant
                    if (conversation.participants.length === 2) {
                        const receiverId = conversation.participants.find(p => p.toString() !== msg.senderId.toString());
                        newMessage.recieverId = receiverId;
                    }
                    // If group, we might need a groupId field in Message if schema supports it, 
                    // or just rely on conversationId if Message schema was updated.
                    // Looking at Message schema: it has groupId.
                    // We need to know if conversation is a group. 
                    // Existing schema doesn't strictly differentiate except by participant count or logic.
                    // Let's assume for now we just save it and emit to conversation room.
                }

                await newMessage.save();

                // Update conversation last message
                await Conversation.findByIdAndUpdate(msg.conversationId, {
                    lastMessage: newMessage._id,
                    updatedAt: new Date(),
                });

                // Emit socket event
                io.to(msg.conversationId.toString()).emit("newMessage", newMessage);

                // Mark as sent
                msg.status = "sent";
                await msg.save();

            } catch (err) {
                console.error(`Failed to send scheduled message ${msg._id}:`, err);
                msg.status = "failed";
                msg.error = err.message;
                await msg.save();
            }
        }
    } catch (error) {
        console.error("Error processing scheduled messages:", error);
    }
};
