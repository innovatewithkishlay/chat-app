import mongoose from "mongoose";

const statusItemSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["text", "image", "video"],
        required: true,
    },
    content: {
        type: String, // Text content or File URL
        required: true,
    },
    color: {
        type: String, // Background color hex (for text type)
        default: null,
    },
    viewers: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            viewedAt: { type: Date, default: Date.now },
        },
    ],
    viewerCount: {
        type: Number,
        default: 0,
    },
    reactions: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            emoji: { type: String, required: true },
            reactedAt: { type: Date, default: Date.now },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const statusSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One active document per user (upsert logic will be used)
        },
        stories: [statusItemSchema],
        privacy: {
            type: String,
            enum: ["friends", "close_friends", "public"],
            default: "friends",
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL Index: Document deletes when current time > expiresAt
        },
    },
    { timestamps: true }
);

// Indexes for performance
statusSchema.index({ userId: 1 });
statusSchema.index({ "stories.createdAt": 1 });

const Status = mongoose.model("Status", statusSchema);

export default Status;
