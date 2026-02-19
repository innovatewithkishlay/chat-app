import { Link, useLocation } from "react-router-dom";
import { User, Settings, LogOut, ArrowLeft, Crown, Code } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const SettingsLayout = ({ children }) => {
    const { logout } = useAuthStore();
    const location = useLocation();

    const menuItems = [
        { label: "Profile", icon: User, path: "/profile" },
        { label: "Account", icon: Settings, path: "/settings" },
        { label: "Pro", icon: Crown, path: "/settings/pro" },
        { label: "Developer", icon: Code, path: "/settings/developer" },
    ];

    return (
        <div className="h-screen w-full bg-base-200 flex flex-col font-sans overflow-hidden">
            {/* Header - 56px height */}
            <div className="h-14 px-6 border-b border-base-300/50 bg-base-100 flex items-center justify-between flex-shrink-0 z-20 relative">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-2 -ml-2 text-base-content/60 hover:bg-base-200 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-lg font-bold text-base-content">Settings</h1>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

                {/* Fixed Sidebar - 240px */}
                <aside className="w-[240px] bg-base-100 border-r border-base-300 flex-shrink-0 flex flex-col justify-between py-6 px-3">
                    {/* Top Section */}
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                                        }
                                    `}
                                >
                                    <item.icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Section */}
                    <div>
                        <div className="h-px bg-base-300 my-4 mx-2" />
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content Area - Scrollable */}
                <main className="flex-1 overflow-y-auto bg-base-200">
                    <div className="max-w-[900px] mx-auto w-full py-8 px-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsLayout;
