import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SettingPage from "./pages/SettingPage";
import ProfilePage from "./pages/ProfilePage";
import ProPage from "./pages/ProPage";
import DeveloperPage from "./pages/DeveloperPage";
import { useAuthStore } from "./store/useAuthStore";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChattingStore";
import { useVideoCallStore } from "./store/useVideoCallStore";
import { useVoiceCallStore } from "./store/useVoiceCallStore";
import VideoCall from "./components/VideoCall";
import VoiceCall from "./components/VoiceCall";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const { callStatus } = useVideoCallStore();
  const { callStatus: voiceCallStatus } = useVoiceCallStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      useVideoCallStore.getState().initializeListeners();
      useVoiceCallStore.getState().initializeListeners();
      useChatStore.getState().subscribeToPush();
      useChatStore.getState().subscribeToMessages();
    }
    return () => {
      useVideoCallStore.getState().cleanupListeners();
      useVoiceCallStore.getState().cleanupListeners();
      useChatStore.getState().unsubscribeFromMessages();
    };
  }, [authUser]);


  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-14 animate-spin" />
      </div>
    );
  return (
    <div data-theme={theme} className="h-screen w-full overflow-hidden bg-base-100 flex flex-col">
      <div className="flex-1 h-full overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to={"/"} />}
          />
          <Route
            path="/signup"
            element={!authUser ? <SignupPage /> : <Navigate to={"/"} />}
          />
          <Route path="/settings" element={<SettingPage />} />
          <Route path="/settings/pro" element={<ProPage />} />
          <Route path="/settings/developer" element={<DeveloperPage />} />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />}
          />
        </Routes>
      </div>
      <Toaster />
      {authUser && callStatus !== "IDLE" && <VideoCall />}
      {authUser && voiceCallStatus !== "IDLE" && <VoiceCall />}
    </div>
  );
};
export default App;
