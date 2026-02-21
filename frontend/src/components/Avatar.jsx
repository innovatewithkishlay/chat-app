import React from "react";

const getInitials = (name) => {
    if (!name) return "?";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const getColorClass = (name) => {
    if (!name) return "bg-primary/20 text-primary";
    const colors = [
        "bg-primary/20 text-primary",
        "bg-secondary/20 text-secondary",
        "bg-accent/20 text-accent",
        "bg-info/20 text-info",
        "bg-success/20 text-success",
        "bg-warning/20 text-warning",
        "bg-error/20 text-error",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const Avatar = ({ user, size = "size-10", rounded = "rounded-full", showOnline = false, onlineUsers = [] }) => {
    if (!user) return null;

    const isOnline = showOnline && onlineUsers.includes(user._id);
    const colorClass = getColorClass(user.fullname || user.name);

    return (
        <div className="relative">
            {user.profilePic || user.avatar ? (
                <img
                    src={user.profilePic || user.avatar}
                    alt={user.fullname || user.name || "User"}
                    className={`${size} ${rounded} object-cover bg-base-200 border border-base-300`}
                />
            ) : (
                <div className={`${size} ${rounded} ${colorClass} flex flex-col items-center justify-center border border-base-300`}>
                    <span className="font-semibold text-sm leading-none">{getInitials(user.fullname || user.name)}</span>
                </div>
            )}

            {isOnline && (
                <span className={`absolute bottom-0 right-0 ${size === 'size-10' || size === 'size-[40px]' ? 'w-3 h-3' : 'w-2.5 h-2.5'} bg-green-500 border-[2px] border-base-100 rounded-full z-10`} />
            )}
        </div>
    );
};

export default Avatar;
