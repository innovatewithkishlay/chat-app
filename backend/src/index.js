import dotenv from "dotenv";
dotenv.config();

import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import { app, server, io, getReceiverSocketId, allowedOrigins } from "./lib/socket.js";
import { connectDb } from "./lib/db.js";
import "./lib/webpush.js";

import { router as authRoutes } from "./routes/auth.route.js";
import { router as messageRoutes } from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import requestRoutes from "./routes/request.route.js";
import videoCallRoutes from "./routes/videoCall.route.js";
import friendRoutes from "./routes/friend.route.js";
import groupRoutes from "./routes/group.route.js";
import reminderRoutes from "./routes/reminder.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import callHistoryRoutes from "./routes/callHistory.route.js";
import notificationRoutes from "./routes/notification.route.js";
import statusRoutes from "./routes/status.route.js";
import kanbanRoutes from "./routes/kanban.route.js";
import noteRoutes from "./routes/note.route.js";
import pollRoutes from "./routes/poll.route.js";
import scheduledMessageRoutes from "./routes/scheduledMessage.route.js";
import paymentRoutes from "./routes/payment.route.js";

import Reminder from "./models/reminder.model.js";
import { processScheduledMessages } from "./controllers/scheduledMessage.controller.js";

const port = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" }));
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/video-call", videoCallRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/calls", callHistoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/kanban", kanbanRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/scheduled-messages", scheduledMessageRoutes);
app.use("/api/payment", paymentRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
  });
}

// Polls due reminders and scheduled messages once a minute and pushes them
// out over the existing socket connections rather than running a separate
// worker process.
const BACKGROUND_JOB_INTERVAL_MS = 60_000;

async function runBackgroundJobs() {
  try {
    const now = new Date();
    const dueReminders = await Reminder.find({
      remindAt: { $lte: now },
      isNotified: false,
    }).populate("messageId");

    for (const reminder of dueReminders) {
      const socketId = getReceiverSocketId(reminder.userId);
      if (socketId) {
        io.to(socketId).emit("reminderTriggered", reminder);
        reminder.isNotified = true;
        await reminder.save();
      }
    }

    await processScheduledMessages();
  } catch (error) {
    console.error("Error running background jobs:", error);
  }
}

setInterval(runBackgroundJobs, BACKGROUND_JOB_INTERVAL_MS);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  connectDb();
});
