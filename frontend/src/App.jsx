import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { useAuthStore } from "./store/useAuthStore";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChattingStore";
import { useProductivityStore } from "./store/useProductivityStore";
import { useVideoCallStore } from "./store/useVideoCallStore";
import { useVoiceCallStore } from "./store/useVoiceCallStore";

// Code-split everything that isn't needed for the initial login/signup
// screen - these pull in the chat UI, WebRTC call components, and the
// productivity suite, which made up the bulk of the original single-bundle
// build.
const HomePage = lazy(() => import("./pages/HomePage"));
const SettingPage = lazy(() => import("./pages/SettingPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ProPage = lazy(() => import("./pages/ProPage"));
const DeveloperPage = lazy(() => import("./pages/DeveloperPage"));
const StarredMessagesPage = lazy(() => import("./pages/StarredMessagesPage"));
const VideoCall = lazy(() => import("./components/VideoCall"));
const VoiceCall = lazy(() => import("./components/VoiceCall"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full py-20">
    <Loader className="size-8 animate-spin opacity-60" />
  </div>
);

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const { callStatus } = useVideoCallStore();
  const { callStatus: voiceCallStatus } = useVoiceCallStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser?._id) {
      useVideoCallStore.getState().initializeListeners();
      useVoiceCallStore.getState().initializeListeners();
      useChatStore.getState().subscribeToPush();
      useChatStore.getState().subscribeToMessages();
      useProductivityStore.getState().subscribeToProductivityEvents();
    }
    return () => {
      useVideoCallStore.getState().cleanupListeners();
      useVoiceCallStore.getState().cleanupListeners();
      useChatStore.getState().unsubscribeFromMessages();
      useProductivityStore.getState().unsubscribeFromProductivityEvents();
    };
  }, [authUser?._id]);

  useEffect(() => {
    const setAppHeight = () => {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    };
    setAppHeight();
    window.visualViewport?.addEventListener('resize', setAppHeight);
    window.addEventListener('resize', setAppHeight);
    return () => {
      window.visualViewport?.removeEventListener('resize', setAppHeight);
      window.removeEventListener('resize', setAppHeight);
    };
  }, []);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-14 animate-spin" />
      </div>
    );
  return (
    <div data-theme={theme} className="chat-page w-full flex flex-col bg-base-100 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Suspense fallback={<PageLoader />}>
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
            <Route
              path="/forgot-password"
              element={!authUser ? <ForgotPasswordPage /> : <Navigate to={"/"} />}
            />
            <Route
              path="/reset-password/:token"
              element={!authUser ? <ResetPasswordPage /> : <Navigate to={"/"} />}
            />
            <Route path="/settings" element={<SettingPage />} />
            <Route path="/settings/privacy" element={authUser ? <PrivacyPage /> : <Navigate to={"/login"} />} />
            <Route path="/settings/starred" element={authUser ? <StarredMessagesPage /> : <Navigate to={"/login"} />} />
            <Route path="/settings/pro" element={<ProPage />} />
            <Route path="/settings/developer" element={<DeveloperPage />} />
            <Route
              path="/profile"
              element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />}
            />
          </Routes>
        </Suspense>
      </div>
      <Toaster />
      <Suspense fallback={null}>
        {authUser && callStatus !== "IDLE" && <VideoCall />}
        {authUser && voiceCallStatus !== "IDLE" && <VoiceCall />}
      </Suspense>
    </div>
  );
};
export default App;
