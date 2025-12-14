import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useCallHistoryStore = create((set, get) => ({
    calls: [],
    isLoading: false,

    getCallHistory: async () => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get("/calls");
            set({ calls: res.data });
        } catch (error) {
            console.error("Failed to fetch call history:", error);
            toast.error("Failed to load call history");
        } finally {
            set({ isLoading: false });
        }
    },

    clearCallHistory: async () => {
        try {
            await axiosInstance.post("/calls/clear");
            set({ calls: [] });
            toast.success("Call history cleared");
        } catch (error) {
            console.error("Failed to clear call history:", error);
            toast.error("Failed to clear call history");
        }
    },

    subscribeToCallUpdates: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // We can listen for generic "call:history:update" if we implement it,
        // or just re-fetch on call end events.
        // For now, let's re-fetch on call end to keep it simple and robust.

        socket.on("call:ended", () => {
            get().getCallHistory();
        });

        socket.on("voice:call:ended", () => {
            get().getCallHistory();
        });

        socket.on("call:rejected", () => {
            get().getCallHistory();
        });

        socket.on("voice:call:rejected", () => {
            get().getCallHistory();
        });
    },

    unsubscribeFromCallUpdates: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        socket.off("call:ended");
        socket.off("voice:call:ended");
        socket.off("call:rejected");
        socket.off("voice:call:rejected");
    },
}));
