import { useState, useEffect } from "react";
import { X, Video, Lock, Settings, BrainCircuit, ArrowLeft, Phone, Trash2, Layout, FileText, MessageSquare, BarChart2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChattingStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useVoiceCallStore } from "../store/useVoiceCallStore";
import { useProductivityStore } from "../store/useProductivityStore";
import ProModal from "./ProModal";
import GroupSettingsModal from "./GroupSettingsModal";
import VideoCall from "./VideoCall";
import toast from "react-hot-toast";

const ChatHeader = ({ onOpenMemory }) => {
  const { selectedUser, setSelectedUser, leaveGroup } = useChatStore();
  const { onlineUsers = [], authUser } = useAuthStore();
  const { activeTab, setActiveTab } = useProductivityStore();
  const [showProModal, setShowProModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const isGroup = !!selectedUser.members;
  const isPro = authUser.plan === "PRO";

  const handleVideoCall = () => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    useVideoCallStore.getState().startCall(selectedUser._id, selectedUser.fullname);
  };

  const handleVoiceCall = () => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    useVoiceCallStore.getState().startCall(selectedUser._id, selectedUser.fullname);
  };

  const handleLeaveGroup = async () => {
    if (isLeaving) return;
    if (window.confirm("Are you sure you want to leave this group?")) {
      setIsLeaving(true);
      try {
        await leaveGroup(selectedUser._id);
      } finally {
        setIsLeaving(false);
      }
    }
  };

  const handleClearChat = async () => {
    if (isClearing) return;
    if (window.confirm("Are you sure you want to clear this chat?")) {
      setIsClearing(true);
      try {
        await useChatStore.getState().clearChat(selectedUser._id);
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleDeleteChat = async () => {
    if (isDeleting) return;
    if (window.confirm("Are you sure you want to delete this chat? It will be hidden until a new message arrives.")) {
      setIsDeleting(true);
      try {
        const conversation = useChatStore.getState().conversations.find(c => c.participants.some(p => p._id === selectedUser._id));
        if (conversation) {
          await useChatStore.getState().deleteChat(conversation._id);
        }
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex flex-col border-b border-base-300 bg-base-100/80 backdrop-blur-md z-20">
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      {showGroupSettings && <GroupSettingsModal onClose={() => setShowGroupSettings(false)} />}

      <div className="p-2.5 flex items-center justify-between">
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
            <div className="min-w-0 flex-1">
              <h3 className="font-medium flex items-center gap-2 truncate">
                {isGroup ? selectedUser.name : selectedUser.fullname}
              </h3>
              <p className="text-sm text-base-content/70 truncate">
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
          {/* Memory Button - Hidden on mobile, added to dropdown */}
          <button onClick={onOpenMemory} className="hidden sm:flex btn btn-ghost btn-circle btn-sm" title="Chat Memory">
            <BrainCircuit size={18} />
          </button>

          {!isGroup && (
            <>
              <button
                onClick={handleVoiceCall}
                className={`btn btn-circle btn-sm ${!isPro ? "btn-ghost text-zinc-500" : "btn-primary"}`}
                title="Voice Call"
              >
                {isPro ? <Phone size={18} /> : <Lock size={16} />}
              </button>

              <button
                onClick={handleVideoCall}
                className={`btn btn-circle btn-sm ${!isPro ? "btn-ghost text-zinc-500" : "btn-primary"}`}
                title="Video Call"
              >
                {isPro ? <Video size={18} /> : <Lock size={16} />}
              </button>

              {/* Clear Chat - Hidden on mobile */}
              <button
                onClick={handleClearChat}
                disabled={isClearing}
                className="hidden sm:flex btn btn-ghost btn-circle btn-sm text-error"
                title="Clear Chat"
              >
                {isClearing ? <span className="loading loading-spinner loading-xs"></span> : <Trash2 size={20} />}
              </button>
            </>
          )}

          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm">
              <Settings size={20} />
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              {/* Mobile Only: View Memory */}
              <li className="sm:hidden">
                <button onClick={onOpenMemory}>
                  <BrainCircuit size={16} /> View Memory
                </button>
              </li>

              {!isGroup && (
                <>
                  <li>
                    <button onClick={handleClearChat} disabled={isClearing} className="text-error">
                      {isClearing ? "Clearing..." : "Clear Chat"}
                    </button>
                  </li>
                  <li>
                    <button onClick={handleDeleteChat} disabled={isDeleting} className="text-error">
                      {isDeleting ? "Deleting..." : "Delete Chat"}
                    </button>
                  </li>
                </>
              )}
              {isGroup && (
                <>
                  <li>
                    <button onClick={() => setShowGroupSettings(true)}>Group Settings</button>
                  </li>
                  <li>
                    <button onClick={handleLeaveGroup} disabled={isLeaving} className="text-error">
                      {isLeaving ? "Leaving..." : "Leave Group"}
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Close Button - Hidden on mobile (Back arrow used instead) */}
          <button onClick={() => setSelectedUser(null)} className="hidden sm:flex btn btn-ghost btn-circle btn-sm">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Productivity Tabs */}
      <div className="flex px-4 gap-6 text-sm font-medium border-t border-base-200/50">
        <button
          onClick={() => setActiveTab("chat")}
          className={`py-2 flex items-center gap-2 border-b-2 transition-colors ${activeTab === "chat" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`}
        >
          <MessageSquare size={16} /> Chat
        </button>
        <button
          const [isLeaving, setIsLeaving] = useState(false);

        const isGroup = !!selectedUser.members;
        const isPro = authUser.plan === "PRO";

  const handleVideoCall = () => {
    if (!isPro) {
          setShowProModal(true);
        return;
    }
        useVideoCallStore.getState().startCall(selectedUser._id, selectedUser.fullname);
  };

  const handleVoiceCall = () => {
    if (!isPro) {
          setShowProModal(true);
        return;
    }
        useVoiceCallStore.getState().startCall(selectedUser._id, selectedUser.fullname);
  };

  const handleLeaveGroup = async () => {
    if (isLeaving) return;
        if (window.confirm("Are you sure you want to leave this group?")) {
          setIsLeaving(true);
        try {
          await leaveGroup(selectedUser._id);
      } finally {
          setIsLeaving(false);
      }
    }
  };

  const handleClearChat = async () => {
    if (isClearing) return;
        if (window.confirm("Are you sure you want to clear this chat?")) {
          setIsClearing(true);
        try {
          await useChatStore.getState().clearChat(selectedUser._id);
      } finally {
          setIsClearing(false);
      }
    }
  };

  const handleDeleteChat = async () => {
    if (isDeleting) return;
        if (window.confirm("Are you sure you want to delete this chat? It will be hidden until a new message arrives.")) {
          setIsDeleting(true);
        try {
        const conversation = useChatStore.getState().conversations.find(c => c.participants.some(p => p._id === selectedUser._id));
        if (conversation) {
          await useChatStore.getState().deleteChat(conversation._id);
        }
      } finally {
          setIsDeleting(false);
      }
    }
  };

        return (
        <div className="flex flex-col border-b border-base-300 bg-base-100/80 backdrop-blur-md z-20">
          {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
          {showGroupSettings && <GroupSettingsModal onClose={() => setShowGroupSettings(false)} />}

          <div className="p-2.5 flex items-center justify-between">
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
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium flex items-center gap-2 truncate">
                    {isGroup ? selectedUser.name : selectedUser.fullname}
                  </h3>
                  <p className="text-sm text-base-content/70 truncate">
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
              {/* Memory Button - Hidden on mobile, added to dropdown */}
              <button onClick={onOpenMemory} className="hidden sm:flex btn btn-ghost btn-circle btn-sm" title="Chat Memory">
                <BrainCircuit size={18} />
              </button>

              {!isGroup && (
                <>
                  <button
                    onClick={handleVoiceCall}
                    className={`btn btn-circle btn-sm ${!isPro ? "btn-ghost text-zinc-500" : "btn-primary"}`}
                    title="Voice Call"
                  >
                    {isPro ? <Phone size={18} /> : <Lock size={16} />}
                  </button>

                  <button
                    onClick={handleVideoCall}
                    className={`btn btn-circle btn-sm ${!isPro ? "btn-ghost text-zinc-500" : "btn-primary"}`}
                    title="Video Call"
                  >
                    {isPro ? <Video size={18} /> : <Lock size={16} />}
                  </button>

                  {/* Clear Chat - Hidden on mobile */}
                  <button
                    onClick={handleClearChat}
                    disabled={isClearing}
                    className="hidden sm:flex btn btn-ghost btn-circle btn-sm text-error"
                    title="Clear Chat"
                  >
                    {isClearing ? <span className="loading loading-spinner loading-xs"></span> : <Trash2 size={20} />}
                  </button>
                </>
              )}

              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm">
                  <Settings size={20} />
                </div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  {/* Mobile Only: View Memory */}
                  <li className="sm:hidden">
                    <button onClick={onOpenMemory}>
                      <BrainCircuit size={16} /> View Memory
                    </button>
                  </li>

                  {!isGroup && (
                    <>
                      <li>
                        <button onClick={handleClearChat} disabled={isClearing} className="text-error">
                          {isClearing ? "Clearing..." : "Clear Chat"}
                        </button>
                      </li>
                      <li>
                        <button onClick={handleDeleteChat} disabled={isDeleting} className="text-error">
                          {isDeleting ? "Deleting..." : "Delete Chat"}
                        </button>
                      </li>
                    </>
                  )}
                  {isGroup && (
                    <>
                      <li>
                        <button onClick={() => setShowGroupSettings(true)}>Group Settings</button>
                      </li>
                      <li>
                        <button onClick={handleLeaveGroup} disabled={isLeaving} className="text-error">
                          {isLeaving ? "Leaving..." : "Leave Group"}
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Close Button - Hidden on mobile (Back arrow used instead) */}
              <button onClick={() => setSelectedUser(null)} className="hidden sm:flex btn btn-ghost btn-circle btn-sm">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Productivity Tabs */}
          <div className="flex px-4 gap-6 text-sm font-medium border-t border-base-200/50">
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-2 flex items-center gap-2 border-b-2 transition-colors ${activeTab === "chat" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`}
            >
              <MessageSquare size={16} /> Chat
            </button>
            <button
              onClick={() => setActiveTab("kanban")}
              className={`py-2 flex items-center gap-2 border-b-2 transition-colors ${activeTab === "kanban" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`}
            >
              <Layout size={16} /> Board
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-2 flex items-center gap-2 border-b-2 transition-colors ${activeTab === "notes" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`}
            >
              <FileText size={16} /> Notes
            </button>
            <button
              onClick={() => setActiveTab("polls")}
              className={`py-2 flex items-center gap-2 border-b-2 transition-colors ${activeTab === "polls" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`}
            >
              <BarChart2 size={16} /> Polls
            </button>
          </div>
        </div>
        );
};
        export default ChatHeader;
