import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import SettingsLayout from "../components/SettingsLayout";
import Avatar from "../components/Avatar";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/util";

const StarredMessagesPage = () => {
    const navigate = useNavigate();
    const { authUser } = useAuthStore();
    const { starredMessages, isStarredLoading, getStarredMessages, toggleStarMessage, setSelectedUser } = useChatStore();

    useEffect(() => {
        getStarredMessages();
    }, [getStarredMessages]);

    const openMessage = (message) => {
        // Jump to the conversation the message belongs to. Landing exactly on
        // the message bubble would need the chat's full history loaded first,
        // so this opens the conversation - a reasonable middle ground over
        // building a second cross-page scroll-to-message path.
        if (message.groupId) {
            setSelectedUser(message.groupId);
        } else {
            const other = message.senderId?._id === authUser._id ? message.recieverId : message.senderId;
            if (other) setSelectedUser(other);
        }
        navigate("/");
    };

    return (
        <SettingsLayout>
            <div className="space-y-6 mx-auto max-w-[820px]">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-base-content mb-2 flex items-center gap-2">
                        <Star size={22} className="text-amber-500 fill-amber-500" />
                        Starred Messages
                    </h2>
                    <p className="text-base-content/60">Messages you&apos;ve starred across all your chats</p>
                </div>

                {isStarredLoading ? (
                    <div className="text-center py-12 text-base-content/40 text-sm">Loading...</div>
                ) : starredMessages.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center text-base-content/40">
                        <Star size={40} className="opacity-20 mb-3" />
                        <p className="text-sm">No starred messages yet.</p>
                        <p className="text-xs mt-1">Tap the star icon on any message to save it here.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {starredMessages.map((message) => {
                            const sender = message.senderId;
                            const context = message.groupId ? message.groupId.name : null;
                            return (
                                <div
                                    key={message._id}
                                    className="bg-base-100 border border-base-300 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                                    onClick={() => openMessage(message)}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar user={message.groupId || sender} size="size-9" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-sm font-medium text-base-content/80 truncate">
                                                    {sender?.fullname || "Unknown"}
                                                    {context && <span className="text-base-content/40 font-normal"> · {context}</span>}
                                                </div>
                                                <span className="text-[10px] text-base-content/40 whitespace-nowrap">
                                                    {formatMessageTime(message.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-base-content/60 mt-0.5 line-clamp-2">
                                                {message.text || (message.image ? "📷 Photo" : "Attachment")}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleStarMessage(message._id);
                                                getStarredMessages();
                                            }}
                                            className="p-1.5 opacity-0 group-hover:opacity-100 text-amber-500 hover:bg-amber-50 rounded-full transition-all shrink-0"
                                            title="Unstar"
                                        >
                                            <Star size={16} className="fill-current" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </SettingsLayout>
    );
};

export default StarredMessagesPage;
