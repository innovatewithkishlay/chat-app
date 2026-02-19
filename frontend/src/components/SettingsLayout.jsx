import { Link, useLocation } from "react-router-dom";
import { User, Settings, LogOut, ArrowLeft, Crown } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const SettingsLayout = ({ children }) => {
    const { logout } = useAuthStore();
    const location = useLocation();

    const menuItems = [
        { label: "Profile", icon: User, path: "/profile" },
        { label: "Account", icon: Settings, path: "/settings" },
        { label: "Pro", icon: Crown, path: "/settings/pro" }, // Placeholder for now
    ];

    return (
        <div className="h-screen w-full bg-base-200 flex flex-col font-sans">
            {/* Header */}
            <div className="h-16 px-4 md:px-8 border-b border-base-300 bg-base-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 -ml-2 text-base-content/60 hover:bg-base-200 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold text-base-content">Settings</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
                {/* Left Sidebar */}
                <div className="w-64 bg-base-100 border-r border-base-300 flex-shrink-0 flex flex-col">
                    <div className="p-4 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-base-content/70 hover:bg-base-200 hover:text-base-content"}
                  `}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-auto p-4 border-t border-base-300">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsLayout;
