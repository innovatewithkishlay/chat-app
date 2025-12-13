import TalkRequest from "../models/talkRequest.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const sendTalkRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user._id;

        if (senderId.toString() === receiverId) {
            return res.status(400).json({ message: "You cannot send a request to yourself." });
        }

        // Check if conversation already exists
        const existingConversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (existingConversation) {
            return res.status(400).json({ message: "Conversation already exists." });
        }

        // Check if pending request already exists
        const existingRequest = await TalkRequest.findOne({
            sender: senderId,
            receiver: receiverId,
            status: "PENDING",
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Request already sent." });
        }

        // Check if the other user has already sent a request to you
        const reverseRequest = await TalkRequest.findOne({
            sender: receiverId,
            receiver: senderId,
            status: "PENDING",
        });

        if (reverseRequest) {
            return res.status(400).json({ message: "This user has already sent you a request. Please check your inbox." });
        }

        const newRequest = new TalkRequest({
            sender: senderId,
            receiver: receiverId,
        });

        await newRequest.save();

        // Populate sender info for real-time update
        const populatedRequest = await TalkRequest.findById(newRequest._id).populate("sender", "fullname username profilePic");

        // Socket: Notify receiver
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newTalkRequest", populatedRequest);
        }

        res.status(201).json(populatedRequest);
    } catch (error) {
        console.error("Error in sendTalkRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTalkRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const requests = await TalkRequest.find({
            receiver: userId,
            status: "PENDING",
        }).populate("sender", "fullname username profilePic");

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error in getTalkRequests:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSentRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const requests = await TalkRequest.find({
            sender: userId,
            status: "PENDING",
        }).populate("receiver", "fullname username profilePic");

        res.status(200).json(requests);
    } catch (error) {
        console.error("Error in getSentRequests:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const acceptTalkRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user._id;

        const request = await TalkRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        if (request.receiver.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized." });
        }

        if (request.status !== "PENDING") {
            return res.status(400).json({ message: "Request is not pending." });
        }

        // Update request status
        request.status = "ACCEPTED";
        await request.save();

        // Add to friends list
        await User.findByIdAndUpdate(request.sender, {
            $addToSet: { friends: request.receiver }
        });
        await User.findByIdAndUpdate(request.receiver, {
            $addToSet: { friends: request.sender }
        });

        // Create Conversation
        const newConversation = new Conversation({
            participants: [request.sender, request.receiver],
            unreadCount: {
                [request.sender]: 0,
                [request.receiver]: 0,
            },
        });

        await newConversation.save();

        // Populate conversation for real-time update
        const populatedConversation = await Conversation.findById(newConversation._id)
            .populate("participants", "fullname username profilePic")
            .populate("lastMessage");

        // Socket: Notify Sender (Request Accepted)
        const senderSocketId = getReceiverSocketId(request.sender);
        if (senderSocketId) {
            io.to(senderSocketId).emit("talkRequestAccepted", {
                requestId: request._id,
                conversation: populatedConversation
            });
            // Emit conversationUpdated to sender
            io.to(senderSocketId).emit("conversationUpdated", populatedConversation);

            // Emit newFriend to sender
            const receiverUser = await User.findById(request.receiver).select("fullname username profilePic");
            io.to(senderSocketId).emit("newFriend", receiverUser);
        }

        res.status(200).json({ request, conversation: populatedConversation });
    } catch (error) {
        console.error("Error in acceptTalkRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const rejectTalkRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user._id;

        const request = await TalkRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: "Request not found." });
        }

        if (request.receiver.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized." });
        }

        await TalkRequest.findByIdAndDelete(requestId);

        res.status(200).json({ message: "Request rejected and removed." });
    } catch (error) {
        console.error("Error in rejectTalkRequest:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
