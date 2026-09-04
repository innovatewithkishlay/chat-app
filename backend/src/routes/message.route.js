import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getConversations,
  getMessages,
  searchMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsSeen,
  editMessage,
  reactToMessage,
  toggleStarMessage,
  getStarredMessages,
  clearChat,
  deleteChat,
} from "../controllers/message.controller.js";
import { checkUploadLimits } from "../middlewares/limit.middleware.js";

const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.get("/search/:id", protectRoute, searchMessages);
router.get("/starred", protectRoute, getStarredMessages);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, checkUploadLimits, sendMessage);
router.put("/mark-seen/:id", protectRoute, markMessagesAsSeen);
router.delete("/:id", protectRoute, deleteMessage);
router.put("/edit/:id", protectRoute, editMessage);
router.put("/react/:id", protectRoute, reactToMessage);
router.put("/star/:id", protectRoute, toggleStarMessage);
router.post("/clear/:id", protectRoute, clearChat);
router.post("/delete/:id", protectRoute, deleteChat);

export { router };
