import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { createGroup, getGroups, getGroupMessages, leaveGroup, sendGroupMessage, updateGroup, addMember, removeMember } from "../controllers/group.controller.js";

const router = express.Router();

router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.get("/:groupId/messages", protectRoute, getGroupMessages);
router.post("/:groupId/messages", protectRoute, sendGroupMessage);
router.post("/:groupId/leave", protectRoute, leaveGroup);
router.put("/:groupId/update", protectRoute, updateGroup);
router.post("/:groupId/add-member", protectRoute, addMember);
router.post("/:groupId/remove-member", protectRoute, removeMember);

export default router;
