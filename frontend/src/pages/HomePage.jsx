import { useChatStore } from "../store/useChattingStore.js";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer.jsx";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-16 px-0 lg:pt-20 lg:px-4">
        <div className="bg-base-100 rounded-none lg:rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-4rem)] lg:h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-none lg:rounded-lg overflow-hidden">
            <div className={`${!selectedUser ? 'block' : 'hidden'} lg:block w-full lg:w-80`}>
              <Sidebar />
            </div>
            <div className={`${selectedUser ? 'block' : 'hidden'} lg:block flex-1 h-full`}>
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
