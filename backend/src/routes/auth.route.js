import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  checkUser,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkUser);

export { router };
