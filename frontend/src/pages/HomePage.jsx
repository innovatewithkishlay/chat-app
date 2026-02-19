import { useChatStore } from "../store/useChattingStore.js";
import { useStatusStore } from "../store/useStatusStore.js";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer.jsx";
import StatusViewer from "../components/status/StatusViewer.jsx";
import StatusCreationPanel from "../components/status/StatusCreationPanel.jsx";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { activeStatus, activeStatusCreation, closeStatus, closeCreateStatus, statuses, myStatus } = useStatusStore();
  const { authUser } = useAuthStore();
  const { theme } = useThemeStore();

  // Helper to get next/prev logic for viewer
  // We can pass handleNext/Prev to Viewer here or keep it simple.
  // Ideally, StatusViewer handles its own navigation based on the list passed to it.
  // But here we need to pass the *document* to StatusViewer.

  return (
    <div className="h-full bg-base-200">
      <div className="flex h-full pt-16">
        <div className="flex w-full h-full overflow-hidden bg-base-100">

          {/* Sidebar */}
          <div className={`${(selectedUser || activeStatus || activeStatusCreation) ? 'hidden' : 'block'} lg:block w-full lg:w-80 border-r border-base-300 h-full flex flex-col flex-shrink-0`}>
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className={`${(!selectedUser && !activeStatus && !activeStatusCreation) ? 'hidden lg:flex' : 'flex'} flex-1 h-full relative flex-col w-full min-w-0`}>
            {activeStatus ? (
              <div className="w-full h-full absolute inset-0 z-20 bg-black">
                <StatusViewer
                  stories={activeStatus.stories}
                  userId={activeStatus.userId._id || activeStatus.userId}
                  initialStoryIndex={0}
                  onClose={closeStatus}
                />
              </div>
            ) : activeStatusCreation ? (
              <div className="w-full h-full absolute inset-0 z-20 bg-base-100">
                <StatusCreationPanel onClose={closeCreateStatus} />
              </div>
            ) : selectedUser ? (
              <ChatContainer />
            ) : (
              <NoChatSelected />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
