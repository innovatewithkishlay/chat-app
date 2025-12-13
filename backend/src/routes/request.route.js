import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
    sendTalkRequest,
    getTalkRequests,
    acceptTalkRequest,
    rejectTalkRequest,
    getSentRequests,
} from "../controllers/request.controller.js";

const router = express.Router();

router.post("/send", protectRoute, sendTalkRequest);
router.get("/received", protectRoute, getTalkRequests);
router.get("/sent", protectRoute, getSentRequests);
router.post("/accept", protectRoute, acceptTalkRequest);
router.post("/reject", protectRoute, rejectTalkRequest);

export default router;
