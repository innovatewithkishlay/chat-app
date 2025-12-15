import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
    scheduleMessage,
    getScheduledMessages,
    cancelScheduledMessage
} from "../controllers/scheduledMessage.controller.js";

const router = express.Router();

router.post("/", protectRoute, scheduleMessage);
router.get("/:conversationId", protectRoute, getScheduledMessages);
router.delete("/:messageId", protectRoute, cancelScheduledMessage);

export default router;
