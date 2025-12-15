import Board from "../models/board.model.js";
import TaskCard from "../models/taskCard.model.js";
import { io, getReceiverSocketId } from "../lib/socket.js";
import Conversation from "../models/conversation.model.js";

// Helper to check if user is in conversation
const checkPermission = async (userId, conversationId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) throw new Error("Not authorized");
    return conversation;
};

export const getBoard = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        await checkPermission(userId, conversationId);

        let board = await Board.findOne({ conversationId });

        // Auto-create board if it doesn't exist
        if (!board) {
            board = new Board({
                conversationId,
                createdBy: userId,
                title: "Project Board"
            });
            await board.save();
        }

        // Fetch tasks
        const tasks = await TaskCard.find({ boardId: board._id }).sort({ order: 1 });

        res.status(200).json({ board, tasks });
    } catch (error) {
        console.error("Error in getBoard:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createTask = async (req, res) => {
    try {
        const { boardId, columnId, title, description, assignedTo, dueDate, labels } = req.body;
        const userId = req.user._id;

        const board = await Board.findById(boardId);
        if (!board) return res.status(404).json({ message: "Board not found" });

        await checkPermission(userId, board.conversationId);

        // Get max order in this column to append to bottom
        const lastTask = await TaskCard.findOne({ boardId, columnId }).sort({ order: -1 });
        const newOrder = lastTask ? lastTask.order + 1 : 0;

        const newTask = new TaskCard({
            boardId,
            columnId,
            title,
            description,
            assignedTo,
            dueDate,
            labels,
            order: newOrder,
            createdBy: userId,
        });

        await newTask.save();

        // Real-time update
        io.to(board.conversationId.toString()).emit("kanban:taskCreated", newTask);

        res.status(201).json(newTask);
    } catch (error) {
        console.error("Error in createTask:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const updates = req.body;
        const userId = req.user._id;

        const task = await TaskCard.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        const board = await Board.findById(task.boardId);
        await checkPermission(userId, board.conversationId);

        const updatedTask = await TaskCard.findByIdAndUpdate(taskId, updates, { new: true });

        io.to(board.conversationId.toString()).emit("kanban:taskUpdated", updatedTask);

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error in updateTask:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const moveTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { columnId, newOrder } = req.body;
        const userId = req.user._id;

        const task = await TaskCard.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        const board = await Board.findById(task.boardId);
        await checkPermission(userId, board.conversationId);

        const oldColumnId = task.columnId;

        // Update the moved task
        task.columnId = columnId;
        task.order = newOrder;
        await task.save();

        // Reorder other tasks in the destination column
        // This is a simplified reorder logic. For production with thousands of cards, use Lexorank.
        // Here we just shift everything >= newOrder up by 1 (excluding the current task)
        await TaskCard.updateMany(
            {
                boardId: board._id,
                columnId: columnId,
                _id: { $ne: taskId },
                order: { $gte: newOrder }
            },
            { $inc: { order: 1 } }
        );

        io.to(board.conversationId.toString()).emit("kanban:taskMoved", {
            taskId,
            columnId,
            newOrder,
            oldColumnId
        });

        res.status(200).json(task);
    } catch (error) {
        console.error("Error in moveTask:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user._id;

        const task = await TaskCard.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        const board = await Board.findById(task.boardId);
        await checkPermission(userId, board.conversationId);

        await TaskCard.findByIdAndDelete(taskId);

        io.to(board.conversationId.toString()).emit("kanban:taskDeleted", taskId);

        res.status(200).json({ message: "Task deleted" });
    } catch (error) {
        console.error("Error in deleteTask:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
