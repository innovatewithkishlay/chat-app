import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Mic, StopCircle, Trash2, Smile } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import gsap from "gsap";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { sendMessage, sendGroupMessage, selectedUser, sendTypingStart, sendTypingStop } = useChatStore();
  const { authUser } = useAuthStore();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const isGroup = !!selectedUser.members;

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // GSAP Animation for Emoji Picker
  useEffect(() => {
    if (showEmojiPicker && emojiPickerRef.current) {
      gsap.fromTo(emojiPickerRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "back.out(1.7)" }
      );
    }
  }, [showEmojiPicker]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;
    if (isSending) return;

    setIsSending(true);
    setShowEmojiPicker(false);

    // Stop typing immediately
    if (isTypingRef.current) {
      sendTypingStop(selectedUser._id, isGroup ? selectedUser._id : null);
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      let content = { text: text.trim(), image: imagePreview };
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
    setText("");
    setImagePreview(null);
    setAudioBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setText(value);

    // Slash Commands Logic (Simple Example)
    if (value === "/shrug") {
      setText("¯\\_(ツ)_/¯");
      return;
    }

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
      }, 1000);
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTypingStop(receiverId, groupId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleEmojiClick = (emojiObject) => {
    const cursor = textareaRef.current.selectionStart;
    const msg = text.slice(0, cursor) + emojiObject.emoji + text.slice(cursor);
    setText(msg);

    // Restore cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = cursor + emojiObject.emoji.length;
        textareaRef.current.selectionEnd = cursor + emojiObject.emoji.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  return (
    <div className="p-4 w-full bg-base-100/50 backdrop-blur-lg border-t border-base-300/50 relative z-50">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-base-300">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"}
            lazyLoadEmojis={true}
            searchDisabled={false}
            width={300}
            height={400}
          />
        </div>
      )}

      {imagePreview && (
        <div className="mb-3 flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-zinc-700 shadow-lg" />
            <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center hover:bg-base-200 transition-colors">
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {audioBlob && (
        <div className="mb-3 flex items-center gap-3 bg-base-200/50 p-2 rounded-xl w-fit">
          <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-48" />
          <button onClick={() => setAudioBlob(null)} className="btn btn-ghost btn-xs text-error"><Trash2 size={16} /></button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-end gap-3">
        <div className="flex-1 flex gap-2 relative items-end bg-base-200/50 rounded-2xl p-1.5 border border-transparent focus-within:border-primary/20 transition-all">

          <button
            type="button"
            className={`btn btn-circle btn-sm btn-ghost text-zinc-400 hover:text-primary transition-colors`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={20} />
          </button>

          <textarea
            ref={textareaRef}
            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-[150px] py-2 text-sm leading-relaxed scrollbar-hide"
            placeholder={isRecording ? "Recording audio..." : "Type a message..."}
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            disabled={isRecording || isSending}
            rows={1}
          />

          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />

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
            className="btn btn-circle btn-primary shadow-lg hover:scale-105 transition-transform mb-1"
          >
            {isSending ? <span className="loading loading-spinner loading-xs"></span> : <Send size={18} />}
          </button>
        ) : (
          <button
            type="button"
            className={`btn btn-circle mb-1 ${isRecording ? "btn-error animate-pulse" : "btn-ghost text-zinc-400"}`}
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
