import React, { useState, useEffect, useRef } from "react";
import { useProductivityStore } from "../../store/useProductivityStore";
import { Save, Loader2 } from "lucide-react";

const NoteEditor = () => {
    const activeNote = useProductivityStore((state) => state.activeNote);
    const updateNote = useProductivityStore((state) => state.updateNote);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title);
            setContent(activeNote.content);
        }
    }, [activeNote]);

    const handleSave = async () => {
        if (!activeNote) return;
        setIsSaving(true);
        await updateNote(activeNote._id, title, content);
        setIsSaving(false);
    };

    // Auto-save debounce
    useEffect(() => {
        if (!activeNote) return;

        // Don't auto-save if nothing changed
        if (title === activeNote.title && content === activeNote.content) return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            handleSave();
        }, 2000);

        return () => clearTimeout(timeoutRef.current);
    }, [title, content, activeNote]);

    if (!activeNote) {
        return (
            <div className="flex-1 flex items-center justify-center text-base-content/30">
                Select a note to edit
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-base-100">
            {/* Toolbar */}
            <div className="p-4 border-b border-base-300 flex items-center justify-between">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-bold bg-transparent border-none focus:outline-none w-full"
                    placeholder="Note Title"
                />
                <div className="flex items-center gap-2 text-xs opacity-60">
                    {isSaving ? (
                        <span className="flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> Saving...
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <Save size={12} /> Saved
                        </span>
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-6 resize-none bg-transparent focus:outline-none leading-relaxed"
                placeholder="Start typing..."
            />
        </div>
    );
};

export default NoteEditor;
