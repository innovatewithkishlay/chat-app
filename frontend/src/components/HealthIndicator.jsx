import React, { useMemo } from "react";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";

const HealthIndicator = () => {
    const { messages, selectedUser } = useChatStore();
    const { authUser } = useAuthStore();

    const health = useMemo(() => {
        if (!messages || messages.length < 10) return null;

        // 1. Balance (Who talks more?)
        const myMsgCount = messages.filter(m => m.senderId === authUser._id).length;
        const balance = myMsgCount / messages.length; // 0.5 is perfect

        // 2. Reply Speed (Avg time between messages from diff users)
        let totalTime = 0;
        let switches = 0;
        for (let i = 1; i < messages.length; i++) {
            if (messages[i].senderId !== messages[i - 1].senderId) {
                const diff = new Date(messages[i].createdAt) - new Date(messages[i - 1].createdAt);
                if (diff < 3600000) { // Ignore gaps > 1 hour
                    totalTime += diff;
                    switches++;
                }
            }
        }
        const avgReplyTime = switches > 0 ? totalTime / switches : 0;
        // Map to 0-1 score (lower is better/faster). Say 1 min is perfect (1.0), 1 hour is slow (0.0)
        // 60000ms = 1.0, 3600000ms = 0.0
        // Let's just categorize: Fast, Normal, Slow

        // 3. Trend (Activity over last 10 msgs vs previous 10)
        // Simplified: Just return raw values for visualization

        return {
            balance, // 0 to 1. 0.5 is balanced.
            avgReplyTime, // ms
        };
    }, [messages, authUser._id]);

    if (!health) return null;

    // Visuals
    // Balance: Bar centered at 50%
    // Speed: Color (Green < 2min, Yellow < 10min, Red > 10min)

    const balancePercent = health.balance * 100;
    const speedColor = health.avgReplyTime < 120000 ? "bg-success" : health.avgReplyTime < 600000 ? "bg-warning" : "bg-error";

    return (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-base-100/80 backdrop-blur-md px-4 py-1 rounded-full shadow-sm border border-base-200 flex items-center gap-4 text-xs z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2" title="Conversation Balance">
                <span className="opacity-50">⚖️</span>
                <div className="w-16 h-1.5 bg-base-300 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${balancePercent}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2" title="Reply Speed">
                <span className="opacity-50">⚡</span>
                <div className={`w-2 h-2 rounded-full ${speedColor} animate-pulse`} />
            </div>
        </div>
    );
};

export default HealthIndicator;
