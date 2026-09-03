import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { checkEligibility, getIceServerConfig } from "../controllers/videoCall.controller.js";

const router = express.Router();

router.post("/check-eligibility", protectRoute, checkEligibility);
router.get("/ice-servers", protectRoute, getIceServerConfig);

export default router;
