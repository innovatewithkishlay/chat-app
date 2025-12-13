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
import VideoCall from "./VideoCall";
import { useVideoCallStore } from "../store/useVideoCallStore";
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
    isTyping,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { callStatus } = useVideoCallStore();
  const messageEndRef = useRef(null);
  const containerRef = useRef(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  const isGroup = !!selectedUser.members;

  useEffect(() => {
    if (isGroup) {
      getGroupMessages(selectedUser._id);
    } else {
      getMessages(selectedUser._id);
    }
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, isGroup, getMessages, getGroupMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // GSAP Animation for new messages
  useLayoutEffect(() => {
    if (containerRef.current && messages.length > 0) {
      const lastMessage = containerRef.current.lastElementChild;
      if (lastMessage) {
        gsap.fromTo(
          lastMessage,
          { opacity: 0, y: 20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
        );
      }
    }
  }, [messages.length]);

  const handleScrollToMessage = (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      gsap.fromTo(element, { backgroundColor: "#374151" }, { backgroundColor: "transparent", duration: 2 });
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
    if (editText.trim() && editText !== messages.find(m => m._id === messageId).text) {
      await editMessage(messageId, editText);
    }
    setEditingMessageId(null);
    setEditText("");
  };



  useEffect(() => {
    if (isGroup) return;

    const handleStartCall = async () => {
      const isEligible = await useChatStore.getState().checkVideoCallEligibility(selectedUser._id);
      if (isEligible) {
        useVideoCallStore.getState().startCall(selectedUser._id, selectedUser.fullname);
      }
    };

    window.addEventListener("startVideoCall", handleStartCall);

    return () => {
      window.removeEventListener("startVideoCall", handleStartCall);
    };
  }, [selectedUser, isGroup]);


  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-100">
        <ChatHeader onOpenMemory={() => setIsMemoryOpen(true)} />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto relative bg-base-100/50 backdrop-blur-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4f4f4f_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <ChatHeader
        onOpenMemory={() => setIsMemoryOpen(true)}
      />

      {!isGroup && <HealthIndicator />}

      <ChatMemory
        conversationId={selectedUser._id}
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10" ref={containerRef}>
        <TimelineScrubber messages={messages} onScrollToMessage={handleScrollToMessage} />

        {messages.map((message) => {
          // Handle both populated (group) and unpopulated (1-1) senderId
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
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2 border border-base-content/10"
                    />
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

        {isTyping && !isGroup && (
          <div className="chat chat-start animate-pulse">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-bubble bg-base-200 text-xs opacity-50 flex items-center gap-1">
              <span className="loading loading-dots loading-xs"></span> Typing...
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />

    </div>
  );
};

export default ChatContainer;
