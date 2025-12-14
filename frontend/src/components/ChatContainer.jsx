import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useChatStore } from "../store/useChattingStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/util";
import { Trash2, Edit2, Smile } from "lucide-react";
import gsap from "gsap";
import ChatMemory from "./ChatMemory";
import TimelineScrubber from "./TimelineScrubber";
import HealthIndicator from "./HealthIndicator";
import VoiceCall from "./VoiceCall";
import { useVideoCallStore } from "../store/useVideoCallStore";
import { useVoiceCallStore } from "../store/useVoiceCallStore";
import MessageStatus from "./MessageStatus";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    getGroupMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    editMessage,
    reactToMessage,
    typingUsers,
    joinGroupRoom,
    leaveGroupRoom,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { callStatus } = useVideoCallStore();
  const { callStatus: voiceCallStatus } = useVoiceCallStore();
  const messageEndRef = useRef(null);
  const containerRef = useRef(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const isGroup = !!selectedUser.members;

  useEffect(() => {
    if (isGroup) {
      getGroupMessages(selectedUser._id);
      joinGroupRoom(selectedUser._id);
    } else {
      getMessages(selectedUser._id);
    }
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
      if (isGroup) leaveGroupRoom(selectedUser._id);
    };
  }, [selectedUser._id, isGroup, getMessages, getGroupMessages, subscribeToMessages, unsubscribeFromMessages, joinGroupRoom, leaveGroupRoom]);

  // Smart Auto-Scroll
  useEffect(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isNearBottom && messages.length > 0) {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
      } else if (messages.length > 0) {
        // Only show button if we are NOT near bottom and a new message arrived
        // But this effect runs on mount too.
        // Let's rely on onScroll handler for button visibility mostly, 
        // and here just scroll if we were already near bottom.
        // Actually, for "new message arrived", we want to scroll IF near bottom.
      }
    }
  }, [messages, typingUsers]); // Scroll when messages arrive or typing starts (to see indicator)

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollButton(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  // ... (GSAP effect - keep existing)

  // ... (handleScrollToMessage, edit logic - keep existing)

  // ... (video call effect - keep existing)

  // Typing Indicator Logic
  const currentTypingUsers = typingUsers.filter(u => {
    if (isGroup) return u.groupId === selectedUser._id && u.senderId !== authUser._id;
    return u.senderId === selectedUser._id && !u.groupId;
  });

  const getTypingText = () => {
    if (currentTypingUsers.length === 0) return null;

    if (isGroup) {
      if (currentTypingUsers.length === 1) {
        // Need to find user name. In a real app we'd look up in `selectedUser.members`
        // For now, let's assume we can find it or just say "Someone is typing..."
        // Better: The typing event should probably carry the name, OR we look it up.
        // `selectedUser.members` should have it.
        const member = selectedUser.members.find(m => m._id === currentTypingUsers[0].senderId);
        return `${member?.fullname || "Someone"} is typing...`;
      } else if (currentTypingUsers.length === 2) {
        const m1 = selectedUser.members.find(m => m._id === currentTypingUsers[0].senderId);
        const m2 = selectedUser.members.find(m => m._id === currentTypingUsers[1].senderId);
        return `${m1?.fullname || "Someone"} and ${m2?.fullname || "Someone"} are typing...`;
      } else {
        return "Several people are typing...";
      }
    } else {
      return "Typing...";
    }
  };

  if (isMessagesLoading) {
    // ... (keep loading skeleton)
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-100">
        <ChatHeader onOpenMemory={() => setIsMemoryOpen(true)} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-base-100/50 backdrop-blur-sm h-full min-h-0">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4f4f4f_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <ChatHeader
        onOpenMemory={() => setIsMemoryOpen(true)}
      />

      {!isGroup && <HealthIndicator />}

      <ChatMemory
        conversationId={
          useChatStore.getState().conversations.find(c => c.participants.some(p => p._id === selectedUser._id))?._id || selectedUser._id
        }
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />

      <VoiceCall />

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 min-h-0 scroll-smooth"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <TimelineScrubber messages={messages} onScrollToMessage={handleScrollToMessage} />

        {messages.map((message) => {
          // ... (keep message mapping logic)
          const senderId = message.senderId._id || message.senderId;
          const isMyMessage = senderId === authUser._id;
          const isEditing = editingMessageId === message._id;

          return (
            <div
              key={message._id}
              id={`msg-${message._id}`}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"} group relative`}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border border-base-300 shadow-sm">
                  <img
                    src={
                      isMyMessage
                        ? authUser.profilePic || "/avatar.png"
                        : (isGroup ? message.senderId.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png")
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                {isGroup && !isMyMessage && (
                  <span className="text-xs font-bold mr-2 opacity-70">
                    {message.senderId.fullname}
                  </span>
                )}
                <time className="text-[10px] opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              <div className="relative group/message">
                <div
                  className={`chat-bubble flex flex-col shadow-md relative min-w-[120px]
                        ${isMyMessage
                      ? "chat-bubble-primary"
                      : "chat-bubble-secondary"
                    }
                        ${message.isDeleted ? "italic opacity-70 border border-base-content/20" : ""}
                    `}
                >
                  {message.image && !message.isDeleted && (
                    <>
                      {message.type === "audio" || message.image.match(/\.(webm|mp3|wav)$/i) ? (
                        <audio controls src={message.image} className="mb-2 max-w-[200px]" />
                      ) : (
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="sm:max-w-[200px] rounded-md mb-2 border border-base-content/10"
                        />
                      )}
                    </>
                  )}

                  {/* Intent Label */}
                  {message.intent && message.intent !== 'none' && !message.isDeleted && (
                    <span className="text-[10px] uppercase font-bold opacity-70 mb-1 block bg-black/20 px-1 rounded w-fit">
                      {message.intent === 'important' && '🔔 Important'}
                      {message.intent === 'question' && '❓ Question'}
                      {message.intent === 'action' && '✅ Action'}
                      {message.intent === 'idea' && '💡 Idea'}
                    </span>
                  )}

                  {isEditing ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <input
                        type="text"
                        className="input input-sm input-bordered w-full text-black"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditSave(message._id);
                          if (e.key === "Escape") handleEditCancel();
                        }}
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-xs btn-ghost text-black"
                          onClick={handleEditCancel}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-xs btn-success text-white"
                          onClick={() => handleEditSave(message._id)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    message.text && <p className="leading-relaxed">{message.text}</p>
                  )}

                  {/* Edited Tag */}
                  {message.isEdited && !message.isDeleted && !isEditing && (
                    <span className="text-[9px] opacity-60 text-right block w-full mt-1">edited</span>
                  )}

                  {/* Message Status Ticks */}
                  {isMyMessage && (
                    <div className={`absolute bottom-0.5 right-1.5 ${message.text ? "" : "bg-black/20 rounded px-1"}`}>
                      <MessageStatus status={message.status} />
                    </div>
                  )}

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className={`absolute -bottom-3 ${isMyMessage ? "right-0" : "left-0"} flex bg-base-100 rounded-full px-1.5 py-0.5 shadow-sm border border-base-300 text-xs z-10 scale-90`}>
                      {Object.entries(
                        message.reactions.reduce((acc, curr) => {
                          acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => (
                        <span key={emoji} className="ml-0.5">{emoji}{count > 1 && count}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Options (Hover) */}
                {!message.isDeleted && !isEditing && (
                  <div className={`absolute top-1/2 transform -translate-y-1/2 ${isMyMessage ? 'left-[-80px]' : 'right-[-80px]'} opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1 bg-base-100/80 backdrop-blur shadow-md rounded-full p-1 z-10`}>
                    {/* React Button */}
                    <div className="dropdown dropdown-top dropdown-end">
                      <div tabIndex={0} role="button" className="btn btn-xs btn-circle btn-ghost text-lg">😊</div>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 flex-row flex-wrap gap-1 justify-center">
                        {["👍", "❤️", "😂", "😮", "😢", "😡"].map(emoji => (
                          <li key={emoji}>
                            <button onClick={() => reactToMessage(message._id, emoji)} className="text-lg p-1 hover:bg-base-200 rounded">{emoji}</button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isMyMessage && (
                      <>
                        <button
                          onClick={() => handleEditStart(message)}
                          className="btn btn-xs btn-ghost btn-circle text-info"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteMessage(message._id)} className="btn btn-xs btn-ghost btn-circle text-error" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {currentTypingUsers.length > 0 && (
          <div className="chat chat-start animate-pulse">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={isGroup && currentTypingUsers.length === 1
                    ? selectedUser.members.find(m => m._id === currentTypingUsers[0].senderId)?.profilePic || "/avatar.png"
                    : selectedUser.profilePic || "/avatar.png"}
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-bubble bg-base-200 text-xs opacity-50 flex items-center gap-1">
              <span className="loading loading-dots loading-xs"></span> {getTypingText()}
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-8 btn btn-circle btn-sm btn-primary shadow-lg animate-bounce z-20"
        >
          ⬇️
        </button>
      )}

      <MessageInput />

    </div>
  );

};

export default ChatContainer;
