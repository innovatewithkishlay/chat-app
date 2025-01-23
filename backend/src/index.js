import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { app, server } from "../src/lib/socket.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { router as authRoutes } from "./routes/auth.route.js";
import { router as messageRoutes } from "./routes/message.route.js";
import { connectDb } from "./lib/db.js";
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
const port = process.env.PORT || 8000;
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

server.listen(port, () => {
  console.log("app is lisining at port ", port);
  connectDb();
});
