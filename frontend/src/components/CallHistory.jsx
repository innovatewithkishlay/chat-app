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
                <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
        );
    }

    if (calls.length === 0) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center text-base-content/30 gap-3">
                <div className="size-16 rounded-full bg-base-200/50 flex items-center justify-center">
                    <Clock size={32} className="opacity-50" />
                </div>
                <p className="text-sm font-medium">No call history</p>
            </div>
        );
    }

    const formatDuration = (seconds) => {
        if (!seconds) return "0s";
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-base-100">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-base-200">
                <h2 className="text-sm font-bold uppercase tracking-wider opacity-70">Recent Calls</h2>
                {calls.length > 0 && (
                    <button
                        onClick={() => {
                            if (window.confirm("Clear all call history?")) {
                                useCallHistoryStore.getState().clearCallHistory();
                            }
                        }}
                        className="btn btn-ghost btn-xs text-error opacity-70 hover:opacity-100"
                        title="Clear History"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {calls.map((call) => {
                    const isCaller = call.caller._id === authUser._id;
                    const otherUser = isCaller ? call.receiver : call.caller;
                    const isMissed = call.status === "MISSED";
                    const isRejected = call.status === "REJECTED";

                    return (
                        <div key={call._id} className="flex items-center gap-3 p-3 hover:bg-base-200 transition-colors border-b border-base-100 cursor-default group">
                            {/* Avatar */}
                            <div className="avatar">
                                <div className="size-10 rounded-full border border-base-200">
                                    <img src={otherUser.profilePic || "/avatar.png"} alt={otherUser.fullname} />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h3 className={`font-medium text-sm truncate ${isMissed ? 'text-error' : ''}`}>
                                        {otherUser.fullname}
                                    </h3>
                                    <span className="text-[10px] text-base-content/40 whitespace-nowrap ml-2">
                                        {formatTime(call.createdAt)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-base-content/60">
                                    {/* Direction Icon */}
                                    {isCaller ? (
                                        <ArrowUpRight size={12} className={isMissed || isRejected ? "text-error" : "text-success"} />
                                    ) : (
                                        <ArrowDownLeft size={12} className={isMissed || isRejected ? "text-error" : "text-primary"} />
                                    )}

                                    {/* Status Text */}
                                    <span className={`truncate ${isMissed ? "text-error" : ""}`}>
                                        {call.status === "ENDED" ? (
                                            isCaller ? "Outgoing" : "Incoming"
                                        ) : (
                                            call.status.charAt(0) + call.status.slice(1).toLowerCase()
                                        )}
                                    </span>

                                    {/* Duration */}
                                    {call.duration > 0 && (
                                        <>
                                            <span className="text-base-content/30">•</span>
                                            <span>{formatDuration(call.duration)}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Call Type Icon */}
                            <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                                {call.callType === "VIDEO" ? (
                                    <Video size={16} className="text-base-content/70" />
                                ) : (
                                    <Phone size={16} className="text-base-content/70" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CallHistory;
