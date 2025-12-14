import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, X, UserPlus, Inbox, Plus, MessageSquare, User, Smile, Trash2 } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import MoodSelector from "./MoodSelector";
import CallHistory from "./CallHistory";
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
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "friends" | "requests"
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);

  const listRef = useRef(null);

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

  // GSAP Animation for list items
  useEffect(() => {
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
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
    <aside className="h-full w-full lg:w-80 border-r border-base-300 flex flex-col transition-all duration-300 bg-base-100/50 backdrop-blur-lg">
      {showMoodSelector && <MoodSelector isOpen={showMoodSelector} onClose={() => setShowMoodSelector(false)} />}

      <div className="border-b border-base-300 w-full p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <span className="font-bold text-lg block tracking-tight">Messages</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMoodSelector(true)} className="btn btn-ghost btn-circle btn-sm flex" title="Set Mood">
              <Smile size={18} />
            </button>
            <div className="badge badge-sm badge-primary/10 text-primary border-none font-medium flex">
              {authUser?.plan || "FREE"}
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative block group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            className="input input-bordered input-sm w-full pl-9 pr-8 bg-base-200/50 focus:bg-base-200 transition-all rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-2 flex items-center"
            >
              <X className="size-4 text-zinc-500 hover:text-zinc-700" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-base-200/50 rounded-xl">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === "chats" ? "bg-base-100 shadow-sm text-primary" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === "friends" ? "bg-base-100 shadow-sm text-primary" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 relative ${activeTab === "requests" ? "bg-base-100 shadow-sm text-primary" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Reqs
            {talkRequests.length > 0 && (
              <span className="absolute top-1 right-1 size-2 bg-error rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("calls")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === "calls" ? "bg-base-100 shadow-sm text-primary" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            Calls
          </button>
        </div>

        {/* Create Group & Filter */}
        <div className="flex items-center justify-between">
          <label className="cursor-pointer flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-xs checkbox-primary"
            />
            <span>Online only</span>
          </label>

          <button
            onClick={() => setShowCreateGroup(true)}
            className="btn btn-xs btn-ghost gap-1 text-primary hover:bg-primary/10"
          >
            <Plus className="size-3" /> New Group
          </button>
        </div>
      </div>

      <div className="overflow-y-auto w-full flex-1 p-2" ref={listRef}>
        {activeTab === "calls" ? (
          <CallHistory />
        ) : activeTab === "requests" ? (
          // Requests View
          <>
            {talkRequests.length === 0 ? (
              <div className="text-center text-zinc-500 py-8 flex flex-col items-center gap-2">
                <Inbox className="size-8 opacity-20" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              talkRequests.map((request) => (
                <div key={request._id} className="w-full p-3 mb-2 bg-base-200/30 rounded-xl hover:bg-base-200 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={request.sender.profilePic || "/avatar.png"}
                      alt={request.sender.fullname}
                      className="size-10 object-cover rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{request.sender.fullname}</div>
                      <div className="text-xs text-zinc-400">@{request.sender.username}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptTalkRequest(request._id)}
                      className="btn btn-xs btn-primary flex-1"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => rejectTalkRequest(request._id)}
                      className="btn btn-xs btn-ghost flex-1 hover:bg-error/10 hover:text-error"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : activeTab === "friends" ? (
          // Friends View
          <>
            {friends.length === 0 ? (
              <div className="text-center text-zinc-500 py-8 flex flex-col items-center gap-2">
                <User className="size-8 opacity-20" />
                <p className="text-sm">No friends yet</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend._id} className="w-full p-2 flex items-center gap-3 hover:bg-base-200/50 rounded-xl transition-all group mb-1 cursor-pointer" onClick={() => setSelectedUser(friend)}>
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={friend.profilePic || "/avatar.png"}
                      alt={friend.fullname}
                      className="size-10 object-cover rounded-full ring-2 ring-base-300 group-hover:ring-primary/20 transition-all"
                    />
                    {onlineUsers.includes(friend._id) && (
                      <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
                    )}
                    {/* Mood Ring */}
                    {friend.mood?.status && new Date(friend.mood.expiresAt) > new Date() && (
                      <div className="absolute -top-1 -right-1 text-lg animate-bounce" title={friend.mood.status}>
                        {friend.mood.status}
                      </div>
                    )}
                  </div>
                  <div className="block text-left min-w-0 flex-1">
                    <div className="font-medium truncate text-sm">{friend.fullname}</div>
                    <div className="text-xs text-zinc-400">@{friend.username}</div>
                  </div>
                  <div className="hidden lg:flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(friend);
                      }}
                      className="btn btn-xs btn-square btn-ghost text-primary"
                      title="Chat"
                    >
                      <MessageSquare className="size-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to remove this friend?")) {
                          removeFriend(friend._id);
                        }
                      }}
                      className="btn btn-xs btn-square btn-ghost text-error"
                      title="Remove Friend"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : isSearching ? (
          // Search Results View
          <>
            {searchResults.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">No users found</div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user._id}
                  className="w-full p-3 flex items-center gap-3 hover:bg-base-200 rounded-xl transition-colors mb-1"
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullname}
                      className="size-10 object-cover rounded-full"
                    />
                  </div>
                  <div className="block text-left min-w-0 flex-1">
                    <div className="font-medium truncate text-sm">{user.fullname}</div>
                    <div className="text-xs text-zinc-400">@{user.username}</div>
                  </div>
                  <button
                    onClick={() => sendTalkRequest(user._id)}
                    className="btn btn-xs btn-circle btn-primary"
                    title="Send Talk Request"
                  >
                    <UserPlus className="size-4" />
                  </button>
                </div>
              ))
            )}
          </>
        ) : (
          // Conversations & Groups View
          <>
            {/* Groups Section */}
            {groups.length > 0 && (
              <div className="mb-4">
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Groups</div>
                {groups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => setSelectedUser(group)}
                    className={`
                    w-full p-2 flex items-center gap-3 rounded-xl transition-all mb-1
                    ${selectedUser?._id === group._id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-base-200/50"
                      }
                  `}
                  >
                    <div className="relative mx-auto lg:mx-0">
                      <img
                        src={group.avatar || "/avatar.png"}
                        alt={group.name}
                        className="size-10 object-cover rounded-full"
                      />
                    </div>
                    <div className="block text-left min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">{group.name}</div>
                      <div className="text-xs opacity-70">{group.members.length} members</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Direct Messages Section */}
            <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Direct Messages</div>
            {filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const unreadCount = conversation.unreadCount?.[authUser._id] || 0;
              const lastMessage = conversation.lastMessage;

              if (!otherUser) return null;

              return (
                <button
                  key={conversation._id}
                  onClick={() => setSelectedUser(otherUser)}
                  className={`
                  w-full p-2 flex items-center gap-3 rounded-xl transition-all mb-1 group
                  ${selectedUser?._id === otherUser._id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-base-200/50"
                    }
                `}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={otherUser.profilePic || "/avatar.png"}
                      alt={otherUser.fullname}
                      className={`size-10 object-cover rounded-full transition-all ${selectedUser?._id === otherUser._id ? "ring-2 ring-primary" : ""}`}
                    />
                    {onlineUsers.includes(otherUser._id) && (
                      <span
                        className="absolute bottom-0 right-0 size-2.5 bg-green-500 
                      rounded-full ring-2 ring-base-100"
                      />
                    )}
                    {/* Mood Ring */}
                    {otherUser.mood?.status && new Date(otherUser.mood.expiresAt) > new Date() && (
                      <div className="absolute -top-1 -right-1 text-lg animate-bounce" title={otherUser.mood.status}>
                        {otherUser.mood.status}
                      </div>
                    )}
                  </div>

                  <div className="block text-left min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <div className="font-medium truncate text-sm">{otherUser.fullname}</div>
                      {lastMessage && (
                        <div className="text-[10px] opacity-50 ml-1 whitespace-nowrap">
                          {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-0.5">
                      <div className={`text-xs truncate w-32 ${unreadCount > 0 ? "font-medium text-primary" : "opacity-70"}`}>
                        {lastMessage?.text || (lastMessage?.image ? "📷 Image" : "Start a conversation")}
                      </div>
                      {unreadCount > 0 && (
                        <div className="size-4 rounded-full bg-primary text-primary-content text-[10px] flex items-center justify-center font-bold">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="hidden group-hover:flex absolute right-2 top-2 bg-base-100 rounded-lg shadow-sm border border-base-200 p-1 gap-1 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Delete this chat?")) {
                          useChatStore.getState().deleteChat(conversation._id);
                        }
                      }}
                      className="p-1 hover:bg-base-200 rounded text-error"
                      title="Delete Chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </button>
              );
            })}

            {filteredConversations.length === 0 && groups.length === 0 && (
              <div className="text-center text-zinc-500 py-8 flex flex-col items-center gap-2">
                <MessageSquare className="size-8 opacity-20" />
                <p className="text-sm">No conversations</p>
              </div>
            )}
          </>
        )}
      </div>

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </aside>
  );
};
export default Sidebar;
