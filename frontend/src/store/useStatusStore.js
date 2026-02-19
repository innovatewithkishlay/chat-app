import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useStatusStore = create((set, get) => ({
    statuses: [], // Array of { userId: userObj, stories: [] }
    myStatus: null, // { userId: me, stories: [] }
    isLoading: false,
    error: null,
    hasUnseen: false, // For sidebar indicator

    // 1. Fetch Statuses
    fetchStatuses: async () => {
        set({ isLoading: true });
        try {
            const res = await axiosInstance.get("/status");
            const allStatuses = res.data;
            const myId = useAuthStore.getState().authUser?._id;

            let myStatus = null;
            let friendsStatuses = [];

            allStatuses.forEach((status) => {
                if (status.userId._id === myId) {
                    myStatus = status;
                } else {
                    friendsStatuses.push(status);
                }
            });

            // Calculate hasUnseen (naive logic: if any friend status > last viewed? 
            // Backend doesn't give separate 'viewed' flag per user easily without large payload.
            // Frontend can check if I am in 'viewers' array of stories.
            let hasNew = false;
            friendsStatuses.forEach(doc => {
                const hasUnwatched = doc.stories.some(story =>
                    !story.viewers.some(v => (v.userId?._id === myId) || (v.userId === myId))
                );
                if (hasUnwatched) hasNew = true;
            });

            set({
                statuses: friendsStatuses,
                myStatus: myStatus,
                hasUnseen: hasNew
            });

        } catch (error) {
            console.error("Error fetching statuses:", error);
            set({ error: error.response?.data?.message || "Failed to fetch statuses" });
        } finally {
            set({ isLoading: false });
        }
    },

    // 2. Create Status
    createStatus: async (statusData) => {
        // statusData: { type, content, color, privacy }
        try {
            const res = await axiosInstance.post("/status", statusData);
            const newStatusDoc = res.data;

            // Update myStatus state
            // Backend returns the full updated document.
            set({ myStatus: newStatusDoc });
            toast.success("Status posted!");
            return true;
        } catch (error) {
            console.error("Error creating status:", error);
            toast.error(error.response?.data?.message || "Failed to post status");
            return false;
        }
    },

    // 3. View Status
    viewStatus: async (statusId, storyId) => {
        try {
            // Optimistic Update
            const { statuses } = get();
            const myId = useAuthStore.getState().authUser?._id;

            // Find and clone
            const updatedStatuses = statuses.map(doc => {
                if (doc._id === statusId) {
                    const updatedStories = doc.stories.map(story => {
                        if (story._id === storyId) {
                            // Check if already viewed
                            const alreadyViewed = story.viewers.some(v => (v.userId?._id === myId) || (v.userId === myId));
                            if (!alreadyViewed) {
                                return {
                                    ...story,
                                    viewerCount: story.viewerCount + 1,
                                    viewers: [...story.viewers, { userId: { _id: myId }, viewedAt: new Date() }]
                                };
                            }
                        }
                        return story;
                    });
                    return { ...doc, stories: updatedStories };
                }
                return doc;
            });

            set({ statuses: updatedStatuses });

            // API Call
            await axiosInstance.post("/status/view", { statusId, storyId });

        } catch (error) {
            console.error("Error viewing status:", error);
            // Revert (omitted for brevity, usually refresh)
        }
    },

    // 4. Delete Status
    deleteStatus: async (storyId) => {
        try {
            await axiosInstance.delete(`/status/${storyId}`);

            // Update myStatus locally
            const { myStatus } = get();
            if (myStatus) {
                const updatedStories = myStatus.stories.filter(s => s._id !== storyId);
                set({
                    myStatus: { ...myStatus, stories: updatedStories }
                });
            }
            toast.success("Status deleted");
        } catch (error) {
            console.error("Error deleting status:", error);
            toast.error("Failed to delete status");
        }
    },

    // 5. Socket Listeners
    subscribeToStatusEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // A. Status Posted (Friends)
        socket.on("status:posted", (data) => {
            // data: { userId, username, profilePic, hasNewStatus }
            // We should ideally fetch the new status or optimistically construct it.
            // Since the payload is thin, let's just trigger a re-fetch or mark an indicator.
            // For a robust app, re-fetch specific user's status is better, but fetchAll is easier for now.
            get().fetchStatuses();
            toast("New status from " + data.username, { icon: "🔵" });
        });

        // B. Status Viewed (Own)
        socket.on("status:viewed", (data) => {
            // data: { storyId, viewer: { ... } }
            const { myStatus } = get();
            if (!myStatus) return;

            const updatedStories = myStatus.stories.map(story => {
                if (story._id === data.storyId) {
                    // Avoid dupes in state
                    const viewerIdString = data.viewer._id.toString();
                    const alreadyIn = story.viewers.some(v => {
                        const existingId = v.userId._id ? v.userId._id.toString() : v.userId.toString();
                        return existingId === viewerIdString;
                    });

                    if (!alreadyIn) {
                        return {
                            ...story,
                            viewerCount: story.viewerCount + 1,
                            viewers: [...story.viewers, { userId: data.viewer, viewedAt: new Date() }]
                        };
                    }
                }
                return story;
            });

            set({ myStatus: { ...myStatus, stories: updatedStories } });
        });

        // C. Status Deleted
        socket.on("status:deleted", (data) => {
            // data: { userId, storyId }
            const { statuses, myStatus } = get();
            const myId = useAuthStore.getState().authUser?._id;

            if (data.userId === myId) {
                // My status deleted (handled by action mostly, but good for multi-device)
                if (myStatus) {
                    const updatedStories = myStatus.stories.filter(s => s._id !== data.storyId);
                    set({ myStatus: { ...myStatus, stories: updatedStories } });
                }
            } else {
                // Friend status deleted
                const updatedFriends = statuses.map(doc => {
                    if (doc.userId._id === data.userId || doc.userId === data.userId) {
                        return {
                            ...doc,
                            stories: doc.stories.filter(s => s._id !== data.storyId)
                        };
                    }
                    return doc;
                }).filter(doc => doc.stories.length > 0); // Remove if empty

                set({ statuses: updatedFriends });
            }
        });
    },

    unsubscribeFromStatusEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("status:posted");
        socket.off("status:viewed");
        socket.off("status:deleted");
    },

    // 5.5 Fetch Viewers (Owner or authorized)
    fetchStatusViewers: async (storyId) => {
        try {
            const res = await axiosInstance.get(`/status/${storyId}/viewers`);
            return res.data.viewers;
        } catch (error) {
            console.error("Error fetching status viewers:", error);
            // toast.error(error.response?.data?.message || "Failed to fetch viewers");
            // Return empty array or throw? Component handles loading state usually.
            return [];
        }
    },

    // 6. UI Control
    activeStatus: null, // The status document currently being viewed
    openStatus: (status) => set({ activeStatus: status, activeStatusCreation: false }),
    closeStatus: () => set({ activeStatus: null }),

    activeStatusCreation: false,
    openCreateStatus: () => set({ activeStatusCreation: true, activeStatus: null }),
    closeCreateStatus: () => set({ activeStatusCreation: false }),

}));
