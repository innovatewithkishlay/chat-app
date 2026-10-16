import { Suspense, lazy, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChattingStore";
import { useStatusStore } from "../store/useStatusStore";
import { useProductivityStore } from "../store/useProductivityStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useVoiceCallStore } from "../store/useVoiceCallStore";

const VideoCall = lazy(() => import("./VideoCall"));
const VoiceCall = lazy(() => import("./VoiceCall"));

// Per-account data that must not leak into the next session when someone
// logs out and another account logs in on the same tab.
const CHAT_SESSION_DEFAULTS = {
  messages: [],
  conversations: [],
  searchResults: [],
  talkRequests: [],
  sentRequests: [],
  friends: [],
  groups: [],
  chatMemory: [],
  reminders: [],
  selectedUser: null,
  typingUsers: [],
  currentTypingUsers: [],
  replyToMessage: null,
  chatSearchResults: [],
  showMessageSearch: false,
};

const STATUS_SESSION_DEFAULTS = {
  statuses: [],
  myStatus: null,
  hasUnseen: false,
};

// Mounted only while signed in, and loaded as its own chunk, so the chat,
// call and productivity stores stay out of the login/signup bundle.
const RealtimeBridge = () => {
  const authUserId = useAuthStore((s) => s.authUser?._id);
  const socket = useAuthStore((s) => s.socket);
  const callStatus = useVideoCallStore((s) => s.callStatus);
  const voiceCallStatus = useVoiceCallStore((s) => s.callStatus);

  useEffect(() => {
    if (!authUserId) return;
    useChatStore.getState().subscribeToPush();
    return () => {
      useChatStore.setState(CHAT_SESSION_DEFAULTS);
      useStatusStore.setState(STATUS_SESSION_DEFAULTS);
    };
  }, [authUserId]);

  // The socket is created asynchronously, so (re)attach listeners whenever
  // the instance changes rather than once on login.
  useEffect(() => {
    if (!socket) return;
    useVideoCallStore.getState().initializeListeners();
    useVoiceCallStore.getState().initializeListeners();
    useChatStore.getState().subscribeToMessages();
    useProductivityStore.getState().subscribeToProductivityEvents();
    return () => {
      useVideoCallStore.getState().cleanupListeners();
      useVoiceCallStore.getState().cleanupListeners();
      useChatStore.getState().unsubscribeFromMessages();
      useProductivityStore.getState().unsubscribeFromProductivityEvents();
    };
  }, [socket]);

  return (
    <Suspense fallback={null}>
      {callStatus !== "IDLE" && <VideoCall />}
      {voiceCallStatus !== "IDLE" && <VoiceCall />}
    </Suspense>
  );
};

export default RealtimeBridge;
