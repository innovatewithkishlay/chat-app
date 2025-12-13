import { useState, useEffect } from "react";
import { X, Video, Lock, Settings, BrainCircuit, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChattingStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import ProModal from "./ProModal";
import GroupSettingsModal from "./GroupSettingsModal";
import VideoCall from "./VideoCall";
import toast from "react-hot-toast";

const ChatHeader = ({ onOpenMemory }) => {
  const { selectedUser, setSelectedUser, leaveGroup } = useChatStore();
  const { onlineUsers = [], authUser } = useAuthStore();
  const [showProModal, setShowProModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const isGroup = !!selectedUser.members;
  const isPro = authUser.plan === "PRO";
  const handleVideoCall = () => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    useVideoCallStore.getState().startCall(selectedUser._id, selectedUser.fullname);
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      await leaveGroup(selectedUser._id);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      {showGroupSettings && <GroupSettingsModal onClose={() => setShowGroupSettings(false)} />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back Button (Mobile) */}
          <button onClick={() => setSelectedUser(null)} className="lg:hidden btn btn-ghost btn-circle btn-sm">
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => isGroup && setShowGroupSettings(true)}>
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img
                  src={isGroup ? (selectedUser.avatar || "/avatar.png") : (selectedUser.profilePic || "/avatar.png")}
                  alt={isGroup ? selectedUser.name : selectedUser.fullname}
                />
              </div>
            </div>

            {/* User/Group info */}
            <div>
              <h3 className="font-medium flex items-center gap-2">
                {isGroup ? selectedUser.name : selectedUser.fullname}
              </h3>
              <p className="text-sm text-base-content/70">
                {isGroup
                  ? `${selectedUser.members.length} members`
                  : (onlineUsers.includes(selectedUser._id)
                    ? "Online"
                    : `Last seen ${selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : "Offline"}`
                  )
                }
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {/* Memory Button */}
          <button onClick={onOpenMemory} className="btn btn-ghost btn-circle btn-sm" title="Chat Memory">
            <BrainCircuit size={18} />
          </button>

          {!isGroup && (
            <button
              onClick={handleVideoCall}
              className={`btn btn-circle btn-sm ${!isPro ? "btn-ghost text-zinc-500" : "btn-primary"}`}
            >
              {isPro ? <Video size={18} /> : <Lock size={16} />}
            </button>
          )}

          {isGroup && (
            <>
              <button
                onClick={() => setShowGroupSettings(true)}
                className="btn btn-circle btn-sm btn-ghost"
                title="Group Settings"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={handleLeaveGroup}
                className="btn btn-sm btn-error btn-outline"
              >
                Leave
              </button>
            </>
          )}

          <button onClick={() => setSelectedUser(null)} className="btn btn-ghost btn-circle btn-sm">
            <X size={20} />
          </button>
        </div>
      </div>


    </div>
  );
};
export default ChatHeader;
