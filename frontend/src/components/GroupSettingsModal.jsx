import { useState, useRef } from "react";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, UserPlus, Trash2, Edit2, Check, UserMinus } from "lucide-react";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ onClose }) => {
    const { selectedUser, updateGroup, addGroupMember, removeGroupMember, friends } = useChatStore();
    const { authUser } = useAuthStore();

    const [name, setName] = useState(selectedUser.name);
    const [isEditingName, setIsEditingName] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);

    const isAdmin = selectedUser.admins.some(admin => admin._id === authUser._id);

    const handleUpdateName = async () => {
        if (!name.trim()) return;
        await updateGroup(selectedUser._id, { name });
        setIsEditingName(false);
    };

    const handleAddMember = async (friendId) => {
        await addGroupMember(selectedUser._id, friendId);
        setShowAddMember(false);
    };

    const handleRemoveMember = async (memberId) => {
        if (window.confirm("Remove this member?")) {
            await removeGroupMember(selectedUser._id, memberId);
        }
    };

    // Filter friends who are not already in the group
    const availableFriends = friends.filter(
        (friend) => !selectedUser.members.some((member) => member._id === friend._id)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-base-100 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200/50">
                    <h2 className="text-lg font-semibold">Group Settings</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                    {/* Group Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Group Name</label>
                        <div className="flex items-center gap-2">
                            {isEditingName ? (
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input input-bordered w-full input-sm"
                                        autoFocus
                                    />
                                    <button onClick={handleUpdateName} className="btn btn-primary btn-sm btn-square">
                                        <Check size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                    <span className="font-medium">{selectedUser.name}</span>
                                    {isAdmin && (
                                        <button onClick={() => setIsEditingName(true)} className="btn btn-ghost btn-xs btn-circle">
                                            <Edit2 size={14} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Members */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-zinc-400">Members ({selectedUser.members.length})</label>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowAddMember(!showAddMember)}
                                    className="btn btn-ghost btn-xs gap-1 text-primary"
                                >
                                    <UserPlus size={14} />
                                    Add Member
                                </button>
                            )}
                        </div>

                        {/* Add Member Dropdown/List */}
                        {showAddMember && (
                            <div className="bg-base-200 rounded-lg p-2 mb-2 animate-in slide-in-from-top-2">
                                <p className="text-xs text-zinc-500 mb-2 px-2">Select a friend to add:</p>
                                {availableFriends.length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {availableFriends.map(friend => (
                                            <button
                                                key={friend._id}
                                                onClick={() => handleAddMember(friend._id)}
                                                className="w-full flex items-center gap-3 p-2 hover:bg-base-300 rounded-md transition-colors text-left"
                                            >
                                                <img src={friend.profilePic || "/avatar.png"} alt={friend.fullname} className="size-8 rounded-full" />
                                                <span className="text-sm font-medium">{friend.fullname}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-500 p-2 text-center">No friends available to add.</p>
                                )}
                            </div>
                        )}

                        {/* Members List */}
                        <div className="space-y-2">
                            {selectedUser.members.map((member) => (
                                <div key={member._id} className="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <img src={member.profilePic || "/avatar.png"} alt={member.fullname} className="size-10 rounded-full border border-base-300" />
                                        <div>
                                            <p className="font-medium text-sm">
                                                {member.fullname}
                                                {member._id === authUser._id && <span className="text-zinc-500 ml-1">(You)</span>}
                                            </p>
                                            {selectedUser.admins.some(a => a._id === member._id) && (
                                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Admin</span>
                                            )}
                                        </div>
                                    </div>

                                    {isAdmin && member._id !== authUser._id && (
                                        <button
                                            onClick={() => handleRemoveMember(member._id)}
                                            className="btn btn-ghost btn-xs btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove member"
                                        >
                                            <UserMinus size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default GroupSettingsModal;
