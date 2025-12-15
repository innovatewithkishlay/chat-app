import mongoose from "mongoose";

const taskCardSchema = new mongoose.Schema(
    {
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Board",
            required: true,
            index: true, // Optimized for fetching tasks by board
        },
        columnId: {
            type: String,
            required: true,
            index: true, // Optimized for filtering by column
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "",
        },
        assignedTo: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        dueDate: {
            type: Date,
            default: null,
        },
        labels: [
            {
                text: String,
                color: String,
            },
        ],
        order: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Compound index for efficient ordering queries
taskCardSchema.index({ boardId: 1, columnId: 1, order: 1 });

const TaskCard = mongoose.model("TaskCard", taskCardSchema);
export default TaskCard;
