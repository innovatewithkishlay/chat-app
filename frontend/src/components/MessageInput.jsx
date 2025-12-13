import { useRef, useState } from "react";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Smile, Mic, StopCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
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

  const EMOJIS = ["😀", "😂", "😍", "🥺", "😭", "😡", "👍", "❤️", "🎉", "🔥", "🤔", "👀", "🙌", "💀", "💩", "🤡"];

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
    if (!text.trim() && !imagePreview && !audioBlob) return;

    try {
      let content = {
        text: text.trim(),
        image: imagePreview,
      };

      if (audioBlob) {
        // Convert audio blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          content.image = reader.result; // Sending audio as "image" field for now
          await send(content);
        };
      } else {
        await send(content);
      }

    } catch (error) {
      console.error("Failed to send message:", error);
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

    // Stop typing immediately (only for 1-1 for now)
    if (socket && !isGroup) socket.emit("stopTyping", { receiverId: selectedUser._id });
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
  };

  const formatDuration = (sec) => {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-4 w-full bg-base-100/50 backdrop-blur-lg border-t border-base-300/50 relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="fixed bottom-20 left-4 md:left-auto bg-base-100 border border-base-300 shadow-xl rounded-xl p-2 grid grid-cols-4 gap-2 z-[9999]">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setText(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-2xl hover:bg-base-200 p-2 rounded-lg transition-colors cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

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

          <button
            type="button"
            className={`btn btn-circle btn-sm btn-ghost text-zinc-400 hover:text-primary transition-colors`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={20} />
          </button>

          <input
            type="text"
            className="w-full input input-bordered rounded-xl input-sm sm:input-md bg-base-200/50 focus:bg-base-200 transition-all border-transparent focus:border-primary/20"
            placeholder={isRecording ? "Recording audio..." : "Type a message..."}
            value={text}
            onChange={handleTyping}
            disabled={isRecording}
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
            disabled={isRecording}
          >
            <Image size={20} />
          </button>
        </div>

        {text.trim() || imagePreview || audioBlob ? (
          <button
            type="submit"
            className="btn btn-sm btn-circle btn-primary shadow-lg hover:scale-105 transition-transform"
          >
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            className={`btn btn-sm btn-circle ${isRecording ? "btn-error animate-pulse" : "btn-ghost text-zinc-400"}`}
            onClick={isRecording ? stopRecording : startRecording}
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
