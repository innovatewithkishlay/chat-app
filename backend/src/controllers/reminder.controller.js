import Reminder from "../models/reminder.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const createReminder = async (req, res) => {
    try {
        const { messageId, remindAt } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        const reminder = new Reminder({
            userId,
            messageId,
            remindAt: new Date(remindAt),
        });

        await reminder.save();

        res.status(201).json(reminder);
    } catch (error) {
        console.error("Error creating reminder:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getReminders = async (req, res) => {
    try {
        const userId = req.user._id;
        const reminders = await Reminder.find({ userId, isNotified: false })
            .populate({
                path: "messageId",
                populate: { path: "senderId", select: "fullname profilePic" }
            })
            .sort({ remindAt: 1 });

        res.status(200).json(reminders);
    } catch (error) {
        console.error("Error fetching reminders:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const reminder = await Reminder.findOneAndDelete({ _id: id, userId });
        if (!reminder) return res.status(404).json({ message: "Reminder not found" });

        res.status(200).json({ message: "Reminder deleted" });
    } catch (error) {
        console.error("Error deleting reminder:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
