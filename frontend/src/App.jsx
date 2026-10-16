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
import AppSplash from "./components/AppSplash";
import SidebarSkeleton from "./components/skeletons/SidebarSkeleton";

// Code-split everything that isn't needed for the initial login/signup
// screen - these pull in the chat UI, WebRTC call components, the socket
// client and the productivity suite.
const loadHomePage = () => import("./pages/HomePage");
const loadRealtimeBridge = () => import("./components/RealtimeBridge");
const HomePage = lazy(loadHomePage);
const RealtimeBridge = lazy(loadRealtimeBridge);
const SettingPage = lazy(() => import("./pages/SettingPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ProPage = lazy(() => import("./pages/ProPage"));
const DeveloperPage = lazy(() => import("./pages/DeveloperPage"));
const StarredMessagesPage = lazy(() => import("./pages/StarredMessagesPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-full w-full py-20">
    <Loader className="size-8 animate-spin opacity-60" />
  </div>
);

// Same frame as HomePage, so the chat screen appears to fill in rather than
// flashing a spinner while its chunk downloads.
const HomeFallback = () => (
  <div className="h-full w-full flex bg-base-200 overflow-hidden">
    <div className="flex w-full lg:w-[280px] h-full flex-shrink-0 bg-base-100 border-r border-base-300">
      <SidebarSkeleton />
    </div>
    <div className="hidden lg:flex flex-1" />
  </div>
);

const whenIdle = (fn) =>
  "requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 1500);

const App = () => {
  const authUser = useAuthStore((s) => s.authUser);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const isCheckingAuth = useAuthStore((s) => s.isCheckingAuth);
  const isServerWaking = useAuthStore((s) => s.isServerWaking);
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Apply the theme to <html> too, so the splash, the page background and
  // anything portalled outside #root (modals, toasts) match it.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // While someone is on the login/signup screen, quietly download the chat
  // screen so it's ready the moment they sign in.
  useEffect(() => {
    if (authUser || isCheckingAuth) return;
    whenIdle(() => {
      loadHomePage().catch(() => {});
      loadRealtimeBridge().catch(() => {});
    });
  }, [authUser, isCheckingAuth]);

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
      <div data-theme={theme} className="chat-page">
        <AppSplash isServerWaking={isServerWaking} />
      </div>
    );
  return (
    <div data-theme={theme} className="chat-page w-full flex flex-col bg-base-100 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                authUser ? (
                  <Suspense fallback={<HomeFallback />}>
                    <HomePage />
                  </Suspense>
                ) : (
                  <Navigate to={"/login"} />
                )
              }
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
            <Route path="*" element={<Navigate to={authUser ? "/" : "/login"} replace />} />
          </Routes>
        </Suspense>
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "!bg-base-100 !text-base-content !shadow-lg !rounded-xl !border !border-base-300 !text-sm",
        }}
      />
      {authUser && (
        <Suspense fallback={null}>
          <RealtimeBridge />
        </Suspense>
      )}
    </div>
  );
};
export default App;
