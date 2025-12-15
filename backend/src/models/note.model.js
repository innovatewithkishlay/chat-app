import mongoose from "mongoose";

const noteVersionSchema = new mongoose.Schema({
    content: { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now },
});

const noteSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true, // Optimized for fetching notes by conversation
        },
        title: {
            type: String,
            required: true,
            default: "Untitled Note",
        },
        content: {
            type: String,
            default: "",
        },
        lockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null, // For collision prevention during editing
        },
        lockExpiresAt: {
            type: Date,
            default: null,
        },
        versions: [noteVersionSchema], // History of changes
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema);
export default Note;
