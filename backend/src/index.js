import express from "express";
const app = express();
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
import { router as authRoutes } from "./routes/auth.route.js";
import { router as messageRoutes } from "./routes/message.route.js";
import { connectDb } from "./lib/db.js";
app.use(express.json());
app.use(cookieParser());
const port = process.env.PORT || 6000;
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

app.listen(port, () => {
  console.log("app is lisining at port ", port);
  connectDb();
});
