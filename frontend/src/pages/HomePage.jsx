import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChattingStore.js";
import { useStatusStore } from "../store/useStatusStore.js";
import { useAuthStore } from "../store/useAuthStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer.jsx";
import StatusViewer from "../components/status/StatusViewer.jsx";
import StatusCreationPanel from "../components/status/StatusCreationPanel.jsx";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { activeStatus, activeStatusCreation, closeStatus, closeCreateStatus } = useStatusStore();
  const { authUser } = useAuthStore();

  return (
    <div className="h-full w-full flex bg-base-200 overflow-hidden font-sans text-base-content">

      {/* Sidebar - Fixed 280px */}
      <div className={`
         ${(selectedUser || activeStatus || activeStatusCreation) ? 'hidden' : 'flex'}
         lg:flex flex-col flex-shrink-0
         w-full lg:w-[280px]
         h-full bg-base-100 border-r border-base-300 z-20
       `}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className={`
         ${(!selectedUser && !activeStatus && !activeStatusCreation) ? 'hidden lg:flex' : 'flex'}
         flex-1 h-full relative flex-col min-w-0 bg-base-200 overflow-hidden
       `}>
        {activeStatus ? (
          <div className="absolute inset-0 z-50 bg-black">
            <StatusViewer
              stories={activeStatus.stories}
              userId={activeStatus.userId._id || activeStatus.userId}
              initialStoryIndex={0}
              onClose={closeStatus}
            />
          </div>
        ) : activeStatusCreation ? (
          <div className="absolute inset-0 z-50 bg-white">
            <StatusCreationPanel onClose={closeCreateStatus} />
          </div>
        ) : selectedUser ? (
          <ChatContainer />
        ) : (
          <div className="hidden lg:flex flex-1">
            <NoChatSelected />
          </div>
        )}
      </div>

    </div>
  );
};
export default HomePage;
