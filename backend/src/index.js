import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { app, server, io, getReceiverSocketId } from "./lib/socket.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { router as authRoutes } from "./routes/auth.route.js";
import { router as messageRoutes } from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import requestRoutes from "./routes/request.route.js";
import videoCallRoutes from "./routes/videoCall.route.js";
import friendRoutes from "./routes/friend.route.js";
import groupRoutes from "./routes/group.route.js";
import reminderRoutes from "./routes/reminder.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import Reminder from "./models/reminder.model.js";
import { connectDb } from "./lib/db.js";

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://chatify-hgj2.onrender.com",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);
const port = process.env.PORT || 8000;
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/video-call", videoCallRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/conversations", conversationRoutes);

// Reminder Cron
setInterval(async () => {
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
  } catch (error) {
    console.error("Error in reminder cron:", error);
  }
}, 60000);

server.listen(port, () => {
  console.log("app is lisining at port ", port);
  connectDb();
});
