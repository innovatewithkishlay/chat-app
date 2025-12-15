import React from "react";
import NotesList from "./NotesList";
import NoteEditor from "./NoteEditor";

const NotesContainer = () => {
    return (
        <div className="flex h-full w-full bg-base-100">
            <NotesList />
            <NoteEditor />
        </div>
    );
};

export default NotesContainer;
