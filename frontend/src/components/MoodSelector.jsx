import React, { useState } from "react";
import { useChatStore } from "../store/useChattingStore";
import { X, Clock } from "lucide-react";

const MOODS = [
    { emoji: "🧠", label: "Focused" },
    { emoji: "😴", label: "Busy" },
    { emoji: "🎉", label: "Available" },
    { emoji: "☕", label: "Break" },
    { emoji: "🚗", label: "Driving" },
    { emoji: "🏋️", label: "Gym" },
];

const MoodSelector = ({ isOpen, onClose }) => {
    const { updateMood } = useChatStore();
    const [selectedMood, setSelectedMood] = useState(null);
    const [duration, setDuration] = useState(60); // minutes

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!selectedMood) return;
        await updateMood(selectedMood.emoji, duration);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-base-100 p-6 rounded-2xl shadow-xl w-80 border border-base-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Set Mood Status</h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    {MOODS.map((mood) => (
                        <button
                            key={mood.label}
                            onClick={() => setSelectedMood(mood)}
                            className={`flex flex-col items-center p-3 rounded-xl transition-all ${selectedMood?.label === mood.label
                                    ? "bg-primary text-primary-content scale-105"
                                    : "bg-base-200 hover:bg-base-300"
                                }`}
                        >
                            <span className="text-2xl">{mood.emoji}</span>
                            <span className="text-xs mt-1 font-medium">{mood.label}</span>
                        </button>
                    ))}
                </div>

                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="flex items-center gap-1"><Clock size={14} /> Duration</span>
                        <span className="font-bold">{duration} min</span>
                    </div>
                    <input
                        type="range"
                        min="15"
                        max="240"
                        step="15"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="range range-primary range-xs"
                    />
                    <div className="w-full flex justify-between text-xs px-2 mt-1 opacity-50">
                        <span>15m</span>
                        <span>4h</span>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!selectedMood}
                    className="btn btn-primary w-full"
                >
                    Update Status
                </button>
            </div>
        </div>
    );
};

export default MoodSelector;
