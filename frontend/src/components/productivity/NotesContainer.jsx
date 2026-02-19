import React from "react";
import NotesList from "./NotesList";
import NoteEditor from "./NoteEditor";
import { useProductivityStore } from "../../store/useProductivityStore";

const NotesContainer = () => {
    const activeNote = useProductivityStore((state) => state.activeNote);

    return (
        <div className="flex h-full w-full bg-base-100 overflow-hidden relative">
            {/* Notes List - Hidden on mobile if note is active */}
            <div className={`
                w-full md:w-80 h-full border-r border-base-300 bg-base-100/30
                ${activeNote ? "hidden md:flex" : "flex"}
                flex-col
            `}>
                <NotesList />
            </div>

            {/* Note Editor - Full width on mobile when active, hidden if not active on mobile */}
            <div className={`
                flex-1 h-full bg-base-100
                ${activeNote ? "flex" : "hidden md:flex"}
                flex-col
            `}>
                <NoteEditor />
            </div>
        </div>
    );
};

export default NotesContainer;
