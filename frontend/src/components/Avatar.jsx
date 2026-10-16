
const getInitials = (name) => {
    if (!name) return "?";
    const names = name.trim().split(" ");
    if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Muted, fixed initials colours (independent of the theme's accent colours,
// which can be loud on some themes).
const AVATAR_COLORS = [
    "bg-slate-200 text-slate-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-800",
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
    "bg-orange-100 text-orange-700",
];

const getColorClass = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Scale initials with the avatar so large profile avatars don't show tiny text.
const getInitialsTextClass = (size) => {
    const n = Number((size.match(/size-(\d+)/) || [])[1] || 10);
    if (n >= 20) return "text-3xl";
    if (n >= 14) return "text-xl";
    if (n >= 11) return "text-sm";
    return "text-xs";
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
                <div className={`${size} ${rounded} ${colorClass} flex flex-col items-center justify-center`}>
                    <span className={`font-semibold leading-none tracking-wide ${getInitialsTextClass(size)}`}>{getInitials(user.fullname || user.name)}</span>
                </div>
            )}

            {isOnline && (
                <span className={`absolute bottom-0 right-0 ${size === 'size-10' || size === 'size-[40px]' ? 'w-3 h-3' : 'w-2.5 h-2.5'} bg-green-500 border-[2px] border-base-100 rounded-full z-10`} />
            )}
        </div>
    );
};

export default Avatar;
