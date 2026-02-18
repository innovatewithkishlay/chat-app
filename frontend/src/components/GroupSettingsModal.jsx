import { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/useChattingStore";
import { useAuthStore } from "../store/useAuthStore";
import {
    ArrowLeft,
    UserPlus,
    Edit2,
    Check,
    UserMinus,
    ShieldCheck,
    Camera,
    MoreVertical,
    Users,
    X
} from "lucide-react";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ onClose }) => {
    const {
        selectedUser,
        updateGroup,
        addGroupMember,
        removeGroupMember,
        friends,
        promoteToAdmin,
        dismissAsAdmin,
    } = useChatStore();

    const { authUser } = useAuthStore();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imagePreview, setImagePreview] = useState("");

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);

    const fileInputRef = useRef(null);

    if (!selectedUser) return null;

    const isAdmin =
        selectedUser.admins?.some(
            (admin) => admin._id === authUser?._id
        ) || false;

    // =============================
    // Sync State
    // =============================
    useEffect(() => {
        setName(selectedUser.name || "");
        setDescription(selectedUser.description || "");
        setImagePreview(selectedUser.avatar || "");
    }, [selectedUser]);

    // =============================
    // Handlers
    // =============================

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            setImagePreview(reader.result);
            await updateGroup(selectedUser._id, {
                avatar: reader.result,
            });
            toast.success("Group icon updated");
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateName = async () => {
        if (!name.trim()) return;
        await updateGroup(selectedUser._id, { name });
        setIsEditingName(false);
        toast.success("Group name updated");
    };

    const handleUpdateDescription = async () => {
        await updateGroup(selectedUser._id, { description });
        setIsEditingDescription(false);
        toast.success("Description updated");
    };

    const handleAddMember = async (friendId) => {
        await addGroupMember(selectedUser._id, friendId);
        toast.success("Member added");
        setShowAddMember(false);
    };

    const handleRemoveMember = async (memberId) => {
        await removeGroupMember(selectedUser._id, memberId);
    };

    const handlePromote = async (memberId) => {
        await promoteToAdmin(selectedUser._id, memberId);
        toast.success("Promoted to admin");
    };

    const handleDismiss = async (memberId) => {
        await dismissAsAdmin(selectedUser._id, memberId);
        toast.success("Dismissed as admin");
    };

    const availableFriends =
        friends?.filter(
            (friend) =>
                !selectedUser.members.some(
                    (member) => member._id === friend._id
                )
        ) || [];

    // =============================
    // UI
    // =============================



    return (
        <div className="absolute top-0 right-0 h-full w-80 bg-base-100 border-l border-base-300 shadow-xl flex flex-col z-40 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-base-200 shrink-0 bg-base-100/80 backdrop-blur-md sticky top-0 z-10">
                <button
                    onClick={onClose}
                    className="btn btn-ghost btn-circle btn-sm"
                >
                    <X size={20} />
                </button>

                <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg leading-tight truncate">
                        Group Info
                    </h2>
                    <p className="text-xs opacity-60">
                        {selectedUser.members.length} members
                    </p>
                </div>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* Avatar Section */}
                <div className="flex flex-col items-center py-8 border-b border-base-200 bg-base-200/30">
                    <div className="relative group">
                        <div className="size-32 rounded-full bg-base-300 flex items-center justify-center overflow-hidden shadow-xl border-4 border-base-100">
                            <img
                                src={imagePreview || "/avatar.png"}
                                alt="Group"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-full shadow-lg hover:scale-105 transition-transform"
                                title="Change group icon"
                            >
                                <Camera size={18} />
                            </button>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>

                    {/* Name */}
                    <div className="mt-6 text-center w-full px-6">
                        {isEditingName ? (
                            <div className="flex items-center gap-2 justify-center animate-in zoom-in-95 duration-200">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input input-bordered input-sm text-center font-bold text-xl w-full max-w-xs bg-base-100"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleUpdateName();
                                        if (e.key === "Escape") setIsEditingName(false);
                                    }}
                                />
                                <button
                                    onClick={handleUpdateName}
                                    className="btn btn-primary btn-sm btn-circle shadow-md flex-shrink-0"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={() => setIsEditingName(false)}
                                    className="btn btn-ghost btn-sm btn-circle text-error flex-shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 justify-center group cursor-pointer" onClick={() => isAdmin && setIsEditingName(true)}>
                                <h1 className="text-2xl font-bold truncate max-w-md">
                                    {selectedUser.name}
                                </h1>
                                {isAdmin && (
                                    <button
                                        className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                        <p className="text-sm opacity-50 mt-1">Group · {selectedUser.members.length} participants</p>
                    </div>
                </div>

                {/* Description */}
                <div className="p-6 border-b border-base-200">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold opacity-70 uppercase tracking-wider">
                            Description
                        </span>
                        {isAdmin && !isEditingDescription && (
                            <button
                                onClick={() => setIsEditingDescription(true)}
                                className="btn btn-ghost btn-xs text-primary font-medium"
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditingDescription ? (
                        <div className="animate-in fade-in duration-200">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="textarea textarea-bordered w-full text-base leading-relaxed h-24 resize-none bg-base-100"
                                placeholder="Add a group description..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => setIsEditingDescription(false)}
                                    className="btn btn-ghost btn-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateDescription}
                                    className="btn btn-primary btn-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-base leading-relaxed opacity-80 whitespace-pre-wrap break-words">
                            {selectedUser.description ||
                                <span className="italic opacity-50">No description provided.</span>}
                        </p>
                    )}
                </div>

                {/* Members */}
                <div className="p-6 pb-20">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold opacity-70 uppercase tracking-wider">
                            {selectedUser.members.length} Participants
                        </span>
                        {isAdmin && (
                            <button
                                onClick={() => setShowAddMember(!showAddMember)}
                                className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 gap-2"
                            >
                                <UserPlus size={18} />
                                Add
                            </button>
                        )}
                    </div>

                    {/* Add Member Dropdown Area */}
                    {showAddMember && (
                        <div className="mb-6 bg-base-200/50 rounded-xl p-4 animate-in slide-in-from-top-2 border border-base-200">
                            <input type="text" placeholder="Search friends..." className="input input-sm input-bordered w-full mb-3 bg-base-100" />
                            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                                {availableFriends.length > 0 ? (
                                    availableFriends.map(friend => (
                                        <button
                                            key={friend._id}
                                            onClick={() => handleAddMember(friend._id)}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-base-100 rounded-lg transition-all text-left"
                                        >
                                            <div className="avatar">
                                                <div className="w-8 rounded-full">
                                                    <img src={friend.profilePic || "/avatar.png"} alt={friend.fullname} />
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium flex-1 truncate">{friend.fullname}</span>
                                            <UserPlus size={16} className="text-primary" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-sm opacity-50">No new friends to add.</div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        {selectedUser.members.map((member) => {
                            const isMemberAdmin =
                                selectedUser.admins.some(
                                    (a) => a._id === member._id
                                );

                            return (
                                <div
                                    key={member._id}
                                    className="flex items-center justify-between p-2 rounded-xl hover:bg-base-200/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative flex-shrink-0">
                                            <div className="avatar">
                                                <div className="size-10 rounded-full border border-base-200">
                                                    <img src={member.profilePic || "/avatar.png"} alt={member.fullname} />
                                                </div>
                                            </div>
                                            {isMemberAdmin && (
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full border-2 border-base-100" title="Admin">
                                                    <ShieldCheck size={10} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm flex items-center gap-2 truncate">
                                                {member.fullname}
                                                {member._id === authUser._id &&
                                                    <span className="text-xs opacity-50 font-normal bg-base-200 px-1.5 py-0.5 rounded flex-shrink-0">You</span>}
                                            </p>
                                            <p className="text-xs opacity-60 truncate max-w-[120px]">
                                                {isMemberAdmin
                                                    ? <span className="text-primary font-medium">Admin</span>
                                                    : member.about || "Hey there! I am using Toukii."}
                                            </p>
                                        </div>
                                    </div>

                                    {isAdmin && member._id !== authUser._id && (
                                        <div className="dropdown dropdown-end dropdown-left">
                                            <div
                                                tabIndex={0}
                                                role="button"
                                                className="btn btn-ghost btn-sm btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreVertical size={16} />
                                            </div>

                                            <ul
                                                tabIndex={0}
                                                className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-48 border border-base-200"
                                            >
                                                {isMemberAdmin ? (
                                                    <li>
                                                        <button
                                                            onClick={() => handleDismiss(member._id)}
                                                            className="text-warning text-xs"
                                                        >
                                                            <ShieldCheck size={14} /> Dismiss as Admin
                                                        </button>
                                                    </li>
                                                ) : (
                                                    <li>
                                                        <button
                                                            onClick={() => handlePromote(member._id)}
                                                            className="text-success text-xs"
                                                        >
                                                            <ShieldCheck size={14} /> Make Admin
                                                        </button>
                                                    </li>
                                                )}
                                                <div className="divider my-1"></div>
                                                <li>
                                                    <button
                                                        onClick={() => handleRemoveMember(member._id)}
                                                        className="text-error text-xs"
                                                    >
                                                        <UserMinus size={14} /> Remove
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Leave Group Button */}
                    <div className="mt-8 pt-6 border-t border-base-200 flex justify-center">
                        <button onClick={() => {
                            if (window.confirm("Are you sure you want to leave this group?")) {
                                toast.error("Please use the chat menu to leave group.");
                            }
                        }} className="btn btn-ghost text-error gap-2 hover:bg-error/10 w-full">
                            <span className="text-sm font-semibold">Exit Group</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsModal;
