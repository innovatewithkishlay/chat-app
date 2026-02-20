import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { searchUsers, activateProTemp, updateMood, blockUser, unblockUser, getBlockedUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.post("/activate-pro-temp", protectRoute, activateProTemp);
router.put("/mood", protectRoute, updateMood);
router.post("/block", protectRoute, blockUser);
router.post("/unblock", protectRoute, unblockUser);
router.get("/blocked", protectRoute, getBlockedUsers);

export default router;
