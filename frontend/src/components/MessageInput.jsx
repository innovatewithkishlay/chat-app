import { useRef, useState } from "react";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, sendGroupMessage, selectedUser, conversations, sentRequests, sendTalkRequest, friends } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const typingTimeoutRef = useRef(null);

  const isGroup = !!selectedUser.members;

  // Check if conversation exists (only for 1-1 chats)
  const isConversation = !isGroup && conversations.some((c) =>
    c.participants.some((p) => p._id === selectedUser._id)
  );

  // Check if request pending (only for 1-1 chats)
  const pendingRequest = !isGroup && sentRequests.find(
    (r) => r.receiver._id === selectedUser._id && r.status === "PENDING"
  );

  // Check if friends (only for 1-1 chats)
  const isFriend = !isGroup && friends.some((f) => f._id === selectedUser._id);

  if (!isGroup && !isFriend) {
    return (
      <div className="p-4 w-full flex justify-center items-center bg-base-200/50 backdrop-blur-sm border-t border-base-300">
        {pendingRequest ? (
          <div className="text-zinc-500 italic flex items-center gap-2 text-sm">
            <span className="loading loading-dots loading-xs"></span>
            Request sent, waiting for approval...
          </div>
        ) : isConversation ? (
          <div className="text-zinc-500 text-sm">
            You are no longer friends with this user.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="text-zinc-500 text-sm">You need to send a talk request to chat.</span>
            <button
              onClick={() => sendTalkRequest(selectedUser._id)}
              className="btn btn-primary btn-sm gap-2 rounded-full px-6"
            >
              <Send size={16} />
              Send Request
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      if (isGroup) {
        await sendGroupMessage(selectedUser._id, {
          text: text.trim(),
          image: imagePreview,
        });
      } else {
        await sendMessage({
          text: text.trim(),
          image: imagePreview,
        });
      }

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Stop typing immediately (only for 1-1 for now)
      if (socket && !isGroup) socket.emit("stopTyping", { receiverId: selectedUser._id });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);

    if (!socket || isGroup) return; // Skip typing for groups for now

    socket.emit("typing", { receiverId: selectedUser._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: selectedUser._id });
    }, 2000);
  };

  const handleImageClick = () => {
    // Check limits
    const isFree = authUser.plan === "FREE";
    const imagesSent = authUser.usage?.imagesSent || 0;

    // Hardcoded limit check for UI feedback (should match backend config)
    // Ideally fetch config or use limits from authUser if backend sent them
    const limit = isFree ? 2 : 100;

    if (imagesSent >= limit) {
      toast.error(`Daily image limit (${limit}) reached. Upgrade to PRO!`);
      return;
    }

    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 w-full bg-base-100/50 backdrop-blur-lg border-t border-base-300/50">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-xl border border-zinc-700 shadow-lg"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center hover:bg-base-200 transition-colors"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
        <div className="flex-1 flex gap-2 relative">
          <input
            type="text"
            className="w-full input input-bordered rounded-xl input-sm sm:input-md bg-base-200/50 focus:bg-base-200 transition-all border-transparent focus:border-primary/20"
            placeholder="Type a message..."
            value={text}
            onChange={handleTyping}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle btn-sm btn-ghost absolute right-2 top-1/2 -translate-y-1/2
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400 hover:text-zinc-300"}`}
            onClick={handleImageClick}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle btn-primary shadow-lg hover:scale-105 transition-transform"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
