import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
    getBoard,
    createTask,
    updateTask,
    moveTask,
    deleteTask
} from "../controllers/kanban.controller.js";

const router = express.Router();

router.get("/:conversationId", protectRoute, getBoard);
router.post("/tasks", protectRoute, createTask);
router.put("/tasks/:taskId", protectRoute, updateTask);
router.put("/tasks/:taskId/move", protectRoute, moveTask);
router.delete("/tasks/:taskId", protectRoute, deleteTask);

export default router;
