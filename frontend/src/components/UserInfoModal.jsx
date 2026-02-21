import {
    X,
    User,
    Mail,
    Calendar,
    Phone,
    Info,
    Camera,
    ShieldAlert
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import Avatar from "./Avatar";

const UserInfoModal = ({ user, onClose }) => {
    const { blockUser, unblockUser, blockedUsers } = useAuthStore();
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);

    if (!user) return null;

    const isBlocked = blockedUsers?.some(u => u._id === user._id);

    const handleToggleBlock = () => {
        if (isBlocked) {
            unblockUser(user._id);
        } else {
            setShowBlockConfirm(true);
        }
    };

    return (
        <>
            <div className="absolute top-0 right-0 h-full w-80 bg-base-100 border-l border-base-300 shadow-soft flex flex-col z-40 animate-in slide-in-from-right duration-300">
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
                            Contact Info
                        </h2>
                    </div>
                </div>

                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center py-8 border-b border-base-200 bg-base-200/30">
                        <div className="relative group">
                            <div className="size-32 rounded-full flex items-center justify-center overflow-hidden shadow-soft border-4 border-base-100 transition-transform duration-300 group-hover:scale-105">
                                <Avatar user={user} size="size-32" />
                            </div>
                        </div>

                        {/* Name */}
                        <div className="mt-4 text-center w-full px-6">
                            <h1 className="text-2xl font-bold truncate max-w-md">
                                {user.fullname}
                            </h1>
                            <p className="text-sm opacity-60 mt-1">{user.email}</p>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="p-6 border-b border-base-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Info size={16} className="text-primary" />
                            <span className="text-sm font-bold opacity-70 uppercase tracking-wider">
                                About
                            </span>
                        </div>
                        <p className="text-base leading-relaxed opacity-90 whitespace-pre-wrap break-words">
                            {user.about || <span className="italic opacity-50">Hey there! I am using Toukii.</span>}
                        </p>
                    </div>

                    {/* Account details */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User size={16} className="text-primary" />
                            <span className="text-sm font-bold opacity-70 uppercase tracking-wider">
                                Account Info
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="opacity-70 flex items-center gap-2"><Mail size={16} /> Email</span>
                                <span className="font-mono opacity-90 truncate max-w-[150px]">{user.email}</span>
                            </div>
                            {user.createdAt && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="opacity-70 flex items-center gap-2"><Calendar size={16} /> Joined</span>
                                    <span className="font-mono opacity-90">{user.createdAt.split("T")[0]}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="opacity-70 flex items-center gap-2"><Phone size={16} /> Phone</span>
                                <span className="font-mono opacity-50 italic">Hidden</span>
                            </div>
                        </div>
                    </div>
                    {/* Block Section */}
                    <div className="p-6">
                        <button
                            onClick={handleToggleBlock}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${isBlocked
                                ? 'bg-base-200 text-base-content hover:bg-base-300'
                                : 'bg-error/10 text-error hover:bg-error/20'
                                }`}
                        >
                            <ShieldAlert size={18} />
                            {isBlocked ? "Unblock User" : "Block User"}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showBlockConfirm}
                onClose={() => setShowBlockConfirm(false)}
                onConfirm={() => {
                    blockUser(user._id);
                    setShowBlockConfirm(false);
                }}
                title="Block User?"
                message={`Are you sure you want to block ${user.fullname}? They will not be able to send you messages or call you.`}
                confirmText="Block"
                confirmColor="error"
                icon={<ShieldAlert className="size-6 text-error" />}
            />
        </>
    );
};

export default UserInfoModal;
