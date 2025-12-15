import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
    getPolls,
    createPoll,
    votePoll
} from "../controllers/poll.controller.js";

const router = express.Router();

router.get("/:conversationId", protectRoute, getPolls);
router.post("/", protectRoute, createPoll);
router.post("/:pollId/vote", protectRoute, votePoll);

export default router;
