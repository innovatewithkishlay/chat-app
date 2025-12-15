import mongoose from "mongoose";

const scheduledMessageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        scheduledAt: {
            type: Date,
            required: true,
            index: true, // Critical for background job to find due messages
        },
        status: {
            type: String,
            enum: ["pending", "sent", "failed", "cancelled"],
            default: "pending",
            index: true,
        },
        error: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

const ScheduledMessage = mongoose.model("ScheduledMessage", scheduledMessageSchema);
export default ScheduledMessage;
