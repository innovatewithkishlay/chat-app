import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const createGroup = async (req, res) => {
    try {
        const { name, members } = req.body;
        const userId = req.user._id;

        if (!name || !members || members.length === 0) {
            return res.status(400).json({ message: "Name and members are required" });
        }

        const group = new Group({
            name,
            members: [...members, userId],
            admins: [userId],
            createdBy: userId,
        });

        await group.save();

        // Create system message for group creation
        const systemMessage = new Message({
            groupId: group._id,
            text: `${req.user.fullname} created group "${name}"`,
            senderId: userId,
            type: "text",
        });
        await systemMessage.save();

        const populatedGroup = await Group.findById(group._id)
            .populate("members", "fullname username profilePic")
            .populate("admins", "fullname username profilePic");

        // Notify members
        populatedGroup.members.forEach((member) => {
            const socketId = getReceiverSocketId(member._id);
            if (socketId) {
                io.to(socketId).emit("newGroup", populatedGroup);
                io.to(socketId).emit("newGroupMessage", systemMessage);
            }
        });

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error("Error in createGroup:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId })
            .populate("members", "fullname username profilePic")
            .populate("admins", "fullname username profilePic")
            .sort({ updatedAt: -1 });

        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getGroups:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await Message.find({ groupId })
            .populate("senderId", "fullname username profilePic")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getGroupMessages:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Remove user from members
        group.members = group.members.filter((id) => id.toString() !== userId.toString());
        group.admins = group.admins.filter((id) => id.toString() !== userId.toString());

        if (group.members.length === 0) {
            await Group.findByIdAndDelete(groupId);
            return res.status(200).json({ message: "Group deleted as no members left" });
        }

        await group.save();

        // System message for leaving
        const systemMessage = new Message({
            groupId: group._id,
            text: `${req.user.fullname} left the group`,
            senderId: userId,
            type: "text",
        });
        await systemMessage.save();
        const populatedSystemMessage = await Message.findById(systemMessage._id).populate("senderId", "fullname profilePic");

        // Notify remaining members
        group.members.forEach((memberId) => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("newGroupMessage", populatedSystemMessage);
            }
        });

        res.status(200).json({ message: "Left group successfully" });
    } catch (error) {
        console.error("Error in leaveGroup:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { text, image, audio } = req.body;
        const senderId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.members.includes(senderId)) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        let imageUrl;
        let messageType = "text";

        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
            messageType = "image";
        } else if (audio) {
            const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "auto" });
            imageUrl = uploadResponse.secure_url;
            messageType = "audio";
        }

        const newMessage = new Message({
            senderId,
            groupId,
            text,
            image: imageUrl,
            type: messageType,
        });

        await newMessage.save();

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("senderId", "fullname username profilePic");

        // Notify all members
        group.members.forEach((memberId) => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("newGroupMessage", populatedMessage);
            }
        });

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error in sendGroupMessage:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        if (!group.admins.includes(userId)) {
            return res.status(403).json({ message: "Only admins can update group info" });
        }

        if (name) group.name = name;
        if (description) group.description = description;

        await group.save();

        // System message
        const systemMessage = new Message({
            groupId: group._id,
            text: `${req.user.fullname} updated group info`,
            senderId: userId,
            type: "text",
        });
        await systemMessage.save();

        const populatedGroup = await Group.findById(group._id)
            .populate("members", "fullname username profilePic")
            .populate("admins", "fullname username profilePic");

        // Notify members
        group.members.forEach((memberId) => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("groupUpdated", populatedGroup);
                io.to(socketId).emit("newGroupMessage", systemMessage);
            }
        });

        res.status(200).json(populatedGroup);
    } catch (error) {
        console.error("Error in updateGroup:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberId } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        if (!group.admins.includes(userId)) {
            return res.status(403).json({ message: "Only admins can add members" });
        }

        if (group.members.includes(memberId)) {
            return res.status(400).json({ message: "User is already a member" });
        }

        group.members.push(memberId);
        await group.save();

        // System message
        const addedUser = await User.findById(memberId);
        const systemMessage = new Message({
            groupId: group._id,
            text: `${req.user.fullname} added ${addedUser.fullname}`,
            senderId: userId,
            type: "text",
        });
        await systemMessage.save();

        const populatedGroup = await Group.findById(group._id)
            .populate("members", "fullname username profilePic")
            .populate("admins", "fullname username profilePic");

        // Notify all members (including new one)
        group.members.forEach((mId) => {
            const socketId = getReceiverSocketId(mId);
            if (socketId) {
                io.to(socketId).emit("groupUpdated", populatedGroup);
                io.to(socketId).emit("newGroupMessage", systemMessage);
            }
        });

        res.status(200).json(populatedGroup);
    } catch (error) {
        console.error("Error in addMember:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberId } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        if (!group.admins.includes(userId)) {
            return res.status(403).json({ message: "Only admins can remove members" });
        }

        group.members = group.members.filter(id => id.toString() !== memberId);
        group.admins = group.admins.filter(id => id.toString() !== memberId);

        await group.save();

        // System message
        const removedUser = await User.findById(memberId);
        const systemMessage = new Message({
            groupId: group._id,
            text: `${req.user.fullname} removed ${removedUser.fullname}`,
            senderId: userId,
            type: "text",
        });
        await systemMessage.save();

        const populatedGroup = await Group.findById(group._id)
            .populate("members", "fullname username profilePic")
            .populate("admins", "fullname username profilePic");

        // Notify remaining members
        group.members.forEach((mId) => {
            const socketId = getReceiverSocketId(mId);
            if (socketId) {
                io.to(socketId).emit("groupUpdated", populatedGroup);
                io.to(socketId).emit("newGroupMessage", systemMessage);
            }
        });

        // Notify removed member they are out
        const removedSocketId = getReceiverSocketId(memberId);
        if (removedSocketId) {
            io.to(removedSocketId).emit("removedFromGroup", groupId);
        }

        res.status(200).json(populatedGroup);
    } catch (error) {
        console.error("Error in removeMember:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
