import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
    getNotes,
    createNote,
    updateNote,
    deleteNote
} from "../controllers/note.controller.js";

const router = express.Router();

router.get("/:conversationId", protectRoute, getNotes);
router.post("/", protectRoute, createNote);
router.put("/:noteId", protectRoute, updateNote);
router.delete("/:noteId", protectRoute, deleteNote);

export default router;
