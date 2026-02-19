import { useState, useEffect } from "react";
import { X, Video, Lock, Settings, BrainCircuit, ArrowLeft, Phone, Trash2, FileText, MessageSquare, BarChart2, MoreVertical } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChattingStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useVoiceCallStore } from "../store/useVoiceCallStore";
import { useProductivityStore } from "../store/useProductivityStore";
import ProModal from "./ProModal";
import VideoCall from "./VideoCall";
import ConfirmModal from "./ConfirmModal";
import DeleteMessagesModal from "./DeleteMessagesModal";
import toast from "react-hot-toast";

const ChatHeader = ({ onOpenMemory }) => {
  const {
    selectedUser,
    setSelectedUser,
    leaveGroup,
    setShowGroupInfo,
    showGroupInfo,
    deleteMessages
  } = useChatStore();
  const { onlineUsers = [], authUser } = useAuthStore();
  const { activeTab, setActiveTab } = useProductivityStore();
  const [showProModal, setShowProModal] = useState(false);

  const [isLeaving, setIsLeaving] = useState(false);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    isDangerous: false,
    confirmText: "Confirm"
  });

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

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
    setConfirmModal({
      isOpen: true,
      title: "Leave Group",
      message: "Are you sure you want to leave this group?",
      confirmText: "Leave",
      isDangerous: true,
      onConfirm: async () => {
        setIsLeaving(true);
        try {
          await leaveGroup(selectedUser._id);
        } finally {
          setIsLeaving(false);
        }
      }
    });
  };



  // Helper for ConfirmModal
  const confirmAction = (title, message, onConfirm, isDangerous = false, confirmText = "Confirm") => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      isDangerous,
      onConfirm: () => {
        onConfirm();
        closeConfirmModal();
      }
    });
  };

  const { clearChat, deleteChat } = useChatStore();

  const handleClearChat = async () => {
    if (selectedUser) {
      confirmAction(
        "Clear Chat",
        "Are you sure you want to clear this chat? Messages will be removed from your view.",
        async () => {
          await clearChat(selectedUser._id);
          toast.success("Chat cleared");
        },
        true,
        "Clear"
      );
    }
  };

  const handleDeleteChat = async () => {
    const conversation = useChatStore.getState().conversations.find(c =>
      c.participants.some(p => p._id === selectedUser._id)
    );
    if (conversation) {
      confirmAction(
        "Delete Chat",
        "Are you sure you want to delete this chat? It will be removed from your sidebar.",
        async () => {
          await deleteChat(conversation._id);
          setSelectedUser(null);
          toast.success("Chat deleted");
        },
        true,
        "Delete"
      );
    } else {
      setSelectedUser(null);
    }
  };





  return (
    <div className="flex flex-col border-b border-base-300 bg-base-100/80 backdrop-blur-md z-20 h-auto">
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}



      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDangerous={confirmModal.isDangerous}
      />

      <div className="px-3 py-2 lg:px-4 lg:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Back Button (Mobile) */}
          <button onClick={() => setSelectedUser(null)} className="lg:hidden btn btn-ghost btn-circle btn-sm size-8">
            <ArrowLeft size={18} />
          </button>

          <div
            className="flex items-center gap-2 lg:gap-3 cursor-pointer"
            onClick={() => isGroup && setShowGroupInfo(!showGroupInfo)}
          >
            {/* Avatar */}
            <div className="avatar">
              <div className="size-8 lg:size-10 rounded-full relative">
                <img
                  src={isGroup ? (selectedUser.avatar || "/avatar.png") : (selectedUser.profilePic || "/avatar.png")}
                  alt={isGroup ? selectedUser.name : selectedUser.fullname}
                />
              </div>
            </div>

            {/* User/Group info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium flex items-center gap-2 truncate text-sm lg:text-base">
                {isGroup ? selectedUser.name : selectedUser.fullname}
              </h3>
              <p className="text-xs text-base-content/70 truncate">
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
        <div className="flex items-center gap-1 lg:gap-2">

          {!isGroup && (
            <>
              <button
                onClick={handleVoiceCall}
                className={`btn btn-circle btn-sm size-8 lg:size-8 transition-all duration-300 relative group overflow-hidden ${!isPro ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-500" : "btn-primary"}`}
                title={isPro ? "Voice Call" : "Unlock Voice Call"}
              >
                {isPro ? (
                  <Phone size={16} className="lg:size-[18px]" />
                ) : (
                  <>
                    <Phone size={16} className="lg:size-[18px] opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 p-[3px]">
                      <Lock size={8} className="text-amber-500 fill-amber-500" />
                    </div>
                  </>
                )}
              </button>

              <button
                onClick={handleVideoCall}
                className={`btn btn-circle btn-sm size-8 lg:size-8 transition-all duration-300 relative group overflow-hidden ${!isPro ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-500" : "btn-primary"}`}
                title={isPro ? "Video Call" : "Unlock Video Call"}
              >
                {isPro ? (
                  <Video size={16} className="lg:size-[18px]" />
                ) : (
                  <>
                    <Video size={16} className="lg:size-[18px] opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 right-0 p-[3px]">
                      <Lock size={8} className="text-amber-500 fill-amber-500" />
                    </div>
                  </>
                )}
              </button>
            </>
          )}

          {/* Settings Dropdown - CLEANED UP */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm size-8 lg:size-8">
              <MoreVertical size={20} className="text-gray-600" />
            </div>
            <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-xl bg-white rounded-xl w-56 border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
              {isGroup ? (
                <>
                  <li>
                    <button onClick={() => setShowGroupInfo(true)} className="py-2 text-gray-700 font-medium">Group Info</button>
                  </li>
                  <li>
                    <button onClick={handleLeaveGroup} disabled={isLeaving} className="py-2 text-red-500 font-medium hover:bg-red-50">
                      {isLeaving ? "Leaving..." : "Leave Group"}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button onClick={handleClearChat} className="py-2 text-gray-700 font-medium hover:bg-gray-50 flex gap-3">
                      <Trash2 size={16} /> Clear Chat
                    </button>
                  </li>
                  <li>
                    <button onClick={handleDeleteChat} className="py-2 text-red-500 font-medium hover:bg-red-50 flex gap-3">
                      <Trash2 size={16} /> Delete Chat
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Close Button */}
          <button onClick={() => setSelectedUser(null)} className="hidden sm:flex btn btn-ghost btn-circle btn-sm">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Productivity Tabs */}
      <div className="flex px-3 lg:px-4 gap-4 lg:gap-6 text-xs lg:text-sm font-medium border-t border-base-200/50">
        <button
          onClick={() => setActiveTab("chat")}
          className={`py-2 lg:py-2 flex items-center gap-1.5 lg:gap-2 border-b-2 transition-colors ${activeTab === "chat" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`}
        >
          <MessageSquare size={14} className="lg:size-[16px]" /> Chat
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`py-2 lg:py-2 flex items-center gap-1.5 lg:gap-2 border-b-2 transition-colors ${activeTab === "notes" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`}
        >
          <FileText size={14} className="lg:size-[16px]" /> Notes
        </button>
        {isGroup && (
          <button
            onClick={() => setActiveTab("polls")}
            className={`py-2 lg:py-2 flex items-center gap-1.5 lg:gap-2 border-b-2 transition-colors ${activeTab === "polls" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content"}`}
          >
            <BarChart2 size={14} className="lg:size-[16px]" /> Polls
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
