import Note from "../models/note.model.js";
import Conversation from "../models/conversation.model.js";
import { io } from "../lib/socket.js";

const checkPermission = async (userId, conversationId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const isParticipant = conversation.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) throw new Error("Not authorized");
    return conversation;
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

        await checkPermission(userId, conversationId);

        const newNote = new Note({
            conversationId,
            title,
            content,
            createdBy: userId,
            versions: [{ content, updatedBy: userId }]
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
