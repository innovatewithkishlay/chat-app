import { Link, useLocation } from "react-router-dom";
import { User, Settings, LogOut, ArrowLeft, Crown, Code, Menu, X, ShieldAlert } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useState, useEffect } from "react";

const SettingsLayout = ({ children }) => {
    const { logout } = useAuthStore();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when location changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    const menuItems = [
        { label: "Profile", icon: User, path: "/profile" },
        { label: "Account", icon: Settings, path: "/settings" },
        { label: "Privacy", icon: ShieldAlert, path: "/settings/privacy" },
        { label: "Pro", icon: Crown, path: "/settings/pro" },
        { label: "Developer", icon: Code, path: "/settings/developer" },
    ];

    return (
        <div className="h-[100dvh] w-full bg-base-200 flex flex-col font-sans overflow-hidden">
            {/* Header - 56px height */}
            <div className="h-14 px-4 md:px-6 border-b border-base-300/50 bg-base-100 flex items-center justify-between flex-shrink-0 z-20 relative">
                <div className="flex items-center gap-3">
                    <Link to="/" className="p-2 -ml-2 text-base-content/60 hover:bg-base-200 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-lg font-bold text-base-content">Settings</h1>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-base-content/60 hover:bg-base-200 rounded-full transition-colors"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Main Layout Grid */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Mobile Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Sidebar - Responsive */}
                <aside
                    className={`
                        w-72 bg-base-100 border-r border-base-300 flex-shrink-0 flex flex-col justify-between pt-6 pb-20 md:pb-6 px-3 overflow-y-auto
                        absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    `}
                >
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
                <main className="flex-1 overflow-y-auto bg-base-200 w-full">
                    <div className="max-w-[900px] mx-auto w-full py-6 px-4 md:py-8 md:px-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsLayout;
