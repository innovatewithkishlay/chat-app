import { Server } from "socket.io";
import http from "http";
import express from "express";

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import CallHistory from "../models/callHistory.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://chatify-hgj2.onrender.com",
      "https://touki.onrender.com",
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

  // --- Group & Typing Logic ---

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
  });

  socket.on("typing", (data) => {
    if (data.groupId) {
      // Broadcast to everyone in the group room EXCEPT the sender
      socket.to(data.groupId).emit("typing", {
        senderId: userId,
        groupId: data.groupId
      });
    } else {
      const receiverSocketId = getReceiverSocketId(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { senderId: userId });
      }
    }
  });

  socket.on("stopTyping", (data) => {
    if (data.groupId) {
      socket.to(data.groupId).emit("stopTyping", {
        senderId: userId,
        groupId: data.groupId
      });
    } else {
      const receiverSocketId = getReceiverSocketId(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", { senderId: userId });
      }
    }
  });

  // WebRTC Signaling
  // --- WebRTC Signaling (Strict State Machine) ---

  // 1. Initiate Call
  socket.on("call:initiate", async (data) => {
    console.log("SOCKET: call:initiate received", data);
    // data: { userToCall, signalData, from, name }
    try {
      const receiverSocketId = getReceiverSocketId(data.userToCall);
      const sender = socket.user;
      console.log("SOCKET: Sender:", sender._id, "Receiver ID:", data.userToCall, "Receiver Socket:", receiverSocketId);

      // Eligibility Check (Sender)
      if (sender.plan !== "PRO") {
        console.log("SOCKET: Sender not PRO");
        socket.emit("call:error", { message: "You must be PRO to make a video call." });
        return;
      }

      // Eligibility Check (Receiver)
      const receiver = await User.findById(data.userToCall);
      if (!receiver || receiver.plan !== "PRO") {
        console.log("SOCKET: Receiver not PRO or not found");
        socket.emit("call:error", { message: "The other user is not eligible (needs PRO)." });
        return;
      }

      // Create Call History Entry
      const newCall = new CallHistory({
        callType: "VIDEO",
        caller: sender._id,
        receiver: receiver._id,
        participants: [sender._id, receiver._id],
        status: "INITIATED",
      });
      await newCall.save();

      // Send callId to sender so they can reference it later
      socket.emit("call:created", { callId: newCall._id });

      if (receiverSocketId) {
        // Emit INCOMING to receiver
        console.log("SOCKET: Emitting call:incoming to", receiverSocketId);
        io.to(receiverSocketId).emit("call:incoming", {
          signal: data.signalData,
          from: data.from,
          name: data.name,
          callId: newCall._id,
        });
      } else {
        console.log("SOCKET: Receiver offline");
        socket.emit("call:error", { message: "User is offline." });

        // Mark as MISSED immediately if offline
        newCall.status = "MISSED";
        newCall.endedAt = new Date();
        await newCall.save();
      }
    } catch (error) {
      console.error("Error in call:initiate:", error);
      socket.emit("call:error", { message: "Failed to initiate call." });
    }
  });

  // 2. Accept Call
  socket.on("call:accept", async (data) => {
    // data: { signal, to, callId }
    const receiverSocketId = getReceiverSocketId(data.to);

    if (data.callId) {
      await CallHistory.findByIdAndUpdate(data.callId, {
        status: "ONGOING",
        startedAt: new Date(),
      });
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:accepted", { signal: data.signal, callId: data.callId });
    }
  });

  // 3. Reject Call
  socket.on("call:reject", async (data) => {
    // data: { to, callId }
    const receiverSocketId = getReceiverSocketId(data.to);

    if (data.callId) {
      await CallHistory.findByIdAndUpdate(data.callId, {
        status: "REJECTED",
        endedAt: new Date(),
        endedBy: socket.user._id,
      });
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:rejected", { reason: "Call rejected." });
    }
  });

  // 4. End Call
  socket.on("call:end", async (data) => {
    // data: { to, callId }
    const receiverSocketId = getReceiverSocketId(data.to);

    if (data.callId) {
      const call = await CallHistory.findById(data.callId);
      if (call) {
        const endedAt = new Date();
        const duration = call.startedAt ? Math.round((endedAt - new Date(call.startedAt)) / 1000) : 0;

        call.status = "ENDED";
        call.endedAt = endedAt;
        call.duration = duration;
        call.endedBy = socket.user._id;
        await call.save();
      }
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:ended", { reason: "Call ended." });
    }
  });

  // 5. Signaling (ICE Candidates)
  socket.on("call:signal", (data) => {
    // data: { to, candidate }
    const receiverSocketId = getReceiverSocketId(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:signal", { candidate: data.candidate });
    }
  });

  // --- Voice Call Signaling ---

  // 1. Initiate Voice Call
  socket.on("voice:call:initiate", async (data) => {
    console.log("SOCKET: voice:call:initiate received", data);
    try {
      const receiverSocketId = getReceiverSocketId(data.userToCall);
      const sender = socket.user;

      // Eligibility Check (Sender)
      if (sender.plan !== "PRO") {
        socket.emit("voice:call:error", { message: "You must be PRO to make a voice call." });
        return;
      }

      // Eligibility Check (Receiver)
      const receiver = await User.findById(data.userToCall);
      if (!receiver || receiver.plan !== "PRO") {
        socket.emit("voice:call:error", { message: "The other user is not eligible (needs PRO)." });
        return;
      }

      // Create Call History Entry
      const newCall = new CallHistory({
        callType: "VOICE",
        caller: sender._id,
        receiver: receiver._id,
        participants: [sender._id, receiver._id],
        status: "INITIATED",
      });
      await newCall.save();

      socket.emit("voice:call:created", { callId: newCall._id });

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("voice:call:incoming", {
          signal: data.signalData,
          from: data.from,
          name: data.name,
          callId: newCall._id,
        });
      } else {
        socket.emit("voice:call:error", { message: "User is offline." });

        newCall.status = "MISSED";
        newCall.endedAt = new Date();
        await newCall.save();
      }
    } catch (error) {
      console.error("Error in voice:call:initiate:", error);
      socket.emit("voice:call:error", { message: "Failed to initiate call." });
    }
  });

  // 2. Accept Voice Call
  socket.on("voice:call:accept", async (data) => {
    const receiverSocketId = getReceiverSocketId(data.to);

    if (data.callId) {
      await CallHistory.findByIdAndUpdate(data.callId, {
        status: "ONGOING",
        startedAt: new Date(),
      });
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("voice:call:accepted", { signal: data.signal, callId: data.callId });
    }
  });

  // 3. Reject Voice Call
  socket.on("voice:call:reject", async (data) => {
    const receiverSocketId = getReceiverSocketId(data.to);

    if (data.callId) {
      await CallHistory.findByIdAndUpdate(data.callId, {
        status: "REJECTED",
        endedAt: new Date(),
        endedBy: socket.user._id,
      });
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("voice:call:rejected", { reason: "Call rejected." });
    }
  });

  // 4. End Voice Call
  socket.on("voice:call:end", async (data) => {
    const receiverSocketId = getReceiverSocketId(data.to);

    if (data.callId) {
      const call = await CallHistory.findById(data.callId);
      if (call) {
        const endedAt = new Date();
        const duration = call.startedAt ? Math.round((endedAt - new Date(call.startedAt)) / 1000) : 0;

        call.status = "ENDED";
        call.endedAt = endedAt;
        call.duration = duration;
        call.endedBy = socket.user._id;
        await call.save();
      }
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("voice:call:ended", { reason: "Call ended." });
    }
  });

  // 5. Signaling (ICE Candidates)
  socket.on("voice:call:signal", (data) => {
    const receiverSocketId = getReceiverSocketId(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("voice:call:signal", { candidate: data.candidate });
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
