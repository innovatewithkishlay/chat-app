import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
    getPolls,
    createPoll,
    votePoll,
    closePoll
} from "../controllers/poll.controller.js";

const router = express.Router();

router.get("/:conversationId", protectRoute, getPolls);
router.post("/", protectRoute, createPoll);
router.post("/:pollId/vote", protectRoute, votePoll);
router.put("/:pollId/close", protectRoute, closePoll);

export default router;
