import mongoose from "mongoose";

const callHistorySchema = new mongoose.Schema(
    {
        callType: {
            type: String,
            enum: ["VOICE", "VIDEO"],
            required: true,
        },
        caller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        status: {
            type: String,
            enum: ["INITIATED", "ONGOING", "MISSED", "REJECTED", "ENDED", "FAILED"],
            default: "INITIATED",
        },
        startedAt: {
            type: Date,
        },
        endedAt: {
            type: Date,
        },
        duration: {
            type: Number, // in seconds
            default: 0,
        },
        endedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

const CallHistory = mongoose.model("CallHistory", callHistorySchema);

export default CallHistory;
