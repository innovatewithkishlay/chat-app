import Note from "../models/note.model.js";
import Conversation from "../models/conversation.model.js";
import Group from "../models/group.model.js";
import { io } from "../lib/socket.js";

const checkPermission = async (userId, conversationId) => {
    console.log(`[checkPermission] Checking for User: ${userId}, Entity: ${conversationId}`);

    // 1. Try finding conversation
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
        console.log(`[checkPermission] Found Conversation. Participants:`, conversation.participants);
        const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
        if (!isParticipant) {
            console.error(`[checkPermission] User ${userId} is NOT a participant in Conversation ${conversationId}`);
            throw new Error("Not authorized in this conversation");
        }
        return conversation;
    }

    // 2. Try finding group
    const group = await Group.findById(conversationId);
    if (group) {
        console.log(`[checkPermission] Found Group. Members:`, group.members);
        const isMember = group.members.some(m => m.toString() === userId.toString());
        if (!isMember) {
            console.error(`[checkPermission] User ${userId} is NOT a member of Group ${conversationId}`);
            throw new Error("Not authorized in this group");
        }
        return group;
    }

    // 3. Neither found
    console.error(`[checkPermission] Entity NOT FOUND: ${conversationId}`);
    throw new Error("Conversation or Group not found");
};

export const getNotes = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        await checkPermission(userId, conversationId);

        const notes = await Note.find({ conversationId }).sort({ updatedAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        console.error("Error in getNotes:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createNote = async (req, res) => {
    try {
        const { conversationId, title, content } = req.body;

        // 1. Check if user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }
        const userId = req.user._id;

        // 2. Validate required fields
        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Title is required" });
        }

        // 3. Check permissions
        try {
            await checkPermission(userId, conversationId);
        } catch (permError) {
            console.error("Permission Check Failed:", permError.message);
            return res.status(403).json({ message: permError.message || "Not authorized to create note in this conversation" });
        }

        const newNote = new Note({
            conversationId,
            title,
            content: content || "",
            createdBy: userId,
            versions: [{ content: content || "", updatedBy: userId }]
        });

        console.log("[createNote] Attempting to save note:", {
            conversationId,
            title,
            createdBy: userId
        });

        try {
            await newNote.save();
            console.log("[createNote] Note saved successfully:", newNote._id);
        } catch (dbError) {
            console.error("[createNote] DB Save Error:", dbError);
            throw dbError; // Re-throw to main catch
        }

        if (global.io) {
            global.io.to(conversationId.toString()).emit("note:created", newNote);
        } else if (io) {
            io.to(conversationId.toString()).emit("note:created", newNote);
        } else {
            console.warn("[createNote] Socket.io instance not found, skipping emit");
        }

        res.status(201).json(newNote);
    } catch (error) {
        console.error("CREATE NOTE ERROR:", error);
        console.error("Stack:", error.stack);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
};

export const updateNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const { title, content } = req.body;
        const userId = req.user._id;

        const note = await Note.findById(noteId);
        if (!note) return res.status(404).json({ message: "Note not found" });

        await checkPermission(userId, note.conversationId);

        // Create a version snapshot if content changed significantly (optional logic)
        // For now, we push a version on every save
        note.versions.push({
            content: note.content,
            updatedBy: note.updatedBy || note.createdBy,
            timestamp: new Date()
        });

        // Limit versions to last 20 to save space
        if (note.versions.length > 20) {
            note.versions.shift();
        }

        note.title = title || note.title;
        note.content = content || note.content;
        note.updatedBy = userId;

        await note.save();

        io.to(note.conversationId.toString()).emit("note:updated", note);

        res.status(200).json(note);
    } catch (error) {
        console.error("Error in updateNote:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deleteNote = async (req, res) => {
    try {
        const { noteId } = req.params;
        const userId = req.user._id;

        const note = await Note.findById(noteId);
        if (!note) return res.status(404).json({ message: "Note not found" });

        await checkPermission(userId, note.conversationId);

        await Note.findByIdAndDelete(noteId);

        io.to(note.conversationId.toString()).emit("note:deleted", noteId);

        res.status(200).json({ message: "Note deleted" });
    } catch (error) {
        console.error("Error in deleteNote:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
