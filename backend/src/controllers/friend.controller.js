import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

import { getReceiverSocketId, io } from "../lib/socket.js";

export const getFriends = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate("friends", "fullname username profilePic");

        res.status(200).json(user.friends);
    } catch (error) {
        console.error("Error in getFriends:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user._id;

        // Remove from both users' friend lists
        await User.findByIdAndUpdate(userId, {
            $pull: { friends: friendId }
        });
        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: userId }
        });

        // Notify the removed friend
        const friendSocketId = getReceiverSocketId(friendId);
        if (friendSocketId) {
            io.to(friendSocketId).emit("friendRemoved", userId);
        }

        res.status(200).json({ message: "Friend removed successfully" });
    } catch (error) {
        console.error("Error in removeFriend:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
