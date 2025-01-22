import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
const useAuthStore = create((set) => ({
  authUser: null,
  isSigningIn: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUser: [],
  isCheckingAuth: true,
  checkAuth: async () => {
    try {
      const user = await axiosInstance("/auth/check");
      set({ authUser: user.data });
    } catch (error) {
      console.log(
        "something went wrong inside the useauthstore inside frotend folder insde the store folder ",
        error
      );
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data) => {
    set({ isSigningIn: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
    } catch (error) {
      console.error(
        "Something went wrong inside the useAuthStore in frontend",
        error
      );
    } finally {
      set({ isSigningIn: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged-out successfully");
    } catch (error) {
      console.log(
        "something went wrong inside the userAuthstore in logout function",
        error.message
      );
    }
  },
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      console.log(res);

      set({ authUser: res.data });
      if (res.statusText == "OK") {
        toast.success("Logged in successfully");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong in login route  . Please try again.");
        console.log(error);
      }

      console.log("Error inside login useAuthStore:", error);
    } finally {
      set({ isLoggingIn: false });
    }
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      console.log("Update profile response:", res);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
}));
export { useAuthStore };
