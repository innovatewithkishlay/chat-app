import express from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import { router as authRoutes } from "./routes/auth.route.js";
const port = process.env.PORT || 6000;
app.use("/api/auth", authRoutes);
app.listen(port, () => {
  console.log("app is lisining at port 5000");
});
