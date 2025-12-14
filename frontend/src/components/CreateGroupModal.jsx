import { useState } from "react";
import { useChatStore } from "../store/useChattingStore";
import { X, Check } from "lucide-react";

const CreateGroupModal = ({ onClose }) => {
    const { friends, createGroup } = useChatStore();
    const [groupName, setGroupName] = useState("");
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    const toggleFriend = (friendId) => {
        if (isCreating) return;
        if (selectedFriends.includes(friendId)) {
            setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
        } else {
            setSelectedFriends([...selectedFriends, friendId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim() || selectedFriends.length === 0) return;
        if (isCreating) return;

        setIsCreating(true);
        try {
            await createGroup({ name: groupName, members: selectedFriends });
            onClose();
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Create New Group</h2>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost" disabled={isCreating}>
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">
                            <span className="label-text">Group Name</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter group name"
                            className="input input-bordered w-full"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            required
                            disabled={isCreating}
                        />
                    </div>

                    <div>
                        <label className="label">
                            <span className="label-text">Select Members</span>
                        </label>
                        <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                            {friends.length === 0 ? (
                                <p className="text-center text-zinc-500 py-4">No friends to add</p>
                            ) : (
                                friends.map((friend) => (
                                    <div
                                        key={friend._id}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedFriends.includes(friend._id) ? "bg-primary/10" : "hover:bg-base-200"
                                            } ${isCreating ? "opacity-50 cursor-not-allowed" : ""}`}
                                        onClick={() => toggleFriend(friend._id)}
                                    >
                                        <div className="relative">
                                            <img
                                                src={friend.profilePic || "/avatar.png"}
                                                alt={friend.fullname}
                                                className="size-10 object-cover rounded-full"
                                            />
                                            {selectedFriends.includes(friend._id) && (
                                                <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5">
                                                    <Check className="size-3" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{friend.fullname}</div>
                                            <div className="text-xs text-zinc-400">@{friend.username}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                            {selectedFriends.length} selected
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={!groupName.trim() || selectedFriends.length === 0 || isCreating}
                    >
                        {isCreating ? <span className="loading loading-spinner loading-sm"></span> : "Create Group"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
