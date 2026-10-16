import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "../store/useChattingStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import Avatar from "./Avatar";
import { useAuthStore } from "../store/useAuthStore";
import { useProductivityStore } from "../store/useProductivityStore";
import { NotesSkeleton, PollsSkeleton, KanbanSkeleton } from "./skeletons/ProductivitySkeletons";
import TimelineScrubber from "./TimelineScrubber";
import { ChevronDown } from "lucide-react";
import { animate, formatDayLabel, isSameDay } from "../lib/util";

// Consecutive messages from the same sender are visually grouped only if
// they are close together in time.
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

import GroupSettingsModal from "./GroupSettingsModal";
import UserInfoModal from "./UserInfoModal";
import DeleteMessagesModal from "./DeleteMessagesModal";
import NoChatSelected from "./NoChatSelected";
import MessageSearch from "./MessageSearch";

const NotesContainer = lazy(() => import("./productivity/NotesContainer"));
const PollsList = lazy(() => import("./productivity/PollsList"));
const KanbanBoard = lazy(() => import("./productivity/KanbanBoard"));

const ChatContainer = ({ onOpenMemory }) => {
  const {
    messages,
    getMessages,
    getGroupMessages,
    isMessagesLoading,
    selectedUser,
    deleteMessages,
    editMessage,
    reactToMessage,
    typingUsers,
    showGroupInfo,
    setShowGroupInfo,
    showUserInfo,
    setShowUserInfo,
    showMessageSearch,
  } = useChatStore();

  const isGroup = !!selectedUser?.members;
  const currentTypingUsers = useMemo(() => {
    if (!selectedUser) return [];
    return typingUsers.filter((u) =>
      isGroup ? u.groupId === selectedUser._id : u.senderId === selectedUser._id && !u.groupId
    );
  }, [typingUsers, selectedUser, isGroup]);
  const { authUser } = useAuthStore();
  const { activeTab, votePoll } = useProductivityStore();

  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevChatId = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadInActiveChat, setUnreadInActiveChat] = useState(0);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [messageToDelete, setMessageToDelete] = useState(null);

  useEffect(() => {
    if (!selectedUser) return;
    if (isGroup) {
      getGroupMessages(selectedUser._id);
    } else {
      getMessages(selectedUser._id);
    }
  }, [selectedUser?._id, isGroup, getMessages, getGroupMessages]);

  useLayoutEffect(() => {
    if (messages.length > 0 && selectedUser?._id !== prevChatId.current) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
      prevChatId.current = selectedUser?._id;
    }
  }, [messages, selectedUser?._id]);

  useEffect(() => {
    if (messages.length > 0 && selectedUser?._id === prevChatId.current) {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

        const lastMessage = messages[messages.length - 1];
        const isMyNewMessage = lastMessage && (lastMessage.senderId?._id || lastMessage.senderId) === authUser._id && lastMessage.status === "sending";

        if (isNearBottom || isMyNewMessage) {
          if (isMyNewMessage) {
            scrollContainerRef.current.scrollTop = scrollHeight;
          } else {
            scrollContainerRef.current.scrollTo({ top: scrollHeight, behavior: "smooth" });
          }
        } else {
          // If we are scrolled up and a new message arrives from the other user
          const senderIdValue = lastMessage.senderId?._id || lastMessage.senderId;
          if (!isMyNewMessage && senderIdValue !== authUser._id) {
            setUnreadInActiveChat(prev => prev + 1);
            setShowScrollButton(true);
          }
        }
      }
    }
  }, [messages, authUser._id, selectedUser?._id]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const nearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollButton(!nearBottom || unreadInActiveChat > 0);
      if (nearBottom && unreadInActiveChat > 0) {
        setUnreadInActiveChat(0);
      }
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: "smooth" });
      setUnreadInActiveChat(0);
    }
  };

  const handleEditStart = (message) => {
    setEditingMessageId(message._id);
    setEditText(message.text);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleEditSave = async (messageId) => {
    if (editText.trim()) {
      await editMessage(messageId, editText);
      setEditingMessageId(null);
      setEditText("");
    }
  };

  const handleScrollToMessage = (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      animate(element, [{ backgroundColor: "rgba(59, 130, 246, 0.14)" }, { backgroundColor: "transparent" }], { duration: 1800, easing: "ease-out" });
    }
  };

  const getTypingText = () => {
    if (currentTypingUsers.length === 0) return "";
    if (isGroup) {
      if (currentTypingUsers.length === 1) {
        const sender = selectedUser.members.find(m => m._id === currentTypingUsers[0].senderId);
        return `${sender?.fullname || "Someone"} is typing...`;
      }
      return "Multiple people are typing...";
    }
    return "Typing...";
  };

  if (!selectedUser) return <NoChatSelected />;
  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-base-200">
        <div className="shrink-0 z-30">
          <ChatHeader onOpenMemory={onOpenMemory} />
        </div>
        <MessageSkeleton />
        <div className="shrink-0 z-30">
          <MessageInput />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-base-200">

      {/* Fixed Header */}
      <div className="flex-shrink-0 z-30">
        <ChatHeader onOpenMemory={onOpenMemory} />
      </div>

      {showGroupInfo && isGroup && (
        <GroupSettingsModal onClose={() => setShowGroupInfo(false)} />
      )}

      {showUserInfo && !isGroup && (
        <UserInfoModal user={selectedUser} onClose={() => setShowUserInfo(false)} />
      )}

      {/* Delete Message Modal */}
      <DeleteMessagesModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onDeleteForMe={() => {
          deleteMessages(messageToDelete._id, "me");
          setMessageToDelete(null);
        }}
        onDeleteForEveryone={() => {
          deleteMessages(messageToDelete._id, "everyone");
          setMessageToDelete(null);
        }}
        canDeleteForEveryone={messageToDelete?.senderId._id === authUser._id || messageToDelete?.senderId === authUser._id}
        count={1}
      />

      {activeTab === "notes" && (
        <Suspense fallback={<NotesSkeleton />}>
          <NotesContainer />
        </Suspense>
      )}
      {activeTab === "polls" && (
        <Suspense fallback={<PollsSkeleton />}>
          <PollsList />
        </Suspense>
      )}
      {activeTab === "kanban" && (
        <Suspense fallback={<KanbanSkeleton />}>
          <KanbanBoard />
        </Suspense>
      )}

      {activeTab === "chat" && (
        <>
          {showMessageSearch && (
            <MessageSearch chatId={selectedUser._id} onJumpToMessage={handleScrollToMessage} />
          )}

          {/* Scrollable Messages Area */}
          <div
            className="flex-1 overflow-y-auto w-full relative custom-scrollbar px-4 py-4"
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <TimelineScrubber messages={messages} onScrollToMessage={handleScrollToMessage} />

            {messages.map((message, index) => {
              const senderId = message.senderId?._id || message.senderId;
              const isMyMessage = senderId === authUser._id;

              const prevMessage = index > 0 ? messages[index - 1] : null;
              const prevSenderId = prevMessage ? (prevMessage.senderId?._id || prevMessage.senderId) : null;
              const startsNewDay = !prevMessage || !isSameDay(prevMessage.createdAt, message.createdAt);
              const isSequential =
                !startsNewDay &&
                prevSenderId === senderId &&
                prevMessage.type !== "system" &&
                new Date(message.createdAt) - new Date(prevMessage.createdAt) < GROUPING_WINDOW_MS;

              const marginTopClass = index === 0 || startsNewDay ? "" : (isSequential ? "mt-0.5" : "mt-3");

              return (
                <div key={message._id} className={marginTopClass}>
                  {startsNewDay && (
                    <div className="flex justify-center py-3" role="separator">
                      <span className="rounded-full border border-base-300 bg-base-100/95 px-3 py-1 text-[11px] font-medium text-base-content/60 shadow-sm backdrop-blur">
                        {formatDayLabel(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isMyMessage={isMyMessage}
                    isSequential={isSequential}
                    authUser={authUser}
                    selectedUser={selectedUser}
                    isGroup={isGroup}
                    isEditing={editingMessageId === message._id}
                    editText={editText}
                    setEditText={setEditText}
                    handleEditSave={handleEditSave}
                    handleEditCancel={handleEditCancel}
                    handleEditStart={handleEditStart}
                    setMessageToDelete={setMessageToDelete}
                    reactToMessage={reactToMessage}
                    votePoll={votePoll}
                  />
                </div>
              );
            })}

            {currentTypingUsers && currentTypingUsers.length > 0 && (
              <div className="flex gap-2 mt-3">
                {isGroup && (
                  <Avatar
                    user={currentTypingUsers.length === 1 ? selectedUser.members.find(m => m._id === currentTypingUsers[0].senderId) : selectedUser}
                    size="size-8"
                  />
                )}
                <div className="bg-base-100 border border-base-300 px-3.5 py-2 rounded-2xl rounded-tl-md flex items-center gap-2">
                  <span className="loading loading-dots loading-xs text-base-content/40"></span>
                  <span className="text-xs text-base-content/40 italic">{getTypingText()}</span>
                </div>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              aria-label={unreadInActiveChat > 0 ? `${unreadInActiveChat} new messages, jump to latest` : "Jump to latest"}
              className="absolute bottom-20 right-5 z-20 flex size-10 items-center justify-center rounded-full border border-base-300 bg-base-100 text-base-content/70 shadow-md transition hover:text-base-content"
            >
              <ChevronDown className="size-5" />
              {unreadInActiveChat > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-content text-[10px] font-semibold flex items-center justify-center">
                  {unreadInActiveChat}
                </span>
              )}
            </button>
          )}

          {/* Fixed Input Area */}
          <div className="chat-input-wrapper shrink-0 z-30 bg-base-200 w-full">
            <MessageInput />
          </div>
        </>
      )
      }
    </div >
  );
};

export default ChatContainer;
