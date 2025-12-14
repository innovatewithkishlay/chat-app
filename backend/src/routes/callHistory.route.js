import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getCallHistory } from "../controllers/callHistory.controller.js";

const router = express.Router();

router.get("/", protectRoute, getCallHistory);

export default router;
