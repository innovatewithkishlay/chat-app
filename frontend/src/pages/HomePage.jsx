import { useChatStore } from "../store/useChattingStore.js";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer.jsx";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import VideoCall from "../components/VideoCall";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { callStatus } = useVideoCallStore();

  useEffect(() => {
    useVideoCallStore.getState().initializeListeners();
    useChatStore.getState().subscribeToPush(); // Request notification permission
    return () => useVideoCallStore.getState().cleanupListeners();
  }, []);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <div className={`${!selectedUser ? 'block' : 'hidden'} lg:block w-full lg:w-80`}>
              <Sidebar />
            </div>
            <div className={`${selectedUser ? 'block' : 'hidden'} lg:block flex-1 h-full`}>
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
      {callStatus !== "IDLE" && <VideoCall />}
    </div>
  );
};
export default HomePage;
