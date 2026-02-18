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
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-16 px-0 lg:pt-20 lg:px-4">
        <div className="bg-base-100 rounded-none lg:rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-4rem)] lg:h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-none lg:rounded-lg overflow-hidden">

            {/* Sidebar: 
                - Mobile: Hidden if selectedUser OR activeStatus OR activeStatusCreation is true 
                - Desktop: Always visible
            */}
            <div className={`${(selectedUser || activeStatus || activeStatusCreation) ? 'hidden' : 'block'} lg:block w-full lg:w-80 border-r border-base-300`}>
              <Sidebar />
            </div>

            {/* Main Content Area:
                - If activeStatus -> Show StatusViewer
                - Else If activeStatusCreation -> Show StatusCreationPanel
                - Else If selectedUser -> Show ChatContainer
                - Else -> Show NoChatSelected
            */}
            <div className={`${(!selectedUser && !activeStatus && !activeStatusCreation) ? 'hidden' : 'block'} flex-1 h-full relative`}>
              {activeStatus ? (
                <div className="w-full h-full absolute inset-0 z-10 bg-black">
                  <StatusViewer
                    stories={activeStatus.stories}
                    userId={activeStatus.userId._id || activeStatus.userId} // Handle populated/unpopulated
                    initialStoryIndex={0} // Default to 0, or could pass from store if needed
                    onClose={closeStatus}
                  // Future: onNextUser logic could go here to switch activeStatus
                  />
                </div>
              ) : activeStatusCreation ? (
                <div className="w-full h-full absolute inset-0 z-10 bg-base-100">
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
    </div>
  );
};
export default HomePage;
