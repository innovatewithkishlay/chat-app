import User from "../models/user.model.js";
import { io } from "../lib/socket.js";

export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const currentUserId = req.user._id;

        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Search by username (case-insensitive)
        // Exclude current user
        const users = await User.find({
            username: { $regex: query, $options: "i" },
            _id: { $ne: currentUserId },
        }).select("fullname username profilePic _id");

        res.status(200).json(users);
    } catch (error) {
        console.error("Error in searchUsers: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const activateProTemp = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findByIdAndUpdate(
            userId,
            { plan: "PRO" },
            { new: true }
        );
        res.status(200).json(user);
    } catch (error) {
        console.error("Error in activateProTemp: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateMood = async (req, res) => {
    try {
        const { status, duration } = req.body; // duration in minutes
        const userId = req.user._id;

        let expiresAt = null;
        if (duration) {
            expiresAt = new Date(Date.now() + duration * 60000);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { mood: { status, expiresAt } },
            { new: true }
        );

        // Notify all online users (simplified for now)
        io.emit("userUpdated", { userId, mood: updatedUser.mood });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating mood:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
