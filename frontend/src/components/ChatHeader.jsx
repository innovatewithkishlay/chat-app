import { useState } from "react";
import { X, Video, Lock, ArrowLeft, Phone, FileText, MessageSquare, MoreVertical } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChattingStore";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useVoiceCallStore } from "../store/useVoiceCallStore";
import { useProductivityStore } from "../store/useProductivityStore";
import ProModal from "./ProModal";
import CreateGroupModal from "./CreateGroupModal"; // Assuming this is the 'Group Info' modal basically
import ConfirmModal from "./ConfirmModal";
import toast from "react-hot-toast";

const ChatHeader = () => {
  const {
    selectedUser,
    setSelectedUser,
    leaveGroup,
    setShowGroupInfo,
    showGroupInfo,
    showUserInfo,
    setShowUserInfo,
    clearChat,
    deleteChat,
    typingUsers,
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

  const isTyping = typingUsers?.some(
    (u) => isGroup ? u.groupId === selectedUser._id : u.senderId === selectedUser._id
  );

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

  const handleLeaveGroup = async () => {
    if (isLeaving) return;
    confirmAction(
      "Leave Group",
      "Are you sure you want to leave this group?",
      async () => {
        setIsLeaving(true);
        try {
          await leaveGroup(selectedUser._id);
          setSelectedUser(null);
        } finally {
          setIsLeaving(false);
        }
      },
      true,
      "Leave"
    );
  };

  const handleClearChat = () => {
    if (selectedUser) {
      confirmAction(
        "Clear Chat",
        "Clear all messages? This only removes them from your view.",
        async () => {
          await clearChat(selectedUser._id);
          toast.success("Chat cleared");
        },
        true,
        "Clear"
      );
    }
  };

  const handleDeleteChat = () => {
    // Logic to find conversation ID is handled in store usually or we find it here
    // Assuming deleteChat takes user ID or conversation ID. Store says `deleteChat(id)`.
    // Let's pass selectedUser._id, store usually handles finding the convo or we find it.
    // Re-using logic from previous file: find conversation first.
    const conversation = useChatStore.getState().conversations.find(c =>
      c.participants.some(p => p._id === selectedUser._id)
    );

    if (conversation) {
      confirmAction(
        "Delete Chat",
        "Permanently delete this conversation?",
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
    <div className="flex flex-col bg-base-100 z-10">
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

      {/* Main Header - 56px */}
      <div className="h-[56px] px-4 flex items-center justify-between border-b border-base-300">
        <div className="flex items-center gap-3">
          {/* Back Button (Mobile) */}
          <button onClick={() => setSelectedUser(null)} className="lg:hidden p-2 -ml-2 text-base-content/60 hover:bg-base-200 rounded-full">
            <ArrowLeft size={20} />
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => isGroup ? setShowGroupInfo(!showGroupInfo) : setShowUserInfo(!showUserInfo)}
          >
            <div className="relative">
              <img
                src={isGroup ? (selectedUser.avatar || "/avatar.png") : (selectedUser.profilePic || "/avatar.png")}
                alt={selectedUser.fullname}
                className="size-8 rounded-full object-cover border border-base-300"
              />
              {!isGroup && onlineUsers.includes(selectedUser._id) && (
                <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-base-100 rounded-full"></span>
              )}
            </div>

            <div className="leading-tight">
              <h3 className="text-base font-semibold text-base-content flex items-center gap-1">
                {isGroup ? selectedUser.name : selectedUser.fullname}
              </h3>
              <div className="text-xs text-base-content/60 h-4 flex items-center overflow-hidden">
                {isTyping ? (
                  <span className="text-primary font-medium flex items-center transition-all duration-300">
                    <span className="animate-pulse">Typing...</span>
                  </span>
                ) : (
                  <span className="transition-all duration-300">
                    {isGroup
                      ? `${selectedUser.members.length} members`
                      : (onlineUsers.includes(selectedUser._id)
                        ? "Online"
                        : "Offline"
                      )
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!isGroup && (
            <>
              <button
                onClick={handleVoiceCall}
                className={`p-2 rounded-full transition-colors relative group ${!isPro ? "text-base-content/30 hover:text-amber-500" : "text-base-content/40 hover:text-primary hover:bg-base-200"}`}
                title="Voice Call"
              >
                <Phone size={20} />
                {!isPro && <Lock size={10} className="absolute top-1.5 right-1.5 text-amber-500" />}
              </button>

              <button
                onClick={handleVideoCall}
                className={`p-2 rounded-full transition-colors relative group ${!isPro ? "text-base-content/30 hover:text-amber-500" : "text-base-content/40 hover:text-primary hover:bg-base-200"}`}
                title="Video Call"
              >
                <Video size={20} />
                {!isPro && <Lock size={10} className="absolute top-1.5 right-1.5 text-amber-500" />}
              </button>
            </>
          )}

          {/* Menu */}
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="p-2 text-base-content/40 hover:text-base-content/60 hover:bg-base-200 rounded-full">
              <MoreVertical size={20} />
            </button>
            <ul tabIndex={0} className="dropdown-content menu p-1 shadow-lg bg-base-100 rounded-xl w-48 border border-base-300 mt-1 z-20 text-sm">
              {isGroup ? (
                <>
                  <li><button onClick={() => setShowGroupInfo(true)}>Group Info</button></li>
                  <li><button onClick={handleLeaveGroup} className="text-red-500 hover:bg-red-50">Leave Group</button></li>
                </>
              ) : (
                <>
                  <li><button onClick={() => setShowUserInfo(true)}>Contact Info</button></li>
                  <li><button onClick={handleClearChat}>Clear Chat</button></li>
                  <li><button onClick={handleDeleteChat} className="text-red-500 hover:bg-red-50">Delete Chat</button></li>
                </>
              )}
            </ul>
          </div>

          <button onClick={() => setSelectedUser(null)} className="hidden lg:block p-2 text-base-content/40 hover:text-base-content/60 hover:bg-base-200 rounded-full ml-1">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Slim Productivity Tabs */}
      <div className="h-[40px] px-4 flex items-center gap-6 border-b border-base-300 bg-base-100">
        <button
          onClick={() => setActiveTab("chat")}
          className={`h-full flex items-center gap-2 text-xs font-medium border-b-2 transition-colors ${activeTab === "chat" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content/70"}`}
        >
          <MessageSquare size={14} /> Chat
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`h-full flex items-center gap-2 text-xs font-medium border-b-2 transition-colors ${activeTab === "notes" ? "border-primary text-primary" : "border-transparent text-base-content/60 hover:text-base-content/70"}`}
        >
          <FileText size={14} /> Notes
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
