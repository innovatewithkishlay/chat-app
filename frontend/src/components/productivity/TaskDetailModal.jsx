import { useState } from "react";
import { X, Calendar, Users, Tag, Trash2, AlignLeft } from "lucide-react";
import Avatar from "../Avatar";

const LABEL_PRESETS = [
    { text: "Bug", color: "#ef4444" },
    { text: "Feature", color: "#3b82f6" },
    { text: "Urgent", color: "#f97316" },
    { text: "Idea", color: "#a855f7" },
    { text: "Low priority", color: "#22c55e" },
];

const TaskDetailModal = ({ task, members, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");
    const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
    const [assignedTo, setAssignedTo] = useState(
        (task.assignedTo || []).map((a) => (typeof a === "string" ? a : a._id))
    );
    const [labels, setLabels] = useState(task.labels || []);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const toggleAssignee = (userId) => {
        setAssignedTo((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const toggleLabel = (preset) => {
        setLabels((prev) =>
            prev.some((l) => l.text === preset.text)
                ? prev.filter((l) => l.text !== preset.text)
                : [...prev, preset]
        );
    };

    const handleSave = () => {
        if (!title.trim()) return;
        onSave(task._id, {
            title: title.trim(),
            description,
            dueDate: dueDate || null,
            assignedTo,
            labels,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-2xl w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-base-200">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-semibold bg-transparent outline-none flex-1 mr-3"
                        placeholder="Task title"
                    />
                    <button onClick={onClose} className="p-1.5 text-base-content/40 hover:bg-base-200 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto">
                    {/* Description */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">
                            <AlignLeft size={14} /> Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more detail..."
                            className="textarea textarea-bordered w-full text-sm min-h-[80px]"
                        />
                    </div>

                    {/* Due date */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">
                            <Calendar size={14} /> Due date
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="input input-bordered input-sm w-full max-w-[200px]"
                        />
                    </div>

                    {/* Assignees */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">
                            <Users size={14} /> Assignees
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {members.map((member) => {
                                const isAssigned = assignedTo.includes(member._id);
                                return (
                                    <button
                                        key={member._id}
                                        onClick={() => toggleAssignee(member._id)}
                                        className={`flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                                            isAssigned
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-base-300 text-base-content/60 hover:bg-base-200"
                                        }`}
                                    >
                                        <Avatar user={member} size="size-5" />
                                        {member.fullname}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Labels */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">
                            <Tag size={14} /> Labels
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {LABEL_PRESETS.map((preset) => {
                                const isActive = labels.some((l) => l.text === preset.text);
                                return (
                                    <button
                                        key={preset.text}
                                        onClick={() => toggleLabel(preset)}
                                        className="text-[11px] px-2.5 py-1 rounded-md font-semibold uppercase tracking-wide transition-all"
                                        style={{
                                            backgroundColor: isActive ? preset.color + "20" : "transparent",
                                            color: preset.color,
                                            border: `1px solid ${isActive ? preset.color : preset.color + "40"}`,
                                        }}
                                    >
                                        {preset.text}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-5 border-t border-base-200">
                    {confirmDelete ? (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-base-content/60">Delete this task?</span>
                            <button
                                onClick={() => onDelete(task._id)}
                                className="btn btn-error btn-xs text-white"
                            >
                                Delete
                            </button>
                            <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-xs">
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="btn btn-ghost btn-sm text-error gap-1.5"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button onClick={onClose} className="btn btn-ghost btn-sm">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="btn btn-primary btn-sm">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
