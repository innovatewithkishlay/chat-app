import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChattingStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
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

  useEffect(() => {
    if (messageEndRef.current && messages) {
      const isNearBottom = scrollContainerRef.current &&
        (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.scrollTop - scrollContainerRef.current.clientHeight < 300);

      // Auto-scroll only if near bottom or it's a new message load
      if (isNearBottom || messages.length < 20) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
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
          >
            <TimelineScrubber messages={messages} onScrollToMessage={handleScrollToMessage} />

            {messages.map((message) => {
              if (message.type === "system") {
                return (
                  <div key={message._id} className="flex justify-center my-4">
                    <span className="bg-base-300/60 text-base-content/60 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                      {message.text}
                    </span>
                  </div>
                );
              }

              const senderId = message.senderId._id || message.senderId;
              const isMyMessage = senderId === authUser._id;
              const isEditing = editingMessageId === message._id;

              // Poll Rendering
              if (message.type === "poll" && message.pollId) {
                const poll = message.pollId;
                const totalVotes = poll.options.reduce((acc, opt) => acc + opt.voteCount, 0);

                return (
                  <div key={message._id} className={`flex w-full ${isMyMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] flex gap-3 ${isMyMessage ? "flex-row-reverse" : "flex-row"}`}>
                      <div className="avatar flex-shrink-0 self-end">
                        <div className="size-8 lg:size-10 rounded-full border border-base-300 shadow-sm">
                          <img
                            src={isMyMessage ? authUser.profilePic || "/avatar.png" : (isGroup ? message.senderId.profilePic || "/avatar.png" : selectedUser?.profilePic || "/avatar.png")}
                            alt="avatar"
                          />
                        </div>
                      </div>

                      <div className={`p-4 rounded-2xl shadow-sm border ${isMyMessage ? "bg-base-100 border-primary/20" : "bg-base-100 border-base-300"} `}>
                        <div className="font-bold text-base-content mb-2">{poll.question}</div>
                        <div className="space-y-2">
                          {poll.options.map((option, idx) => {
                            const percentage = totalVotes === 0 ? 0 : Math.round((option.voteCount / totalVotes) * 100);
                            const isVoted = poll.votes.some(v => v.userId === authUser._id && v.optionIndex === idx);
                            return (
                              <div key={idx} onClick={() => !isVoted && votePoll(poll._id, idx)} className={`relative p-2 rounded-lg border cursor-pointer overflow-hidden ${isVoted ? "border-primary/30 bg-primary/5" : "border-base-300 hover:bg-base-200"}`}>
                                <div className="absolute inset-0 bg-primary/10 transition-all duration-500" style={{ width: `${percentage}%` }} />
                                <div className="relative z-10 flex justify-between text-sm font-medium text-base-content/70">
                                  <span>{option.text} {isVoted && "✓"}</span>
                                  <span>{percentage}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 text-xs text-base-content/40 text-right">{totalVotes} votes</div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Normal Message
              return (
                <div
                  key={message._id}
                  id={`msg-${message._id}`}
                  className={`flex w-full ${isMyMessage ? "justify-end" : "justify-start"} group/message`}
                >
                  <div className={`max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] flex gap-3 ${isMyMessage ? "flex-row-reverse" : "flex-row"}`}>

                    {/* Avatar */}
                    <div className="avatar flex-shrink-0 self-end">
                      <div className="size-8 lg:size-10 rounded-full border border-base-300 shadow-sm">
                        <img
                          src={
                            isMyMessage
                              ? authUser.profilePic || "/avatar.png"
                              : (isGroup ? message.senderId.profilePic || "/avatar.png" : selectedUser?.profilePic || "/avatar.png")
                          }
                          alt="avatar"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                      {isGroup && !isMyMessage && (
                        <span className="text-xs font-semibold text-base-content/60 mb-1 ml-1">
                          {message.senderId.fullname}
                        </span>
                      )}

                      <div className={`
                        relative px-4 py-2 lg:py-3 lg:px-5 rounded-2xl shadow-sm text-[15px] leading-relaxed
                        ${isMyMessage
                          ? "bg-primary text-primary-content rounded-tr-none"
                          : "bg-base-100 text-base-content border border-base-300 rounded-tl-none"
                        }
                        ${(message.isDeleted || message.deletedForEveryone) ? "italic opacity-80" : ""}
                      `}>
                        {/* Attachments */}
                        {message.image && !(message.isDeleted || message.deletedForEveryone) && (
                          <div className="mb-2">
                            {message.type === "audio" || message.image.match(/\.(webm|mp3|wav)$/i) ? (
                              <audio controls src={message.image} className="max-w-full" />
                            ) : (
                              <img
                                src={message.image}
                                alt="Attachment"
                                className="rounded-lg max-h-[300px] w-full object-cover bg-base-content/5"
                              />
                            )}
                          </div>
                        )}

                        {/* Text Content */}
                        {isEditing ? (
                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <input
                              type="text"
                              className="input input-sm bg-white/20 text-inherit w-full border-none focus:outline-none focus:ring-1 focus:ring-white/50 placeholder-white/60"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEditSave(message._id);
                                if (e.key === "Escape") handleEditCancel();
                              }}
                            />
                            <div className="flex justify-end gap-1">
                              <button onClick={handleEditCancel} className="btn btn-xs btn-ghost text-inherit opacity-80">Cancel</button>
                              <button onClick={() => handleEditSave(message._id)} className="btn btn-xs btn-circle btn-success text-white">✓</button>
                            </div>
                          </div>
                        ) : (
                          message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>
                        )}

                        {/* Metadata Row */}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isMyMessage ? "text-primary-content/70" : "text-base-content/40"}`}>
                          {message.isEdited && !(message.isDeleted || message.deletedForEveryone) && <span className="text-[10px] italic">edited</span>}
                          <time className="text-[10px] min-w-[35px] text-right">{formatMessageTime(message.createdAt)}</time>
                          {isMyMessage && (
                            <div className={message.text ? "" : "translate-y-0.5"}>
                              <MessageStatus status={message.status} />
                            </div>
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className={`absolute -bottom-2 ${isMyMessage ? "left-0" : "right-0"} flex bg-base-100 rounded-full px-1.5 py-0.5 shadow border border-base-300 text-xs z-10`}>
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

                      {/* Hover Actions */}
                      {!(message.isDeleted || message.deletedForEveryone) && !isEditing && (
                        <div className={`flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity self-center px-2`}>
                          {/* React Button */}
                          <div className="dropdown dropdown-top dropdown-end">
                            <div tabIndex={0} role="button" className="p-1.5 text-base-content/40 hover:text-base-content/60 hover:bg-base-200 rounded-full transition-colors cursor-pointer"><Smile size={16} /></div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 border border-base-300 rounded-xl w-52 flex-row flex-wrap gap-1 justify-center">
                              {["👍", "❤️", "😂", "😮", "😢", "😡"].map(emoji => (
                                <li key={emoji}>
                                  <button onClick={() => reactToMessage(message._id, emoji)} className="text-xl p-2 hover:bg-base-200 rounded-lg">{emoji}</button>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {isMyMessage && (
                            <>
                              <button onClick={() => handleEditStart(message)} className="p-1.5 text-base-content/40 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors" title="Edit">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => setMessageToDelete(message)} className="p-1.5 text-base-content/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
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
              className="absolute bottom-20 right-8 btn btn-circle btn-sm btn-primary shadow-lg animate-bounce z-20"
            >
              ⬇️
            </button>
          )}

          {/* Fixed Input Area */}
          <div className="flex-shrink-0 z-30 bg-base-200">
            <MessageInput />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatContainer;
