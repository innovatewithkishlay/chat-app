import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getFriends, removeFriend } from "../controllers/friend.controller.js";

const router = express.Router();

router.get("/", protectRoute, getFriends);
router.delete("/:friendId", protectRoute, removeFriend);

export default router;
