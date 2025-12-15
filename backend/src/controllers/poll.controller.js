import Poll from "../models/poll.model.js";
import Conversation from "../models/conversation.model.js";
import { io } from "../lib/socket.js";

const checkPermission = async (userId, conversationId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) throw new Error("Not authorized");
    return conversation;
};

export const getPolls = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        await checkPermission(userId, conversationId);

        const polls = await Poll.find({ conversationId }).sort({ createdAt: -1 });
        res.status(200).json(polls);
    } catch (error) {
        console.error("Error in getPolls:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createPoll = async (req, res) => {
    try {
        const { conversationId, question, options } = req.body;
        const userId = req.user._id;

        await checkPermission(userId, conversationId);

        const formattedOptions = options.map(opt => ({ text: opt, voteCount: 0 }));

        const newPoll = new Poll({
            conversationId,
            question,
            options: formattedOptions,
            createdBy: userId,
        });

        await newPoll.save();

        io.to(conversationId.toString()).emit("poll:created", newPoll);

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

        await checkPermission(userId, poll.conversationId);

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

        io.to(poll.conversationId.toString()).emit("poll:updated", poll);

        res.status(200).json(poll);
    } catch (error) {
        console.error("Error in votePoll:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
