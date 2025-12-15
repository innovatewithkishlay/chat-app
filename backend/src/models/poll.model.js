import mongoose from "mongoose";

const pollOptionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    voteCount: { type: Number, default: 0 },
});

const pollVoteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    optionIndex: { type: Number, required: true },
});

const pollSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },
        question: {
            type: String,
            required: true,
        },
        options: [pollOptionSchema],
        votes: [pollVoteSchema], // Track who voted for what to prevent double voting
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        isClosed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Poll = mongoose.model("Poll", pollSchema);
export default Poll;
