import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Mic, Smile, Clock, Plus } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import gsap from "gsap";
import ScheduledMessagesModal from "./productivity/ScheduledMessagesModal";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false); // For Plus button
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachMenuRef = useRef(null);

  const { sendMessage, sendGroupMessage, selectedUser, sendTypingStart, sendTypingStop } = useChatStore();
  const { authUser } = useAuthStore();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const isGroup = !!selectedUser?.members;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSending) return;

    setIsSending(true);
    setShowEmojiPicker(false);

    // Stop typing
    if (isTypingRef.current) {
      sendTypingStop(selectedUser._id, isGroup ? selectedUser._id : null);
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      let content = { text: text.trim(), image: imagePreview };
      await (isGroup ? sendGroupMessage(selectedUser._id, content) : sendMessage(content));

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.focus(); // Keep keyboard open
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
      // Ensure focus is regained even if lost during async op
      setTimeout(() => textareaRef.current?.focus(), 10);
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setText(value);

    // Typing indicator logic
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
      }
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setText(prev => prev + emojiObject.emoji);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = () => { toast.success("Voice messages coming soon!"); };

  return (
    <div className="bg-base-100 border-t border-base-300 p-2 lg:px-4 lg:py-2 min-h-[60px] flex items-end gap-2 relative z-30">

      {/* Popovers */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-[70px] left-4 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} theme="auto" />
        </div>
      )}

      {showScheduleModal && <ScheduledMessagesModal onClose={() => setShowScheduleModal(false)} />}

      {/* Attach Menu */}
      {showAttachMenu && (
        <div ref={attachMenuRef} className="absolute bottom-[70px] left-14 bg-base-100 shadow-xl rounded-xl border border-base-300 p-2 flex flex-col gap-1 min-w-[140px] animate-fade-in z-50">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 rounded-lg text-sm text-base-content/70 transition-colors"
          >
            <Image size={16} className="text-blue-500" /> Photo
          </button>
          <button
            onClick={() => { setShowScheduleModal(true); setShowAttachMenu(false); }}
            className="flex items-center gap-3 px-3 py-2 hover:bg-base-200 rounded-lg text-sm text-base-content/70 transition-colors"
          >
            <Clock size={16} className="text-orange-500" /> Schedule
          </button>
        </div>
      )}
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />

      {/* Left Icons */}
      <div className="flex items-center gap-1 mb-2">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-base-content/40 hover:text-amber-500 hover:bg-base-200 rounded-full transition-colors"
        >
          <Smile size={20} />
        </button>
        <button
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className={`p-2 rounded-full transition-colors ${showAttachMenu ? 'bg-base-200 text-base-content/60' : 'text-base-content/40 hover:text-base-content/60 hover:bg-base-200'}`}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Input Area */}
      <div className="flex-1 bg-base-200 rounded-[20px] px-4 py-2 flex flex-col justify-center min-h-[44px] focus-within:ring-1 focus-within:ring-base-content/20 transition-all mb-1.5 border border-transparent focus-within:bg-base-100 focus-within:border-base-300">
        {imagePreview && (
          <div className="mb-2 relative w-fit">
            <img src={imagePreview} className="h-20 rounded-lg border border-base-300" alt="Preview" />
            <button onClick={removeImage} className="absolute -top-1 -right-1 bg-base-100 rounded-full p-0.5 shadow border border-base-300 hover:text-red-500"><X size={14} /></button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="w-full bg-transparent border-none outline-none text-base-content placeholder:text-base-content/40 text-sm resize-none max-h-[150px] scrollbar-hide"
        />
      </div>

      {/* Right Icon (Send/Mic) */}
      <div className="mb-2">
        {text.trim() || imagePreview ? (
          <button
            onClick={handleSendMessage}
            disabled={isSending}
            className="p-2.5 bg-primary text-primary-content rounded-full hover:bg-primary-focus shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            {isSending ? <span className="loading loading-spinner loading-xs" /> : <Send size={18} />}
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="p-2.5 text-base-content/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <Mic size={20} />
          </button>
        )}
      </div>

    </div>
  );
};
export default MessageInput;
