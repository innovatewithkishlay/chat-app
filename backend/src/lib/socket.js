import { Server } from "socket.io";
import express from "express";
import http from "http";
import express from "express";
import { Socket } from "dgram";
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:5173"] },
});
io.on("connection", (socket) => {
  console.log("A connection has been established with socket io ", socket.id);
  socket.on("disconnect", () => {
    console.log("Disconnected", socket.id);
  });
});
export { io, app, server };
