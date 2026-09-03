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
                const conversation = await Conversation.findById(msg.conversationId);
                if (!conversation) {
                    msg.status = "failed";
                    msg.error = "Conversation no longer exists";
                    await msg.save();
                    continue;
                }

                const receiverId = conversation.participants.find(
                    (p) => p.toString() !== msg.senderId.toString()
                );

                const newMessage = new Message({
                    senderId: msg.senderId,
                    recieverId: receiverId,
                    text: msg.content,
                    status: "sent",
                });

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
