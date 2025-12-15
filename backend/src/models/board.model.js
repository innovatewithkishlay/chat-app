import mongoose from "mongoose";

const columnSchema = new mongoose.Schema({
    id: { type: String, required: true }, // UUID for frontend drag-drop
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
});

const boardSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true, // Optimized for fetching board by conversation
        },
        title: {
            type: String,
            required: true,
            default: "Project Board",
        },
        columns: {
            type: [columnSchema],
            default: [
                { id: "todo", title: "To Do", order: 0 },
                { id: "in-progress", title: "In Progress", order: 1 },
                { id: "done", title: "Done", order: 2 },
            ],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Board = mongoose.model("Board", boardSchema);
export default Board;
