import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Mic, StopCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const { sendMessage, sendGroupMessage, selectedUser, conversations, sentRequests, sendTalkRequest, friends, sendTypingStart, sendTypingStop } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const isGroup = !!selectedUser.members;

  // ... (checks)

  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        sendTypingStop(selectedUser._id, isGroup ? selectedUser._id : null);
        isTypingRef.current = false;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [selectedUser._id, isGroup, sendTypingStop]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;
    if (isSending) return;

    setIsSending(true);

    // Stop typing immediately
    if (isTypingRef.current) {
      sendTypingStop(selectedUser._id, isGroup ? selectedUser._id : null);
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      // ... (send logic)
      let content = {
        text: text.trim(),
        image: imagePreview,
      };

      if (audioBlob) {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          content.image = reader.result;
          await send(content);
        };
      } else {
        await send(content);
      }

    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const send = async (content) => {
    if (isGroup) {
      await sendGroupMessage(selectedUser._id, content);
    } else {
      await sendMessage(content);
    }

    // Clear form
    setText("");
    setImagePreview(null);
    setAudioBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setText(value);

    const receiverId = selectedUser._id;
    const groupId = isGroup ? selectedUser._id : null;

    if (value.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        sendTypingStart(receiverId, groupId);
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        sendTypingStop(receiverId, groupId);
      }, 1000); // 1 second debounce
    } else {
      // If empty, stop immediately
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTypingStop(receiverId, groupId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleImageClick = () => {
    const isFree = authUser.plan === "FREE";
    const imagesSent = authUser.usage?.imagesSent || 0;
    const limit = isFree ? 2 : 100;

    if (imagesSent >= limit) {
      toast.error(`Daily image limit (${limit}) reached. Upgrade to PRO!`);
      return;
    }

    fileInputRef.current?.click();
  };

  const startRecording = async () => {
    toast.success("Audio functionality coming soon!");
    return;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (sec) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-4 w-full bg-base-100/50 backdrop-blur-lg border-t border-base-300/50 relative">
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

      {audioBlob && (
        <div className="mb-3 flex items-center gap-3 bg-base-200/50 p-2 rounded-xl w-fit">
          <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-48" />
          <button onClick={() => setAudioBlob(null)} className="btn btn-ghost btn-xs text-error">
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-3">
        <div className="flex-1 flex gap-2 relative items-center">

          <input
            ref={inputRef}
            type="text"
            className="w-full input input-bordered rounded-xl input-sm sm:input-md bg-base-200/50 focus:bg-base-200 transition-all border-transparent focus:border-primary/20"
            placeholder={isRecording ? "Recording audio..." : "Type a message..."}
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            disabled={isRecording || isSending}
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
            className={`hidden sm:flex btn btn-circle btn-sm btn-ghost text-zinc-400 hover:text-zinc-300`}
            onClick={handleImageClick}
            disabled={isRecording || isSending}
          >
            <Image size={20} />
          </button>
        </div>

        {text.trim() || imagePreview || audioBlob ? (
          <button
            type="submit"
            disabled={isSending}
            className="btn btn-sm btn-circle btn-primary shadow-lg hover:scale-105 transition-transform"
          >
            {isSending ? <span className="loading loading-spinner loading-xs"></span> : <Send size={18} />}
          </button>
        ) : (
          <button
            type="button"
            className={`btn btn-sm btn-circle ${isRecording ? "btn-error animate-pulse" : "btn-ghost text-zinc-400"}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending}
          >
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
        )}

        {isRecording && (
          <span className="text-error text-xs font-mono absolute -top-6 right-4 bg-base-100 px-2 py-1 rounded border border-error/20">
            {formatDuration(recordingDuration)}
          </span>
        )}
      </form>
    </div>
  );
};
export default MessageInput;
