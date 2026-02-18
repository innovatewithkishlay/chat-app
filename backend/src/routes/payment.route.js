import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { createOrder } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-order", protectRoute, createOrder);

export default router;
