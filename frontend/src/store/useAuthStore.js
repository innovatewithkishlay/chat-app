import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

const useAuthStore = create((set) => ({
  authUser: null,
  isSigningIn: false,
  isLoggingIn: false,
  isUpdatingProfile: false,

  isCheckingAuth: true,
  checkAuth: async () => {
    try {
      const user = await axiosInstance("/auth/check");
      set({ authUser: user.data });
    } catch (error) {
      console.log(
        "somehthing went wrong inside the useauthstore inside frotend folder insde the store folder ",
        error.message
      );
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data) => {},
}));
export { useAuthStore };
