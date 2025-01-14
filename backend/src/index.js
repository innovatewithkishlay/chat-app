import express from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import { router as authRoutes } from "./routes/auth.route.js";
import { connectDb } from "./lib/db.js";
app.use(express.json());
const port = process.env.PORT || 6000;
app.use("/api/auth", authRoutes);
app.listen(port, () => {
  console.log("app is lisining at port ", port);
  connectDb();
});
