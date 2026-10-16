import { create } from "zustand";
import { axiosInstance, getErrorMessage } from "../lib/axios.js";
import toast from "react-hot-toast";

const isDev = import.meta.env.MODE === "development";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (isDev ? "http://localhost:5001" : "/");

// Remembers that this browser had a signed-in session last time. Without it
// we can't know whether to wait for /auth/check (which can take 30s+ while a
// Render instance cold-starts) or show the login screen immediately.
const SESSION_HINT_KEY = "touki:has-session";
const SLOW_REQUEST_MS = 3500;

const readSessionHint = () => {
    try {
        return localStorage.getItem(SESSION_HINT_KEY) === "1";
    } catch {
        return false;
    }
};

const writeSessionHint = (hasSession) => {
    try {
        if (hasSession) localStorage.setItem(SESSION_HINT_KEY, "1");
        else localStorage.removeItem(SESSION_HINT_KEY);
    } catch {
        // Storage can be unavailable (private mode); the hint is only an optimisation.
    }
};

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    // Only block the UI on the auth check when we expect a session. Visitors
    // with no prior session see the login screen instantly while the check
    // runs in the background.
    isCheckingAuth: readSessionHint(),
    // True while an auth request has been pending long enough that the
    // server is probably waking up from sleep.
    isServerWaking: false,
    onlineUsers: [],
    blockedUsers: [],
    socket: null,

    // Runs an auth request and flags isServerWaking if it is slow, so the UI
    // can explain the delay instead of looking frozen.
    _withWakeNotice: async (request) => {
        const timer = setTimeout(() => set({ isServerWaking: true }), SLOW_REQUEST_MS);
        try {
            return await request();
        } finally {
            clearTimeout(timer);
            set({ isServerWaking: false });
        }
    },

    _onAuthenticated: (user) => {
        writeSessionHint(true);
        set({ authUser: user });
        get().fetchBlockedUsers();
        get().connectSocket();
    },

    checkAuth: async () => {
        try {
            // (If the user logs in manually while this is pending, the
            // duplicate _onAuthenticated below is harmless: connectSocket
            // is idempotent.)
            const res = await get()._withWakeNotice(() => axiosInstance.get("/auth/check"));
            get()._onAuthenticated(res.data);
        } catch (error) {
            // A 401 means the session is really gone; a network error just
            // means we couldn't reach the server, so keep the hint for next time.
            // Either way, don't clobber a login that completed while this
            // check was in flight.
            if (!get().authUser) {
                if (error?.response?.status === 401) writeSessionHint(false);
                set({ blockedUsers: [] });
            }
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await get()._withWakeNotice(() => axiosInstance.post("/auth/signup", data));
            get()._onAuthenticated(res.data);
            toast.success("Account created successfully");
            return true;
        } catch (error) {
            toast.error(getErrorMessage(error));
            return false;
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await get()._withWakeNotice(() => axiosInstance.post("/auth/login", data));
            get()._onAuthenticated(res.data);
            toast.success("Logged in successfully");
            return true;
        } catch (error) {
            toast.error(getErrorMessage(error));
            return false;
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
        } catch (error) {
            // Still sign out locally - otherwise a network hiccup leaves the
            // user stuck in a session they asked to leave.
            console.error("Error in logout:", error);
        }
        writeSessionHint(false);
        get().disconnectSocket();
        set({ authUser: null, blockedUsers: [], onlineUsers: [] });
        toast.success("Logged out successfully");
    },

    isRequestingReset: false,
    forgotPassword: async (email) => {
        set({ isRequestingReset: true });
        try {
            const res = await axiosInstance.post("/auth/forgot-password", { email });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Try again.");
            return false;
        } finally {
            set({ isRequestingReset: false });
        }
    },

    isResettingPassword: false,
    resetPassword: async (token, password) => {
        set({ isResettingPassword: true });
        try {
            const res = await axiosInstance.post("/auth/reset-password", { token, password });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Try again.");
            return false;
        } finally {
            set({ isResettingPassword: false });
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axiosInstance.put("/auth/update-profile", data);
            set({ authUser: res.data });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile:", error);
            toast.error(getErrorMessage(error));
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    fetchBlockedUsers: async () => {
        try {
            const res = await axiosInstance.get("/users/blocked");
            set({ blockedUsers: res.data });
        } catch (error) {
            console.error("Error fetching blocked users:", error);
        }
    },

    blockUser: async (targetUserId) => {
        try {
            const res = await axiosInstance.post("/users/block", { targetUserId });
            set({ blockedUsers: res.data });
            toast.success("User blocked successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to block user");
        }
    },

    unblockUser: async (targetUserId) => {
        try {
            const res = await axiosInstance.post("/users/unblock", { targetUserId });
            set({ blockedUsers: res.data });
            toast.success("User unblocked successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to unblock user");
        }
    },

    _socketPromise: null,
    connectSocket: async () => {
        const { authUser } = get();
        // An existing socket handles its own reconnects, so never open a second one.
        if (!authUser || get().socket || get()._socketPromise) return;

        // socket.io-client is loaded on demand so the login/signup screens
        // don't have to download it.
        const promise = import("socket.io-client").then(({ io }) => {
            const user = get().authUser;
            // Logged out (or switched account) while the client was loading.
            if (!user || user._id !== authUser._id) return;

            const socket = io(BASE_URL, {
                query: {
                    userId: user._id,
                },
                withCredentials: true,
            });

            socket.on("getOnlineUsers", (userIds) => {
                set({ onlineUsers: userIds });
            });

            set({ socket });
        });
        set({ _socketPromise: promise });
        try {
            await promise;
        } catch (error) {
            console.error("Failed to load realtime client:", error);
        } finally {
            set({ _socketPromise: null });
        }
    },
    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.off("getOnlineUsers");
            socket.disconnect();
        }
        set({ socket: null });
    },
}));
