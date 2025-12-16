import React, { useEffect, memo } from "react";
import { useProductivityStore } from "../../store/useProductivityStore";
import { useChatStore } from "../../store/useChattingStore";
import { Plus, FileText, Trash2, Clock } from "lucide-react";
import { NotesSkeleton } from "../skeletons/ProductivitySkeletons";

const NoteItem = memo(({ note, isActive, onClick, onDelete }) => (
    <div
        onClick={() => onClick(note)}
        className={`
      p-3 rounded-lg cursor-pointer transition-all group relative
      ${isActive ? "bg-primary/10 text-primary" : "hover:bg-base-200"}
    `}
    >
        <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="opacity-70" />
            <span className="font-medium text-sm truncate">{note.title || "Untitled"}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] opacity-60">
            <span className="flex items-center gap-1">
                <Clock size={10} />
                {new Date(note.updatedAt).toLocaleDateString()}
            </span>
        </div>

        <button
            onClick={(e) => {
                e.stopPropagation();
                onDelete(note._id);
            }}
            className="absolute right-2 top-2 p-1 rounded hover:bg-base-300 opacity-0 group-hover:opacity-100 transition-opacity text-error"
        >
            <Trash2 size={12} />
        </button>
    </div>
));

const NotesList = () => {
    const selectedUser = useChatStore((state) => state.selectedUser);

    const notes = useProductivityStore((state) => state.notes);
    const fetchNotes = useProductivityStore((state) => state.fetchNotes);
    const createNote = useProductivityStore((state) => state.createNote);
    const deleteNote = useProductivityStore((state) => state.deleteNote);
    const setActiveNote = useProductivityStore((state) => state.setActiveNote);
    const activeNote = useProductivityStore((state) => state.activeNote);
    const isNotesLoading = useProductivityStore((state) => state.isNotesLoading);

    const conversations = useChatStore((state) => state.conversations);

    const getConversationId = () => {
        if (!selectedUser) return null;

        const isGroup = selectedUser.groupMembers !== undefined || selectedUser.admins !== undefined;
        if (isGroup) return selectedUser._id;

        const conversation = conversations.find(c =>
            c.participants.some(p => p._id === selectedUser._id)
        );
        return conversation ? conversation._id : null;
    };

    useEffect(() => {
        const conversationId = getConversationId();
        if (conversationId) {
            fetchNotes(conversationId);
        }
    }, [selectedUser, conversations, fetchNotes]);

    const handleCreateNote = async () => {
        const conversationId = getConversationId();
        if (!conversationId) return;
        await createNote(conversationId, "Untitled Note", "");
    };

    const handleDeleteNote = (noteId) => {
        if (window.confirm("Delete this note?")) deleteNote(noteId);
    };

    if (isNotesLoading && notes.length === 0) {
        return (
            <div className="w-64 border-r border-base-300 bg-base-200/30 flex flex-col h-full">
                <div className="p-4 space-y-4 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-base-300 rounded"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-64 border-r border-base-300 bg-base-200/30 flex flex-col h-full">
            <div className="p-3 border-b border-base-300 flex items-center justify-between">
                <h3 className="font-bold text-sm">Notes</h3>
                <button onClick={handleCreateNote} className="btn btn-xs btn-circle btn-primary">
                    <Plus size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {notes.map((note) => (
                    <NoteItem
                        key={note._id}
                        note={note}
                        isActive={activeNote?._id === note._id}
                        onClick={setActiveNote}
                        onDelete={handleDeleteNote}
                    />
                ))}

                {notes.length === 0 && (
                    <div className="text-center py-8 opacity-50 text-sm">
                        No notes yet. <br /> Click + to create one.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesList;
