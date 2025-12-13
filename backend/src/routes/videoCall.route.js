import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { checkEligibility } from "../controllers/videoCall.controller.js";

const router = express.Router();

router.post("/check-eligibility", protectRoute, checkEligibility);

export default router;
