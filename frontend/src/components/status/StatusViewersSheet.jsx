import { useEffect, useState } from "react";
import { X, Clock, User } from "lucide-react";
import { useStatusStore } from "../../store/useStatusStore";
import { useAuthStore } from "../../store/useAuthStore";
import { formatDistanceToNow } from "date-fns";
import Avatar from "../Avatar";

const StatusViewersSheet = ({ storyId, isOpen, onClose }) => {
    const { fetchStatusViewers } = useStatusStore();
    const { socket } = useAuthStore.getState();
    const [viewers, setViewers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Trigger animation on open
            requestAnimationFrame(() => setAnimate(true));
            loadViewers();
        } else {
            setAnimate(false);
        }
    }, [isOpen, storyId]);

    const loadViewers = async () => {
        setLoading(true);
        const data = await fetchStatusViewers(storyId);
        setViewers(data || []);
        setLoading(false);
    };

    // Real-time listener for new views
    useEffect(() => {
        if (!isOpen || !socket) return;

        const handleNewView = (data) => {
            // data: { storyId, viewer: { _id, username, profilePic, viewedAt } }
            if (data.storyId === storyId) {
                setViewers((prev) => {
                    // Check duplicate
                    if (prev.find(v => v._id === data.viewer._id)) return prev;
                    // Prepend new viewer
                    return [data.viewer, ...prev];
                });
            }
        };

        socket.on("status:viewed", handleNewView);

        return () => {
            socket.off("status:viewed", handleNewView);
        };
    }, [isOpen, storyId, socket]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${animate ? "opacity-100" : "opacity-0"}`}
                onClick={onClose}
            />

            {/* Sheet / Modal */}
            <div
                className={`
                    relative w-full max-w-md bg-base-100 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]
                    transition-all duration-300 ease-in-out transform
                    ${animate ? "translate-y-0 sm:scale-100 opacity-100" : "translate-y-full sm:translate-y-0 sm:scale-95 opacity-0"}
                `}
            >
                {/* Header */}
                <div className="p-4 border-b border-base-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">Viewed by {viewers.length}</h3>
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-0">
                    {loading ? (
                        <div className="p-8 text-center text-zinc-500">
                            <span className="loading loading-spinner loading-md"></span>
                        </div>
                    ) : viewers.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                            <Clock className="size-8 opacity-20" />
                            <p>No views yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-base-200">
                            {viewers.map((viewer) => (
                                <div key={viewer._id} className="flex items-center gap-3 p-4 hover:bg-base-200/50 transition-colors">
                                    <Avatar user={{ ...viewer, profilePic: viewer.profilePic, name: viewer.username }} size="size-10" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{viewer.username}</div>
                                        <div className="text-xs text-zinc-500 flex items-center gap-1">
                                            {formatDistanceToNow(new Date(viewer.viewedAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatusViewersSheet;
