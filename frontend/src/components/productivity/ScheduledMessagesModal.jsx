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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-100 p-6 rounded-xl w-[500px] shadow-xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Clock size={20} /> Scheduled Messages
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X size={20} />
                    </button>
                </div>

                {/* Create Form */}
                <form onSubmit={handleSchedule} className="mb-6 p-4 bg-base-200/50 rounded-lg">
                    <textarea
                        className="textarea textarea-bordered w-full mb-3"
                        placeholder="Type your message..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={2}
                    />
                    <div className="flex gap-2">
                        <input
                            type="date"
                            className="input input-bordered input-sm flex-1"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <input
                            type="time"
                            className="input input-bordered input-sm flex-1"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary btn-sm">
                            Schedule
                        </button>
                    </div>
                </form>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2">
                    {isScheduledLoading ? (
                        <div className="text-center opacity-50">Loading...</div>
                    ) : scheduledMessages.length === 0 ? (
                        <div className="text-center opacity-50 py-4">No scheduled messages</div>
                    ) : (
                        scheduledMessages.map((msg) => (
                            <div key={msg._id} className="p-3 bg-base-200 rounded-lg flex items-center justify-between group">
                                <div className="flex-1 min-w-0 mr-3">
                                    <p className="font-medium truncate">{msg.content}</p>
                                    <p className="text-xs opacity-60 flex items-center gap-1">
                                        <Calendar size={10} />
                                        {new Date(msg.scheduledAt).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => cancelScheduledMessage(msg._id)}
                                    className="btn btn-ghost btn-xs btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
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
