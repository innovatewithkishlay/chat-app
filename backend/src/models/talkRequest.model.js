import mongoose from "mongoose";

const talkRequestSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED"],
            default: "PENDING",
        },
    },
    { timestamps: true }
);

// Ensure unique request per sender-receiver pair (if pending)
// We can handle this logic in the controller to be more flexible (e.g. allow re-request after rejection if we wanted, but for now strict)
// For now, let's just index for performance
talkRequestSchema.index({ sender: 1, receiver: 1 });

const TalkRequest = mongoose.model("TalkRequest", talkRequestSchema);

export default TalkRequest;
