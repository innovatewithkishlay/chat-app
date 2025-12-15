import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useProductivityStore = create((set, get) => ({
    activeTab: "chat", // chat, kanban, notes
    setActiveTab: (tab) => set({ activeTab: tab }),

    // Kanban State
    board: null,
    tasks: [],
    isBoardLoading: false,

    // Notes State
    notes: [],
    activeNote: null,
    isNotesLoading: false,

    // Polls State
    polls: [],
    isPollsLoading: false,

    // Scheduled Messages State
    scheduledMessages: [],
    isScheduledLoading: false,

    // --- Kanban Actions ---
    fetchBoard: async (conversationId) => {
        set({ isBoardLoading: true });
        try {
            const res = await axiosInstance.get(`/kanban/${conversationId}`);
            set({ board: res.data.board, tasks: res.data.tasks });
        } catch (error) {
            if (error.response && error.response.status === 404) {
                set({ board: null, tasks: [] });
            } else {
                console.error("Error fetching board:", error);
                toast.error("Failed to load board");
            }
        } finally {
            set({ isBoardLoading: false });
        }
    },

    addTask: async (taskData) => {
        try {
            const res = await axiosInstance.post("/kanban/tasks", taskData);
            set((state) => ({ tasks: [...state.tasks, res.data] }));
            return res.data;
        } catch (error) {
            console.error("Error adding task:", error);
            toast.error("Failed to add task");
        }
    },

    updateTask: async (taskId, updates) => {
        // Optimistic Update
        set((state) => ({
            tasks: state.tasks.map((t) => (t._id === taskId ? { ...t, ...updates } : t)),
        }));

        try {
            await axiosInstance.put(`/kanban/tasks/${taskId}`, updates);
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Failed to update task");
            // Revert on error (could fetch board again)
            const { board } = get();
            if (board) get().fetchBoard(board.conversationId);
        }
    },

    moveTask: async (taskId, columnId, newOrder) => {
        const { tasks } = get();
        const task = tasks.find((t) => t._id === taskId);
        if (!task) return;

        // Optimistic Update
        const oldColumnId = task.columnId;
        const oldOrder = task.order;

        // 1. Remove from old position
        // 2. Insert into new position
        // This is complex to do perfectly optimistically without a library helper, 
        // but for simple visual feedback we can just update the task's local state 
        // and let the re-render handle it if we sort by order.

        // Simple optimistic: just update the task properties
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t._id === taskId ? { ...t, columnId, order: newOrder } : t
            ),
        }));

        try {
            await axiosInstance.put(`/kanban/tasks/${taskId}/move`, { columnId, newOrder });
        } catch (error) {
            console.error("Error moving task:", error);
            toast.error("Failed to move task");
            // Revert
            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t._id === taskId ? { ...t, columnId: oldColumnId, order: oldOrder } : t
                ),
            }));
        }
    },

    deleteTask: async (taskId) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t._id !== taskId) }));
        try {
            await axiosInstance.delete(`/kanban/tasks/${taskId}`);
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Failed to delete task");
        }
    },

    // Socket Events Handlers (to be called from component)
    handleTaskCreated: (newTask) => {
        set((state) => {
            if (state.tasks.some(t => t._id === newTask._id)) return state;
            return { tasks: [...state.tasks, newTask] };
        });
    },

    handleTaskUpdated: (updatedTask) => {
        set((state) => ({
            tasks: state.tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
        }));
    },

    handleTaskMoved: ({ taskId, columnId, newOrder }) => {
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t._id === taskId ? { ...t, columnId, order: newOrder } : t
            ),
        }));
    },

    handleTaskDeleted: (taskId) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t._id !== taskId) }));
    },

    // --- Notes Actions ---
    fetchNotes: async (conversationId) => {
        set({ isNotesLoading: true });
        try {
            const res = await axiosInstance.get(`/notes/${conversationId}`);
            set({ notes: res.data });
            if (res.data.length > 0 && !get().activeNote) {
                set({ activeNote: res.data[0] });
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            set({ isNotesLoading: false });
        }
    },

    createNote: async (conversationId, title, content) => {
        try {
            const res = await axiosInstance.post("/notes", { conversationId, title, content });
            set((state) => ({
                notes: [res.data, ...state.notes],
                activeNote: res.data
            }));
        } catch (error) {
            console.error("Error creating note:", error);
            toast.error("Failed to create note");
        }
    },

    updateNote: async (noteId, title, content) => {
        // Optimistic
        set((state) => ({
            notes: state.notes.map(n => n._id === noteId ? { ...n, title, content } : n),
            activeNote: state.activeNote?._id === noteId ? { ...state.activeNote, title, content } : state.activeNote
        }));

        try {
            await axiosInstance.put(`/notes/${noteId}`, { title, content });
        } catch (error) {
            console.error("Error updating note:", error);
        }
    },

    deleteNote: async (noteId) => {
        set((state) => ({
            notes: state.notes.filter(n => n._id !== noteId),
            activeNote: state.activeNote?._id === noteId ? null : state.activeNote
        }));
        try {
            await axiosInstance.delete(`/notes/${noteId}`);
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    },

    handleNoteCreated: (newNote) => {
        set((state) => ({ notes: [newNote, ...state.notes] }));
    },

    handleNoteUpdated: (updatedNote) => {
        set((state) => ({
            notes: state.notes.map(n => n._id === updatedNote._id ? updatedNote : n),
            activeNote: state.activeNote?._id === updatedNote._id ? updatedNote : state.activeNote
        }));
    },

    handleNoteDeleted: (noteId) => {
        set((state) => ({
            notes: state.notes.filter(n => n._id !== noteId),
            activeNote: state.activeNote?._id === noteId ? null : state.activeNote
        }));
    },

    setActiveNote: (note) => set({ activeNote: note }),

    // --- Polls Actions ---
    fetchPolls: async (conversationId) => {
        set({ isPollsLoading: true });
        try {
            const res = await axiosInstance.get(`/polls/${conversationId}`);
            set({ polls: res.data });
        } catch (error) {
            console.error("Error fetching polls:", error);
        } finally {
            set({ isPollsLoading: false });
        }
    },

    createPoll: async (pollData) => {
        try {
            const res = await axiosInstance.post("/polls", pollData);
            set((state) => ({ polls: [res.data, ...state.polls] }));
        } catch (error) {
            console.error("Error creating poll:", error);
            toast.error("Failed to create poll");
        }
    },

    votePoll: async (pollId, optionIndex) => {
        try {
            const res = await axiosInstance.post(`/polls/${pollId}/vote`, { optionIndex });
            set((state) => ({
                polls: state.polls.map(p => p._id === pollId ? res.data : p)
            }));
        } catch (error) {
            console.error("Error voting:", error);
            toast.error("Failed to vote");
        }
    },

    handlePollCreated: (newPoll) => {
        set((state) => ({ polls: [newPoll, ...state.polls] }));
    },

    handlePollUpdated: (updatedPoll) => {
        set((state) => ({
            polls: state.polls.map(p => p._id === updatedPoll._id ? updatedPoll : p)
        }));
    },

    // --- Scheduled Messages Actions ---
    fetchScheduledMessages: async (conversationId) => {
        set({ isScheduledLoading: true });
        try {
            const res = await axiosInstance.get(`/scheduled-messages/${conversationId}`);
            set({ scheduledMessages: res.data });
        } catch (error) {
            console.error("Error fetching scheduled messages:", error);
        } finally {
            set({ isScheduledLoading: false });
        }
    },

    scheduleMessage: async (data) => {
        try {
            const res = await axiosInstance.post("/scheduled-messages", data);
            set((state) => ({ scheduledMessages: [...state.scheduledMessages, res.data] }));
            toast.success("Message scheduled!");
        } catch (error) {
            console.error("Error scheduling message:", error);
            toast.error("Failed to schedule message");
        }
    },

    cancelScheduledMessage: async (messageId) => {
        set((state) => ({ scheduledMessages: state.scheduledMessages.filter(m => m._id !== messageId) }));
        try {
            await axiosInstance.delete(`/scheduled-messages/${messageId}`);
            toast.success("Scheduled message cancelled");
        } catch (error) {
            console.error("Error cancelling message:", error);
        }
    },

}));
