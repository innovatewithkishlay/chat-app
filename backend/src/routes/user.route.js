import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { searchUsers, activateProTemp, updateMood } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.post("/activate-pro", protectRoute, activateProTemp);
router.put("/mood", protectRoute, updateMood);

export default router;
