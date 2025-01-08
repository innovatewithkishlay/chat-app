import express from "express";
const router = express.Router();
import { signup, login, logout } from "../controllers/auth.controller.js";

router
  .route("/signup")
  .get(signup)
  .post((req, res) => res.send("posting"));

router.post("/login", login);
router.post("/logout", logout);
export { router };
