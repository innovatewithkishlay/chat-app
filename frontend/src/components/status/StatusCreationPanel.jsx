import { useState, useRef } from "react";
import { X, Image as ImageIcon, Type, Send, Loader2, Upload } from "lucide-react";
import { useStatusStore } from "../../store/useStatusStore";
import { useAuthStore } from "../../store/useAuthStore";
import toast from "react-hot-toast";
import ProModal from "../ProModal";

const StatusCreationPanel = ({ onClose }) => {
    const { createStatus } = useStatusStore();
    const { authUser } = useAuthStore();
    const [showProModal, setShowProModal] = useState(false);

    const [activeTab, setActiveTab] = useState("text"); // "text" | "media"
    const [text, setText] = useState("");
    const [color, setColor] = useState("#000000"); // Default black
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState("image"); // "image" | "video"
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef(null);

    const colors = [
        "#000000", // Black
        "#ef4444", // Red
        "#f97316", // Orange
        "#eab308", // Yellow
        "#22c55e", // Green
        "#3b82f6", // Blue
        "#a855f7", // Purple
        "#ec4899", // Pink
    ];

    // 1. Access Control
    if (authUser?.plan !== "PRO") {
        return (
            <div className="w-full h-full flex items-center justify-center p-4 bg-base-100">
                <div className="w-full max-w-sm text-center relative animate-in fade-in zoom-in duration-200">
                    <button onClick={onClose} className="absolute top-0 right-0 text-zinc-500 hover:text-zinc-700">
                        <X size={20} />
                    </button>
                    <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 size={32} className="animate-spin-slow" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Pro Feature</h3>
                    <p className="text-zinc-500 mb-6 text-sm">
                        Status updates are available exclusively for PRO members. Upgrade now to share your moments!
                    </p>
                    <button
                        className="btn btn-primary w-full"
                        onClick={() => setShowProModal(true)}
                    >
                        Upgrade to PRO
                    </button>
                    {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
                </div>
            </div>
        );
    }

    // 2. File Handling
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
            toast.error("Please select an image or video file.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
            toast.error("File size must be less than 10MB.");
            return;
        }

        setMediaFile(file);
        setMediaType(isImage ? "image" : "video");

        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // 3. Submit
    const handleSubmit = async () => {
        if (activeTab === "text" && !text.trim()) return;
        if (activeTab === "media" && !mediaFile) return;

        setIsSubmitting(true);

        let statusData = {
            type: activeTab === "text" ? "text" : mediaType,
            content: activeTab === "text" ? text : mediaPreview, // base64 for media
            color: activeTab === "text" ? color : null,
            privacy: "friends"
        };

        const success = await createStatus(statusData);
        setIsSubmitting(false);

        if (success) onClose();
    };

    return (
        <div className="w-full h-full bg-base-100 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-base-200 flex items-center justify-between">
                <h3 className="font-bold text-lg">Create Status</h3>
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                    <X size={20} />
                </button>
            </div>

            {/* Mode Toggles */}
            <div className="flex p-2 gap-2 bg-base-200/50">
                <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === "text" ? "bg-base-100 shadow text-primary" : "text-zinc-500 hover:bg-base-200"}`}
                    onClick={() => setActiveTab("text")}
                >
                    <Type size={16} /> Text
                </button>
                <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${activeTab === "media" ? "bg-base-100 shadow text-primary" : "text-zinc-500 hover:bg-base-200"}`}
                    onClick={() => setActiveTab("media")}
                >
                    <ImageIcon size={16} /> Media
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col">
                {activeTab === "text" ? (
                    <div className="flex-1 flex flex-col gap-4">
                        <div
                            className="w-full flex-1 rounded-xl p-8 flex items-center justify-center text-center text-white text-2xl font-bold min-h-[200px] transition-colors duration-300"
                            style={{ backgroundColor: color }}
                        >
                            {text || "Type something..."}
                        </div>

                        <textarea
                            className="textarea textarea-bordered w-full resize-none"
                            placeholder="What's on your mind?"
                            rows={3}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            maxLength={500}
                        />

                        <div className="flex gap-2 justify-center flex-wrap">
                            {colors.map((c) => (
                                <button
                                    key={c}
                                    className={`size-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-base-content scale-110" : "border-transparent"}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-base-300 rounded-xl bg-base-200/30 relative overflow-hidden">
                        {mediaPreview ? (
                            <div className="relative w-full h-full bg-black flex items-center justify-center">
                                {mediaType === "video" ? (
                                    <video src={mediaPreview} className="max-w-full max-h-full object-contain" controls />
                                ) : (
                                    <img src={mediaPreview} alt="Preview" className="max-w-full max-h-full object-contain" />
                                )}
                                <button
                                    onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                                    className="absolute top-2 right-2 btn btn-circle btn-sm btn-error text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <Upload className="size-12 mx-auto text-zinc-400 mb-2" />
                                <p className="text-sm font-medium mb-1">Upload Photo or Video</p>
                                <p className="text-xs text-zinc-500 mb-4">Max 10MB</p>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                                    Select File
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-base-200 flex justify-end gap-2">
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button
                    className="btn btn-primary min-w-[100px]"
                    onClick={handleSubmit}
                    disabled={isSubmitting || (activeTab === "text" && !text.trim()) || (activeTab === "media" && !mediaFile)}
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={16} /> Share</>}
                </button>
            </div>

        </div>
    );
};

export default StatusCreationPanel;
