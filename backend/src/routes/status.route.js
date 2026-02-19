import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { requirePro } from "../middlewares/requirePro.js";
import {
    createStatus,
    getStatuses,
    viewStatus,
    deleteStatus,
    getStatusViewers
} from "../controllers/status.controller.js";

const router = express.Router();

// Only PRO users can create status
router.post("/", protectRoute, requirePro, createStatus);

// Everyone can view statuses (or maybe restricted? sticking to plan: PRO feature to post)
router.get("/", protectRoute, getStatuses);
router.post("/view", protectRoute, viewStatus);
router.get("/:storyId/viewers", protectRoute, getStatusViewers); // New Endpoint
router.delete("/:storyId", protectRoute, deleteStatus); // maybe check ownership/pro?

export default router;
