import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { subscribe } from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/subscribe", protectRoute, subscribe);
import { getConfig } from "../controllers/notification.controller.js";
router.get("/config", protectRoute, getConfig);

export default router;
