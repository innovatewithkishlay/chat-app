import express from "express";
const router = express.Router();
import {
  signup,
  login,
  logout,
  updateProfile,
  checkUser,
} from "../controllers/auth.controller.js";
// now bringing the protect route from auth middleware
import { protectRoute } from "../middlewares/auth.middleware.js";
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.put("/update-profile", protectRoute, updateProfile);
router.get("/check", protectRoute, checkUser);
export { router };
