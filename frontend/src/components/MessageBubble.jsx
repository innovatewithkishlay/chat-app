import { memo, useEffect, useRef, useState } from "react";
import { animate, formatMessageTime } from "../lib/util";
import MessageStatus from "./MessageStatus";
import { Smile, Edit2, Trash2, Reply, Star } from "lucide-react";
import { useChatStore } from "../store/useChattingStore";
import Avatar from "./Avatar";

const MessageBubble = ({
    message,
    isMyMessage,
    isSequential,
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
    const { setReplyToMessage, toggleStarMessage } = useChatStore();
    const isStarred = message.starredBy?.includes(authUser._id);
    const swipeRef = useRef(null);
    const swiping = useRef(false);
    const longPressTimer = useRef(null);
    // Touch devices have no hover, so a long-press opens the action toolbar.
    const [actionsOpen, setActionsOpen] = useState(false);

    useEffect(() => {
        if (!actionsOpen) return;
        const close = (e) => {
            if (!bubbleRef.current?.parentElement?.contains(e.target)) setActionsOpen(false);
        };
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [actionsOpen]);

    useEffect(() => () => clearTimeout(longPressTimer.current), []);

    const handleTouchStart = (e) => {
        swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, active: true, isScrolling: false };
        clearTimeout(longPressTimer.current);
        longPressTimer.current = setTimeout(() => {
            if (!swiping.current && !swipeRef.current?.isScrolling) {
                setActionsOpen(true);
                if (window.navigator?.vibrate) window.navigator.vibrate(20);
            }
        }, 450);
    };

    const handleTouchMove = (e) => {
        if (!swipeRef.current?.active) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - swipeRef.current.startX;
        const diffY = Math.abs(currentY - swipeRef.current.startY);
        if (Math.abs(diffX) > 8 || diffY > 8) clearTimeout(longPressTimer.current);

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
        clearTimeout(longPressTimer.current);
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
        if (bubbleRef.current && message.status === "sending") {
            animate(
                bubbleRef.current,
                [{ opacity: 0, transform: "translateY(10px) scale(0.97)" }, { opacity: 1, transform: "none" }],
                { duration: 180, easing: "ease-out" }
            );
        }
    }, [message.status]);

    if (message.type === "system") {
        return (
            <div className="flex justify-center my-3">
                <span className="bg-base-100 border border-base-300 text-base-content/60 text-xs px-3 py-1 rounded-full">
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
                    {isGroup && !isMyMessage && (
                        <div className="flex-shrink-0 self-start">
                            <Avatar user={message.senderId} size="size-8" />
                        </div>
                    )}

                    <div className="p-4 rounded-2xl border bg-base-100 border-base-300 min-w-[240px]">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="font-bold text-base-content">{poll.question}</div>
                            {poll.isClosed && (
                                <span className="text-[10px] font-medium text-base-content/40 bg-base-200 px-1.5 py-0.5 rounded-full shrink-0">
                                    Closed
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            {poll.options.map((option, idx) => {
                                const percentage = totalVotes === 0 ? 0 : Math.round((option.voteCount / totalVotes) * 100);
                                const isVoted = poll.votes.some(v => v.userId === authUser._id && v.optionIndex === idx);
                                return (
                                    <div key={idx} onClick={() => !isVoted && !poll.isClosed && votePoll(poll._id, idx)} className={`relative p-2 rounded-lg border overflow-hidden ${poll.isClosed ? "cursor-default" : "cursor-pointer"} ${isVoted ? "border-primary/30 bg-primary/5" : "border-base-300 hover:bg-base-200"}`}>
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

    const isDeleted = message.isDeleted || message.deletedForEveryone;
    const showAvatarColumn = isGroup && !isMyMessage;
    const hasReactions = message.reactions && message.reactions.length > 0;

    return (
        <div
            id={`msg-${message._id}`}
            className={`flex w-full relative ${isMyMessage ? "justify-end" : "justify-start"} group/message ${hasReactions ? "mb-3" : ""}`}
        >
            <div
                ref={bubbleRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => {
                    // Long-press on mobile fires contextmenu; keep it for our toolbar.
                    if (window.matchMedia("(hover: none)").matches) e.preventDefault();
                }}
                onDoubleClick={() => setReplyToMessage(message)}
                className={`relative max-w-[85%] sm:max-w-[70%] lg:max-w-[62%] flex gap-2 ${isMyMessage ? "flex-row-reverse" : "flex-row"} select-text`}
            >

                {/* Avatar: groups only, once per run of messages from the same person */}
                {showAvatarColumn && (
                    <div className="flex-shrink-0 w-8 self-start">
                        {!isSequential && <Avatar user={message.senderId} size="size-8" />}
                    </div>
                )}

                <div className="relative flex flex-col min-w-0">
                    {isGroup && !isMyMessage && !isSequential && (
                        <span className="text-xs font-medium text-base-content/60 mb-1 ml-1">
                            {message.senderId?.fullname}
                        </span>
                    )}

                    <div className={`
            relative px-3.5 py-2 rounded-2xl text-[15px] leading-snug
            ${isMyMessage
                            ? `bg-primary text-primary-content ${isSequential ? "" : "rounded-tr-md"}`
                            : `bg-base-100 text-base-content border border-base-300 ${isSequential ? "" : "rounded-tl-md"}`
                        }
            ${isDeleted ? "italic opacity-70" : ""}
            ${message.status === "sending" ? "opacity-70" : ""}
          `}>
                        {/* Reply block */}
                        {replyData && !(message.isDeleted || message.deletedForEveryone) && (
                            <div className="mb-2 p-2 rounded block border-l-4 border-primary bg-base-content/5 text-sm cursor-pointer hover:bg-base-content/10 transition-colors"
                                onClick={() => {
                                    const el = document.getElementById(`msg-${replyData._id}`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}>
                                <div className="font-bold text-xs opacity-80 text-primary">
                                    {(replyData.senderId?._id === authUser._id || replyData.senderId === authUser._id) ? "You" : (replyData.senderId?.fullname || selectedUser?.fullname || "User")}
                                </div>
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
                        <div className={`flex items-center justify-end gap-1 mt-0.5 -mb-0.5 ${isMyMessage ? "text-primary-content/75" : "text-base-content/45"}`}>
                            {isStarred && <Star size={10} className="fill-current" />}
                            {message.isEdited && !(message.isDeleted || message.deletedForEveryone) && <span className="text-[10px] italic">edited</span>}
                            <time className="text-[11px] whitespace-nowrap">{formatMessageTime(message.createdAt)}</time>
                            {isMyMessage && (
                                <div className={message.text ? "" : "translate-y-0.5"}>
                                    <MessageStatus status={message.status} />
                                </div>
                            )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                            <div className={`absolute -bottom-3 ${isMyMessage ? "right-2" : "left-2"} flex items-center bg-base-100 text-base-content rounded-full px-1.5 py-0.5 shadow-sm border border-base-300 text-xs z-10`}>
                                {Object.entries(
                                    message.reactions.reduce((acc, curr) => {
                                        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                                        return acc;
                                    }, {})
                                ).map(([emoji, count]) => (
                                    <span key={emoji} className="ml-0.5 first:ml-0">{emoji}{count > 1 && <span className="ml-0.5 text-[11px] text-base-content/60">{count}</span>}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Hover Actions */}
                    {!(message.isDeleted || message.deletedForEveryone) && !isEditing && (
                        <div
                            className={`absolute z-20 flex items-center gap-0.5 rounded-full border border-base-300 bg-base-100 p-0.5 shadow-md transition-opacity
                                bottom-full mb-1 ${isMyMessage ? "right-0" : "left-0"}
                                lg:bottom-auto lg:mb-0 lg:top-1/2 lg:-translate-y-1/2 ${isMyMessage ? "lg:right-full lg:mr-2" : "lg:left-full lg:ml-2"}
                                ${actionsOpen
                                    ? "opacity-100"
                                    : "opacity-0 pointer-events-none lg:group-hover/message:opacity-100 lg:group-hover/message:pointer-events-auto"}`}
                        >
                            {/* React Button */}
                            <div className={`dropdown dropdown-top ${isMyMessage ? "dropdown-end" : ""}`}>
                                <div tabIndex={0} role="button" aria-label="React" title="React" className="p-1.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-colors cursor-pointer"><Smile size={16} /></div>
                                <ul tabIndex={0} className="dropdown-content z-[50] menu p-1 shadow-lg bg-base-100 border border-base-300 rounded-full flex-row flex-nowrap gap-0 mb-1">
                                    {["👍", "❤️", "😂", "😮", "😢", "😡"].map(emoji => (
                                        <li key={emoji}>
                                            <button
                                                onClick={() => {
                                                    reactToMessage(message._id, emoji);
                                                    setActionsOpen(false);
                                                    document.activeElement?.blur?.();
                                                }}
                                                className="text-xl p-2 hover:bg-base-200 rounded-lg"
                                                aria-label={`React with ${emoji}`}
                                            >{emoji}</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Reply Button */}
                            <button onClick={(e) => { e.stopPropagation(); setReplyToMessage(message); setActionsOpen(false); }} className="p-1.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-colors" title="Reply" aria-label="Reply">
                                <Reply size={16} />
                            </button>

                            {/* Star Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleStarMessage(message._id); setActionsOpen(false); }}
                                className={`p-1.5 rounded-full transition-colors hover:bg-base-200 ${isStarred ? "text-amber-500" : "text-base-content/50 hover:text-base-content"}`}
                                title={isStarred ? "Unstar" : "Star"}
                                aria-label={isStarred ? "Unstar" : "Star"}
                            >
                                <Star size={16} className={isStarred ? "fill-current" : ""} />
                            </button>

                            {isMyMessage && message.status !== "sending" && (
                                <>
                                    <button onClick={() => { handleEditStart(message); setActionsOpen(false); }} className="p-1.5 text-base-content/50 hover:text-base-content hover:bg-base-200 rounded-full transition-colors" title="Edit" aria-label="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => { setMessageToDelete(message); setActionsOpen(false); }} className="p-1.5 text-base-content/50 hover:text-error hover:bg-base-200 rounded-full transition-colors" title="Delete" aria-label="Delete">
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

// Store updates replace message objects immutably, so identity tells us
// whether anything about the message (text, reactions, poll votes, status,
// stars, edits...) changed. The handler props are stable or only matter while
// editing, which is covered by isEditing/editText.
export default memo(MessageBubble, (prev, next) =>
    prev.message === next.message &&
    prev.isSequential === next.isSequential &&
    prev.isMyMessage === next.isMyMessage &&
    prev.isGroup === next.isGroup &&
    prev.isEditing === next.isEditing &&
    (!next.isEditing || prev.editText === next.editText)
);
