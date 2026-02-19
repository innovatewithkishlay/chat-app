import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import { useStatusStore } from "../store/useStatusStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, X, UserPlus, Inbox, Plus, MessageSquare, User, Smile, Trash2, CircleDashed, Crown, Settings, Phone, Star } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import MoodSelector from "./MoodSelector";
import CallHistory from "./CallHistory";
import StatusList from "./status/StatusList";
import ConfirmModal from "./ConfirmModal";
import ProModal from "./ProModal";
import gsap from "gsap";

const Sidebar = () => {
  const {
    getConversations,
    conversations,
    selectedUser,
    setSelectedUser,
    isConversationsLoading,
    searchUsers,
    searchResults,
    sendTalkRequest,
    getTalkRequests,
    talkRequests,
    acceptTalkRequest,
    rejectTalkRequest,
    getSentRequests,
    friends,
    getFriends,
    removeFriend,
    groups,
    getGroups,
    sentRequests,
    deleteChat,
    clearChat
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "friends" | "requests"
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    target: null // { conversationId, otherUser }
  });

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, isOpen: false }));
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (e, conversation, otherUser) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.pageX,
      y: e.pageY,
      target: { conversation, otherUser }
    });
  };

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    isDangerous: false,
    confirmText: "Confirm"
  });

  const listRef = useRef(null);

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const handleAction = async (id, actionFn) => {
    if (loadingId) return;
    setLoadingId(id);
    try {
      await actionFn(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleClearChatContext = () => {
    const { target } = contextMenu;
    if (!target) return;

    setConfirmModal({
      isOpen: true,
      title: "Clear Chat",
      message: `Clear all messages with ${target.otherUser.fullname}?`,
      confirmText: "Clear",
      isDangerous: true,
      onConfirm: () => handleAction(target.otherUser._id, clearChat)
    });
  };

  const handleDeleteChatContext = () => {
    const { target } = contextMenu;
    if (!target) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Chat",
      message: `Delete conversation with ${target.otherUser.fullname}?`,
      confirmText: "Delete",
      isDangerous: true,
      onConfirm: () => handleAction(target.conversation._id, deleteChat)
    });
  };

  useEffect(() => {
    getTalkRequests();
    getSentRequests();
    getFriends();
    getGroups();
  }, [getTalkRequests, getSentRequests, getFriends, getGroups]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const delayDebounceFn = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, searchUsers]);

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  // Status Store
  const { fetchStatuses, subscribeToStatusEvents, unsubscribeFromStatusEvents, hasUnseen, statuses } = useStatusStore();

  useEffect(() => {
    // Determine if we need to fetch. 
    // We can fetch on mount or when tab becomes 'status'.
    // Let's fetch on mount to get the red dot, then subscribe.
    fetchStatuses();
    subscribeToStatusEvents();

    return () => {
      unsubscribeFromStatusEvents();
    };
  }, [fetchStatuses, subscribeToStatusEvents, unsubscribeFromStatusEvents]);

  // Refetch when entering status tab if empty (optional)
  useEffect(() => {
    if (activeTab === "status" && statuses.length === 0) {
      fetchStatuses();
    }
  }, [activeTab, fetchStatuses, statuses.length]);

  // GSAP Animation for list items
  useEffect(() => {
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.2, stagger: 0.03, ease: "power2.out" }
      );
    }
  }, [activeTab, isSearching, conversations, friends, talkRequests, groups]);

  // Helper to get the other user from conversation participants
  const getOtherUser = (conversation) => {
    return conversation.participants.find((p) => p._id !== authUser._id);
  };

  const filteredConversations = showOnlineOnly
    ? conversations.filter((c) => {
      const otherUser = getOtherUser(c);
      return onlineUsers.includes(otherUser?._id);
    })
    : conversations;

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full flex flex-col bg-base-100">
      {/* 1. TOP SECTION: User Avatar & Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-base-300">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="relative cursor-pointer transition-opacity hover:opacity-80">
            <img
              src={authUser?.profilePic || "/avatar.png"}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover border border-base-300"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-base-100"></span>
          </Link>
          <h1 className="text-[16px] font-semibold text-base-content tracking-tight">Toukii</h1>
        </div>

        <div className="flex items-center gap-1">
          {/* Mood or Pro icons can be subtle here */}
          <button
            onClick={() => setShowMoodSelector(true)}
            className="text-base-content/40 hover:text-base-content/70 p-1.5 rounded-full hover:bg-base-200 transition-colors"
          >
            <Smile size={18} />
          </button>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="text-base-content/40 hover:text-primary p-1.5 rounded-full hover:bg-base-200 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Search & Tabs */}
      <div className="px-4 pt-3 pb-2 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 size-4" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 bg-base-200 border-none rounded-[10px] text-sm text-base-content/70 focus:outline-none focus:ring-1 focus:ring-base-content/20 placeholder:text-base-content/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Minimal Tabs */}
        <div className="flex items-center gap-1 border-b border-base-300 pb-1">
          {[
            { id: 'chats', Icon: MessageSquare, label: 'Chats' },
            { id: 'friends', Icon: Users, label: 'Friends' },
            { id: 'status', Icon: CircleDashed, label: 'Status', alert: hasUnseen },
            { id: 'calls', Icon: Phone, label: 'Calls' },
            { id: 'requests', Icon: Inbox, label: 'Reqs', count: talkRequests.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                 relative flex-1 py-2 flex justify-center items-center rounded-lg transition-all
                 ${activeTab === tab.id ? 'text-primary bg-primary/5' : 'text-base-content/40 hover:text-base-content/60 hover:bg-base-200'}
               `}
              title={tab.label}
            >
              <tab.Icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              {tab.alert && <span className="absolute top-2 right-3 w-1.5 h-1.5 bg-primary rounded-full" />}
              {tab.count > 0 && <span className="absolute -top-0 right-1 bg-red-500 text-white text-[9px] px-1 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 3. LIST SECTION */}
      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar" ref={listRef}>
        {activeTab === "calls" ? (
          <CallHistory />
        ) : activeTab === "status" ? (
          <StatusList />
        ) : activeTab === "requests" ? (
          <div className="space-y-1 mt-2">
            {talkRequests.length === 0 ? (
              <div className="text-center text-base-content/40 py-10 text-xs">No pending requests</div>
            ) : (
              talkRequests.map(req => (
                <div key={req._id} className="p-3 bg-base-200 rounded-xl flex items-center gap-3">
                  <img src={req.sender.profilePic || "/avatar.png"} className="size-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-base-content/70">{req.sender.fullname}</div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => handleAction(req._id, acceptTalkRequest)} className="text-xs px-3 py-1 bg-primary text-white rounded-md">Accept</button>
                      <button onClick={() => handleAction(req._id, rejectTalkRequest)} className="text-xs px-3 py-1 bg-base-300 text-base-content/60 rounded-md">Decline</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "friends" ? (
          <div className="space-y-0.5 mt-1">
            {friends.map(friend => (
              <div
                key={friend._id}
                onClick={() => setSelectedUser(friend)}
                className="group p-2 flex items-center gap-3 hover:bg-base-200 rounded-lg cursor-pointer transition-colors"
              >
                <div className="relative">
                  <img src={friend.profilePic || "/avatar.png"} className="size-10 rounded-full object-cover border border-base-300" />
                  {onlineUsers.includes(friend._id) && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-base-100 rounded-full"></span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-base-content/70 truncate">{friend.fullname}</div>
                  <div className="text-xs text-base-content/40">@{friend.username}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedUser(friend); }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-primary hover:bg-primary/10 rounded-full transition-all"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : isSearching ? (
          <div className="space-y-1 mt-1">
            {searchResults.length === 0 ? <div className="text-center text-base-content/40 py-4 text-sm">No users found</div> : searchResults.map(user => (
              <div key={user._id} className="p-2 flex items-center gap-3 hover:bg-base-200 rounded-lg cursor-pointer">
                <img src={user.profilePic || "/avatar.png"} className="size-10 rounded-full" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-base-content/70">{user.fullname}</div>
                  <div className="text-xs text-base-content/40">@{user.username}</div>
                </div>
                <button onClick={() => handleAction(user._id, sendTalkRequest)} className="p-2 text-primary"><UserPlus size={18} /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5 mt-1">
            {/* Groups */}
            {groups.length > 0 && (
              groups.map(group => (
                <div
                  key={group._id}
                  onClick={() => setSelectedUser(group)}
                  className={`
                             p-2 flex items-center gap-3 rounded-lg cursor-pointer transition-colors
                             ${selectedUser?._id === group._id ? 'bg-primary/5' : 'hover:bg-base-200'}
                           `}
                >
                  <div className="relative">
                    {group.avatar ? (
                      <img src={group.avatar} className="size-10 rounded-xl object-cover border border-base-300" />
                    ) : (
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-base-300">
                        <Users size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-base-content/70 truncate">{group.name}</div>
                    <div className="text-xs text-base-content/40 flex items-center gap-1">
                      <Users size={12} />
                      {group.members.length} members
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* DM Conversations */}
            {filteredConversations.map(c => {
              const otherUser = getOtherUser(c);
              if (!otherUser) return null;
              const unread = c.unreadCount?.[authUser._id] || 0;
              const isSelected = selectedUser?._id === otherUser._id;

              return (
                <div
                  key={c._id}
                  onClick={() => setSelectedUser(otherUser)}
                  onContextMenu={(e) => handleContextMenu(e, c, otherUser)}
                  className={`
                             p-2 flex items-center gap-3 rounded-[10px] cursor-pointer transition-colors mb-0.5
                             ${isSelected ? 'bg-primary/10' : 'hover:bg-base-200'}
                           `}
                >
                  <div className="relative">
                    <img src={otherUser.profilePic || "/avatar.png"} className="size-[40px] rounded-full object-cover bg-base-200" />
                    {onlineUsers.includes(otherUser._id) && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-base-100 rounded-full"></span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className={`text-[13px] font-medium truncate ${isSelected ? 'text-primary' : 'text-base-content/70'}`}>
                        {otherUser.fullname}
                      </span>
                      {c.lastMessage && (
                        <span className="text-[10px] text-base-content/40 whitespace-nowrap ml-1">
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className={`text-[12px] truncate max-w-[140px] ${unread > 0 ? 'text-base-content font-medium' : 'text-base-content/60'}`}>
                        {c.lastMessage?.text || (c.lastMessage?.image ? "📷 Photo" : "Start a chat")}
                      </span>
                      {unread > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredConversations.length === 0 && groups.length === 0 && (
              <div className="text-center text-base-content/40 py-10 flex flex-col items-center">
                <MessageSquare className="size-8 opacity-20 mb-2" />
                <span className="text-sm">No messages yet</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. BOTTOM SECTION: Settings */}
      <div className="p-3 border-t border-base-300 flex justify-between items-center bg-base-100 z-10">
        <Link
          to="/settings"
          className="p-2 text-base-content/40 hover:text-base-content/70 hover:bg-base-200 rounded-lg transition-colors flex items-center gap-2"
          title="Settings"
        >
          <Settings size={20} />
          {/* <span className="text-sm font-medium">Settings</span> */}
        </Link>

        <div className="text-[10px] text-base-content/30 font-medium">
          v1.2.0
        </div>
      </div>

      {/* Modals */}

      {showMoodSelector && <MoodSelector isOpen={showMoodSelector} onClose={() => setShowMoodSelector(false)} />}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDangerous={confirmModal.isDangerous}
      />

      {/* Context Menu */}
      {contextMenu.isOpen && contextMenu.target && (
        <div
          className="fixed z-50 bg-white shadow-xl rounded-lg border border-slate-100 py-1 w-40"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleClearChatContext} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <Trash2 size={14} /> Clear Chat
          </button>
          <button onClick={handleDeleteChatContext} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
            <Trash2 size={14} /> Delete Chat
          </button>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;

