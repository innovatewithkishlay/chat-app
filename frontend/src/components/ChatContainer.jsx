import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChattingStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/util";
import { Trash2, Edit2, Smile } from "lucide-react";
import gsap from "gsap";
import { useProductivityStore } from "../store/useProductivityStore";

import NotesContainer from "./productivity/NotesContainer";
import PollsList from "./productivity/PollsList";
import TimelineScrubber from "./TimelineScrubber";
import MessageStatus from "./MessageStatus";

import GroupSettingsModal from "./GroupSettingsModal";
import DeleteMessagesModal from "./DeleteMessagesModal";
import NoChatSelected from "./NoChatSelected";

const ChatContainer = ({ onOpenMemory }) => {
  const {
    messages,
    getMessages,
    getGroupMessages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    selectedUser,
    deleteMessages,
    editMessage,
    reactToMessage,
    currentTypingUsers,
    showGroupInfo,
    setShowGroupInfo,
  } = useChatStore();

  const isGroup = !!selectedUser?.members;
  const { authUser } = useAuthStore();
  const { activeTab, votePoll } = useProductivityStore();

  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const prevChatId = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [messageToDelete, setMessageToDelete] = useState(null);

  useEffect(() => {
    if (selectedUser) {
      if (isGroup) {
        getGroupMessages(selectedUser._id);
      } else {
        getMessages(selectedUser._id);
      }
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, isGroup, getMessages, getGroupMessages, subscribeToMessages, unsubscribeFromMessages]);

  useLayoutEffect(() => {
    if (messages.length > 0 && selectedUser?._id !== prevChatId.current) {
      messageEndRef.current?.scrollIntoView({ behavior: "auto" });
      prevChatId.current = selectedUser?._id;
    }
  }, [messages, selectedUser?._id]);

  useEffect(() => {
    if (messages.length > 0 && selectedUser?._id === prevChatId.current) {
      if (scrollContainerRef.current) {
        const isNearBottom =
          scrollContainerRef.current.scrollHeight - scrollContainerRef.current.scrollTop - scrollContainerRef.current.clientHeight < 150;

        const lastMessage = messages[messages.length - 1];
        const isMyNewMessage = lastMessage && (lastMessage.senderId?._id || lastMessage.senderId) === authUser._id && lastMessage.status === "pending";

        if (isNearBottom || isMyNewMessage) {
          messageEndRef.current?.scrollIntoView({ behavior: isMyNewMessage ? "auto" : "smooth" });
        }
      }
    }
  }, [messages, authUser._id, selectedUser?._id]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 150);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      gsap.fromTo(element, { backgroundColor: "rgba(59, 130, 246, 0.1)" }, { backgroundColor: "transparent", duration: 2 });
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
        <ChatHeader onOpenMemory={onOpenMemory} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-base-200 relative">

      {/* Fixed Header */}
      <div className="flex-shrink-0 z-30">
        <ChatHeader onOpenMemory={onOpenMemory} />
      </div>

      {showGroupInfo && isGroup && (
        <GroupSettingsModal onClose={() => setShowGroupInfo(false)} />
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

      {activeTab === "notes" && <NotesContainer />}
      {activeTab === "polls" && <PollsList />}

      {activeTab === "chat" && (
        <>
          {/* Scrollable Messages Area */}
          <div
            className="flex-1 overflow-y-auto w-full relative custom-scrollbar px-4 py-6 space-y-6"
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <TimelineScrubber messages={messages} onScrollToMessage={handleScrollToMessage} />

            {messages.map((message) => {
              const senderId = message.senderId?._id || message.senderId;
              const isMyMessage = senderId === authUser._id;

              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isMyMessage={isMyMessage}
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
              );
            })}

            {currentTypingUsers && currentTypingUsers.length > 0 && (
              <div className="flex gap-3">
                <div className="avatar">
                  <div className="size-8 rounded-full border border-base-300">
                    <img src={isGroup && currentTypingUsers.length === 1 ? selectedUser.members.find(m => m._id === currentTypingUsers[0].senderId)?.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"} alt="typing" />
                  </div>
                </div>
                <div className="bg-base-100 border border-base-300 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
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
              className="absolute bottom-20 left-1/2 -translate-x-1/2 overflow-hidden px-4 py-1.5 bg-primary text-primary-content rounded-full shadow-xl animate-bounce z-20 text-sm font-bold flex items-center justify-center border border-primary-content/20 max-w-[90%] whitespace-nowrap"
            >
              New Messages ↓
            </button>
          )}

          {/* Fixed Input Area */}
          <div className="chat-input-wrapper z-30 bg-base-200 w-full">
            <MessageInput />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatContainer;
