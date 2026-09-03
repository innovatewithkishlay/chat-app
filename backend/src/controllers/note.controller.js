import Note from "../models/note.model.js";
import Conversation from "../models/conversation.model.js";
import Group from "../models/group.model.js";
import { io } from "../lib/socket.js";

const checkPermission = async (userId, conversationId) => {
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
        const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
        if (!isParticipant) throw new Error("Not authorized in this conversation");
        return conversation;
    }

    const group = await Group.findById(conversationId);
    if (group) {
        const isMember = group.members.some(m => m.toString() === userId.toString());
        if (!isMember) throw new Error("Not authorized in this group");
        return group;
    }

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

        const userId = req.user._id;

        if (!conversationId) {
            return res.status(400).json({ message: "conversationId is required" });
        }
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Title is required" });
        }

        try {
            await checkPermission(userId, conversationId);
        } catch (permError) {
            return res.status(403).json({ message: permError.message });
        }

        const newNote = new Note({
            conversationId,
            title,
            content: content || "",
            createdBy: userId,
            versions: [{ content: content || "", updatedBy: userId }]
        });

        await newNote.save();

        io.to(conversationId.toString()).emit("note:created", newNote);

        res.status(201).json(newNote);
    } catch (error) {
        console.error("Error in createNote:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
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
