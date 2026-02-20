import React, { memo, useEffect, useRef } from "react";
import { formatMessageTime } from "../lib/util";
import MessageStatus from "./MessageStatus";
import { Smile, Edit2, Trash2, Reply } from "lucide-react";
import gsap from "gsap";
import { useChatStore } from "../store/useChattingStore";

const MessageBubble = ({
    message,
    isMyMessage,
    authUser,
    selectedUser,
    isGroup,
    isEditing,
    editText,
    setEditText,
    handleEditSave,
    handleEditCancel,
    handleEditStart,
    setMessageToDelete,
    reactToMessage,
    votePoll
}) => {
    const bubbleRef = useRef(null);
    const { setReplyToMessage } = useChatStore();
    const swipeRef = useRef(null);
    const swiping = useRef(false);

    const handleTouchStart = (e) => {
        swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, active: true, isScrolling: false };
    };

    const handleTouchMove = (e) => {
        if (!swipeRef.current?.active) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - swipeRef.current.startX;
        const diffY = Math.abs(currentY - swipeRef.current.startY);

        // If we determine the user is scrolling vertically, abort the swipe
        if (!swiping.current) {
            if (diffY > Math.abs(diffX)) {
                swipeRef.current.isScrolling = true;
                swipeRef.current.active = false;
                return;
            }
        }

        if (swipeRef.current.isScrolling) return;

        if (diffX > 0 && diffX < 80) { // Max swipe visual
            if (bubbleRef.current) {
                bubbleRef.current.style.transform = `translateX(${diffX}px)`;
                swiping.current = true;
                // Preemptively prevent default to stop Android back gestures or overscroll if we are genuinely swiping
                if (e.cancelable) e.preventDefault();
            }
        }
    };

    const handleTouchEnd = (e) => {
        if (!swipeRef.current?.active && !swiping.current) return;
        swipeRef.current.active = false;

        if (!swiping.current) return;
        swiping.current = false;

        const currentX = e.changedTouches[0].clientX;
        const diffX = currentX - swipeRef.current.startX;

        if (bubbleRef.current) {
            bubbleRef.current.style.transition = "transform 0.2s ease-out";
            bubbleRef.current.style.transform = "translateX(0px)";
            setTimeout(() => {
                if (bubbleRef.current) bubbleRef.current.style.transition = "";
            }, 200);
        }

        if (diffX > 60) {
            setReplyToMessage(message);
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
        }
    };

    useEffect(() => {
        if (bubbleRef.current && message.status === "pending") {
            gsap.fromTo(
                bubbleRef.current,
                { opacity: 0, y: 15, scale: 0.95 },
                { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
            );
        }
    }, [message.status]);

    if (message.type === "system") {
        return (
            <div className="flex justify-center my-4 animate-fade-in-up">
                <span className="bg-base-300/60 text-base-content/60 text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                    {message.text}
                </span>
            </div>
        );
    }

    // Poll Rendering
    if (message.type === "poll" && message.pollId) {
        const poll = message.pollId;
        const totalVotes = poll.options.reduce((acc, opt) => acc + opt.voteCount, 0);

        return (
            <div className={`flex w-full ${isMyMessage ? "justify-end" : "justify-start"} animate-fade-in-up`}>
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
    const replyData = message.replyTo;

    return (
        <div
            id={`msg-${message._id}`}
            className={`flex w-full relative overflow-hidden py-1 ${isMyMessage ? "justify-end" : "justify-start"} group/message`}
        >
            <div
                ref={bubbleRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={() => setReplyToMessage(message)}
                className={`max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] flex gap-3 ${isMyMessage ? "flex-row-reverse" : "flex-row"} z-10 cursor-pointer lg:cursor-default`}
            >

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
            ${message.status === "pending" ? "opacity-70" : ""}
          `}>
                        {/* Reply block */}
                        {replyData && !(message.isDeleted || message.deletedForEveryone) && (
                            <div className="mb-2 p-2 rounded block border-l-4 border-primary bg-base-content/5 text-sm cursor-pointer hover:bg-base-content/10 transition-colors"
                                onClick={() => {
                                    const el = document.getElementById(`msg-${replyData._id}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}>
                                <div className="font-bold text-xs opacity-80 text-primary">{replyData.senderId?.fullname || 'User'}</div>
                                <div className="truncate opacity-70 max-w-full text-xs mt-0.5">{replyData.text || 'Attachment'}</div>
                            </div>
                        )}

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

                            {/* Reply Button */}
                            <button onClick={(e) => { e.stopPropagation(); setReplyToMessage(message); }} className="p-1.5 text-base-content/40 hover:text-primary hover:bg-base-200 rounded-full transition-colors" title="Reply">
                                <Reply size={16} />
                            </button>

                            {isMyMessage && message.status !== "pending" && (
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
};

export default memo(MessageBubble);
