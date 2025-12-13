import { Server } from "socket.io";
import http from "http";
import express from "express";

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://chatify-hgj2.onrender.com",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {}; // {userId: socketId}

// Socket Authentication Middleware
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) return next(new Error("Authentication error"));

    // Parse cookies manually (simple parser)
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => c.split("="))
    );
    const token = cookies.jwt;

    if (!token) return next(new Error("Authentication error"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) return next(new Error("Authentication error"));

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return next(new Error("Authentication error"));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

// ... (existing imports)

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.user._id.toString();
  userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Mark undelivered messages as delivered
  try {
    const result = await Message.updateMany(
      { recieverId: userId, status: "sent" },
      { $set: { status: "delivered" } }
    );

    if (result.modifiedCount > 0) {
      // Find distinct senders to notify
      const messages = await Message.find({ recieverId: userId, status: "delivered" }).select("senderId");
      const senderIds = [...new Set(messages.map(m => m.senderId.toString()))];

      senderIds.forEach(senderId => {
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesDelivered", {
            receiverId: userId,
          });
        }
      });
    }
  } catch (error) {
    console.error("Error marking messages as delivered:", error);
  }

  socket.on("typing", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId: userId });
    }
  });

  socket.on("stopTyping", (data) => {
    const receiverSocketId = getReceiverSocketId(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId: userId });
    }
  });

  // WebRTC Signaling
  // WebRTC Signaling
  socket.on("callUser", async (data) => {
    try {
      const receiverSocketId = getReceiverSocketId(data.userToCall);
      const sender = socket.user;

      // Check if sender is PRO
      if (sender.plan !== "PRO") {
        socket.emit("callRejected", { reason: "You must be PRO to make a video call." });
        return;
      }

      // Check if receiver is PRO
      const receiver = await User.findById(data.userToCall);
      if (!receiver || receiver.plan !== "PRO") {
        socket.emit("callRejected", { reason: "The other user is not eligible for video calls." });
        return;
      }

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("callUser", {
          signal: data.signalData,
          from: data.from,
          name: data.name,
        });
      } else {
        socket.emit("callRejected", { reason: "User is offline." });
      }
    } catch (error) {
      console.error("Error in callUser socket event:", error);
      socket.emit("callRejected", { reason: "Call failed." });
    }
  });

  socket.on("answerCall", async (data) => {
    try {
      const receiverSocketId = getReceiverSocketId(data.to);
      const receiver = socket.user;

      // Check if receiver (who is answering) is PRO
      if (receiver.plan !== "PRO") {
        socket.emit("callEnded", { reason: "You must be PRO to answer video calls." });
        return;
      }

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("callAccepted", data.signal);
      }
    } catch (error) {
      console.error("Error in answerCall:", error);
    }
  });

  socket.on("rejectCall", (data) => {
    const receiverSocketId = getReceiverSocketId(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callRejected", { reason: "Call rejected by user." });
    }
  });

  socket.on("endCall", (data) => {
    const receiverSocketId = getReceiverSocketId(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callEnded", { reason: "Call ended." });
    }
  });

  socket.on("iceCandidate", (data) => {
    const receiverSocketId = getReceiverSocketId(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("iceCandidate", data.candidate);
    }
  });

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Update lastSeen
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch (error) {
      console.error("Error updating lastSeen:", error);
    }
  });
});

export { io, app, server };
