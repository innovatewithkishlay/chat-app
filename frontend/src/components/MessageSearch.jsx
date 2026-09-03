import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useChatStore } from "../store/useChattingStore";
import { formatMessageTime } from "../lib/util";

const highlightMatch = (text, query) => {
    if (!text || !query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-primary/30 text-inherit rounded-[2px]">{part}</mark>
        ) : (
            part
        )
    );
};

const MessageSearch = ({ chatId, onJumpToMessage }) => {
    const { chatSearchResults, isChatSearchLoading, searchMessagesInChat, closeMessageSearch } = useChatStore();
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const delay = setTimeout(() => {
            searchMessagesInChat(chatId, query);
        }, 300);
        return () => clearTimeout(delay);
    }, [query, chatId, searchMessagesInChat]);

    return (
        <div className="bg-base-100 border-b border-base-300 shadow-sm flex flex-col max-h-[50%] shrink-0">
            <div className="p-2 flex items-center gap-2 border-b border-base-200">
                <Search size={16} className="text-base-content/40 ml-2" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search in this chat..."
                    className="flex-1 bg-transparent outline-none text-sm py-1.5"
                />
                <button
                    onClick={closeMessageSearch}
                    className="p-1.5 text-base-content/40 hover:text-base-content/70 hover:bg-base-200 rounded-full"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar">
                {isChatSearchLoading && (
                    <div className="text-center text-xs text-base-content/40 py-4">Searching...</div>
                )}

                {!isChatSearchLoading && query.trim() && chatSearchResults.length === 0 && (
                    <div className="text-center text-xs text-base-content/40 py-4">No messages found</div>
                )}

                {chatSearchResults.map((message) => (
                    <button
                        key={message._id}
                        onClick={() => {
                            onJumpToMessage(message._id);
                            closeMessageSearch();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-base-200 border-b border-base-200/50 last:border-b-0"
                    >
                        <div className="text-sm text-base-content/80 line-clamp-2">
                            {message.text ? highlightMatch(message.text, query) : "📷 Photo"}
                        </div>
                        <div className="text-[10px] text-base-content/40 mt-0.5">
                            {formatMessageTime(message.createdAt)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MessageSearch;
