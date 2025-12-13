import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsSeen,
  editMessage,
  reactToMessage,
} from "../controllers/message.controller.js";
import { checkUploadLimits } from "../middlewares/limit.middleware.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, checkUploadLimits, sendMessage);
router.put("/mark-seen/:id", protectRoute, markMessagesAsSeen);
router.delete("/:id", protectRoute, deleteMessage);
router.put("/edit/:id", protectRoute, editMessage);
router.put("/react/:id", protectRoute, reactToMessage);

export { router };
