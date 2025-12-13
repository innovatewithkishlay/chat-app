import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { createReminder, getReminders, deleteReminder } from "../controllers/reminder.controller.js";

const router = express.Router();

router.post("/", protectRoute, createReminder);
router.get("/", protectRoute, getReminders);
router.delete("/:id", protectRoute, deleteReminder);

export default router;
