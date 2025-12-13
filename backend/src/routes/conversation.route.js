import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { addMemory, removeMemory } from "../controllers/conversation.controller.js";

const router = express.Router();

router.post("/:id/memory", protectRoute, addMemory);
router.delete("/:id/memory/:memoryId", protectRoute, removeMemory);

export default router;
