import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { createOrder, verifyPayment } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-order", protectRoute, createOrder);
router.post("/verify-payment", protectRoute, verifyPayment);

export default router;
