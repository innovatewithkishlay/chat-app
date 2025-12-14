import { useEffect } from "react";
import { useCallHistoryStore } from "../store/useCallHistoryStore";
import { useAuthStore } from "../store/useAuthStore";
import { Phone, Video, ArrowDownLeft, ArrowUpRight, Clock, XCircle, CheckCircle } from "lucide-react";

const CallHistory = () => {
    const { calls, isLoading, getCallHistory, subscribeToCallUpdates, unsubscribeFromCallUpdates } = useCallHistoryStore();
    const { authUser } = useAuthStore();

    useEffect(() => {
        getCallHistory();
        subscribeToCallUpdates();
        return () => unsubscribeFromCallUpdates();
    }, [getCallHistory, subscribeToCallUpdates, unsubscribeFromCallUpdates]);

    if (isLoading) {
        return (
            <div className="flex-1 flex justify-center items-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (calls.length === 0) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center text-zinc-500 gap-4">
                <div className="size-20 rounded-full bg-base-200 flex items-center justify-center">
                    <Phone size={40} className="opacity-50" />
                </div>
                <p className="text-lg font-medium">No call history yet</p>
            </div>
        );
    }

    const formatDuration = (seconds) => {
        if (!seconds) return "0s";
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}m ${sec}s`;
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h2 className="text-2xl font-bold mb-6 px-2">Call History</h2>

            {calls.map((call) => {
                const isCaller = call.caller._id === authUser._id;
                const otherUser = isCaller ? call.receiver : call.caller;
                const isMissed = call.status === "MISSED";
                const isRejected = call.status === "REJECTED";
                const isEnded = call.status === "ENDED";

                return (
                    <div key={call._id} className="flex items-center justify-between p-4 bg-base-200/50 rounded-xl hover:bg-base-200 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="avatar">
                                <div className="size-12 rounded-full">
                                    <img src={otherUser.profilePic || "/avatar.png"} alt={otherUser.fullname} />
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    {otherUser.fullname}
                                    {call.callType === "VIDEO" ? <Video size={14} className="text-zinc-400" /> : <Phone size={14} className="text-zinc-400" />}
                                </h3>

                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    {isCaller ? (
                                        <span className="flex items-center gap-1 text-blue-400">
                                            <ArrowUpRight size={14} /> Outgoing
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-green-400">
                                            <ArrowDownLeft size={14} /> Incoming
                                        </span>
                                    )}
                                    <span>•</span>
                                    <span>{formatTime(call.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <div className={`badge ${isMissed ? "badge-error" : isRejected ? "badge-warning" : "badge-success"} gap-1`}>
                                {isMissed && <XCircle size={12} />}
                                {isRejected && <XCircle size={12} />}
                                {isEnded && <CheckCircle size={12} />}
                                {call.status}
                            </div>

                            {isEnded && (
                                <span className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDuration(call.duration)}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CallHistory;
