import { Server } from "socket.io";
import http from "http";
import express from "express";

import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import CallHistory from "../models/callHistory.model.js";

const app = express();
const server = http.createServer(app);

export const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {}; // {userId: socketId}

// Tracks who is currently on a call (voice or video), so a second incoming
// call can be rejected as "busy" instead of ringing forever, and so the
// remaining participant can be notified if their peer disconnects mid-call.
const activeCalls = new Map(); // userId -> { peerId, callId, event: "call" | "voice:call" }

function markCallActive(userId, peerId, callId, event) {
  activeCalls.set(userId, { peerId, callId, event });
  activeCalls.set(peerId, { peerId: userId, callId, event });
}

function clearActiveCall(userId, peerId) {
  activeCalls.delete(userId);
  activeCalls.delete(peerId);
}

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

  // Productivity features (notes/polls/kanban/scheduled messages) broadcast
  // to a room named by conversationId, which also covers 1-1 chats — those
  // need an explicit join since they aren't covered by joinGroup.
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("leaveConversation", (conversationId) => {
    socket.leave(conversationId);
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

  // --- Message Status Tracking ---
  socket.on("messageDelivered", async (messageId) => {
    try {
      const Message = (await import("../models/message.model.js")).default;
      const message = await Message.findByIdAndUpdate(messageId, { status: "delivered" }, { new: true });

      if (message) {
        const senderSocketId = getReceiverSocketId(message.senderId);
        if (senderSocketId) {
          // Tell the sender that their message was delivered
          io.to(senderSocketId).emit("messagesDelivered", {
            messageId: message._id,
            receiverId: userId
          });
        }
      }
    } catch (error) {
      console.error("Error marking message as delivered via socket:", error);
    }
  });

  socket.on("messagesRead", async (chatId) => {
    try {
      const Message = (await import("../models/message.model.js")).default;
      // Mark all messages from the sender as 'read'
      await Message.updateMany(
        { senderId: chatId, recieverId: userId, status: { $ne: "read" } },
        { $set: { status: "read" } }
      );

      const senderSocketId = getReceiverSocketId(chatId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageRead", {
          chatId: userId
        });
      }
    } catch (error) {
      console.error("Error marking messages as read via socket:", error);
    }
  });

  // WebRTC Signaling
  // --- WebRTC Signaling (Strict State Machine) ---

  // 1. Initiate Call
  socket.on("call:initiate", async (data) => {
    // data: { userToCall, signalData, from, name }
    try {
      const receiverSocketId = getReceiverSocketId(data.userToCall);
      const sender = socket.user;

      // Eligibility Check (Sender)
      if (sender.plan !== "PRO") {
        socket.emit("call:error", { message: "You must be PRO to make a video call." });
        return;
      }

      // Eligibility Check (Receiver)
      const receiver = await User.findById(data.userToCall);
      if (!receiver || receiver.plan !== "PRO") {
        socket.emit("call:error", { message: "The other user is not eligible (needs PRO)." });
        return;
      }

      if (activeCalls.has(sender._id.toString())) {
        socket.emit("call:error", { message: "You are already on a call." });
        return;
      }
      if (activeCalls.has(data.userToCall)) {
        socket.emit("call:error", { message: "The other user is busy on another call." });
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
        io.to(receiverSocketId).emit("call:incoming", {
          signal: data.signalData,
          from: data.from,
          name: data.name,
          callId: newCall._id,
        });
      } else {
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

    markCallActive(userId, data.to, data.callId, "call");

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

    clearActiveCall(userId, data.to);

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

      if (activeCalls.has(sender._id.toString())) {
        socket.emit("voice:call:error", { message: "You are already on a call." });
        return;
      }
      if (activeCalls.has(data.userToCall)) {
        socket.emit("voice:call:error", { message: "The other user is busy on another call." });
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

    markCallActive(userId, data.to, data.callId, "voice:call");

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

    clearActiveCall(userId, data.to);

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
    // On a flaky connection (mobile especially), the client can reconnect
    // with a brand-new socket before the server notices the old one is
    // gone. If that's already happened, userSocketMap[userId] now points
    // at the NEW socket - this disconnect event is stale and must not
    // tear any of that down, or the user gets incorrectly marked offline,
    // stops receiving live messages, and a live call gets killed out from
    // under them.
    if (userSocketMap[userId] !== socket.id) return;

    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // If this user was mid-call, let their peer know instead of leaving
    // them connected to a dead stream indefinitely.
    const call = activeCalls.get(userId);
    if (call) {
      const peerSocketId = getReceiverSocketId(call.peerId);
      if (peerSocketId) {
        io.to(peerSocketId).emit(`${call.event}:ended`, { reason: "Peer disconnected." });
      }
      if (call.callId) {
        try {
          const callDoc = await CallHistory.findById(call.callId);
          if (callDoc && callDoc.status !== "ENDED") {
            const endedAt = new Date();
            callDoc.status = "ENDED";
            callDoc.endedAt = endedAt;
            callDoc.duration = callDoc.startedAt
              ? Math.round((endedAt - new Date(callDoc.startedAt)) / 1000)
              : 0;
            callDoc.endedBy = userId;
            await callDoc.save();
          }
        } catch (error) {
          console.error("Error closing call on disconnect:", error);
        }
      }
      clearActiveCall(userId, call.peerId);
    }

    // Update lastSeen
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    } catch (error) {
      console.error("Error updating lastSeen:", error);
    }
  });
});

export { io, app, server };
