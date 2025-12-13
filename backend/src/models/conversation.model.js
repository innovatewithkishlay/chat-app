import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
        memory: [
            {
                text: { type: String, required: true },
                referenceMsgId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
                updatedAt: { type: Date, default: Date.now }
            }
        ],
    },
    { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
