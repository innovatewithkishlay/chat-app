import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getCallHistory, clearCallHistory } from "../controllers/callHistory.controller.js";

const router = express.Router();

router.get("/", protectRoute, getCallHistory);
router.post("/clear", protectRoute, clearCallHistory);

export default router;
