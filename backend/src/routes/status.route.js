import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
    createStatus,
    getStatuses,
    viewStatus,
    deleteStatus,
} from "../controllers/status.controller.js";

const router = express.Router();

router.post("/", protectRoute, createStatus);
router.get("/", protectRoute, getStatuses);
router.post("/view", protectRoute, viewStatus); // Adjusted to match controller expecting body
router.delete("/:storyId", protectRoute, deleteStatus);

export default router;
