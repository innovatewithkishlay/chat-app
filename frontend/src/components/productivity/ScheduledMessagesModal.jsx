import React, { useState, useEffect } from "react";
import { useProductivityStore } from "../../store/useProductivityStore";
import { useChatStore } from "../../store/useChattingStore";
import { Calendar, Clock, X, Trash2 } from "lucide-react";

const ScheduledMessagesModal = ({ onClose }) => {
    const { selectedUser } = useChatStore();
    const {
        scheduledMessages,
        fetchScheduledMessages,
        scheduleMessage,
        cancelScheduledMessage,
        isScheduledLoading
    } = useProductivityStore();

    const [content, setContent] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    useEffect(() => {
        if (selectedUser?._id) {
            fetchScheduledMessages(selectedUser._id);
        }
    }, [selectedUser?._id, fetchScheduledMessages]);

    const handleSchedule = async (e) => {
        e.preventDefault();
        if (!content.trim() || !date || !time) return;

        const scheduledAt = new Date(`${date}T${time}`);
        if (scheduledAt <= new Date()) {
            alert("Please select a future time");
            return;
        }

        await scheduleMessage({
            conversationId: selectedUser._id,
            content,
            scheduledAt
        });

        setContent("");
        setDate("");
        setTime("");
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-base-100/80 backdrop-blur-xl border border-base-200 p-6 rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-base-content/90">
                        <Clock size={20} className="text-primary" />
                        <span>Scheduled Messages</span>
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle hover:bg-base-200/50">
                        <X size={20} />
                    </button>
                </div>

                {/* Create Form */}
                <form onSubmit={handleSchedule} className="mb-6 p-1 bg-base-200/30 rounded-xl border border-base-200/50">
                    <textarea
                        className="textarea textarea-ghost w-full mb-2 bg-transparent focus:bg-base-100/50 transition-colors text-base resize-none focus:outline-none"
                        placeholder="Type your message to schedule..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                    />
                    <div className="flex gap-2 p-2">
                        <div className="flex-1 flex gap-2 bg-base-100/50 rounded-lg p-1 border border-base-200/50">
                            <input
                                type="date"
                                className="input input-ghost input-xs w-full focus:outline-none focus:bg-transparent text-xs"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                            <div className="w-px bg-base-300 my-1"></div>
                            <input
                                type="time"
                                className="input input-ghost input-xs w-full focus:outline-none focus:bg-transparent text-xs"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm shadow-lg shadow-primary/20">
                            Schedule
                        </button>
                    </div>
                </form>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {isScheduledLoading ? (
                        <div className="text-center opacity-50 py-8">Loading...</div>
                    ) : scheduledMessages.length === 0 ? (
                        <div className="text-center opacity-40 py-8 flex flex-col items-center gap-2">
                            <Clock size={32} className="opacity-20" />
                            <p className="text-sm">No scheduled messages</p>
                        </div>
                    ) : (
                        scheduledMessages.map((msg) => (
                            <div key={msg._id} className="p-3 bg-base-100/50 border border-base-200/50 rounded-xl flex items-center justify-between group hover:border-primary/30 transition-colors shadow-sm">
                                <div className="flex-1 min-w-0 mr-3">
                                    <p className="font-medium truncate text-sm text-base-content/90">{msg.content}</p>
                                    <p className="text-[10px] opacity-60 flex items-center gap-1 mt-1 font-mono">
                                        <Calendar size={10} />
                                        {new Date(msg.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => cancelScheduledMessage(msg._id)}
                                    className="btn btn-ghost btn-xs btn-circle text-error/70 hover:text-error hover:bg-error/10 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduledMessagesModal;
