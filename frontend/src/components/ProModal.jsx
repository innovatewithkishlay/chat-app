import { X, Crown, Video, Phone } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";
import { createPortal } from "react-dom";

const ProModal = ({ onClose }) => {
    const { activatePro } = useAuthStore();

    const handleTakePro = async () => {
        const success = await activatePro();
        if (success) {
            onClose();
        }
    };

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleEsc);

        // Prevent body scroll
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "auto";
        };
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">

            {/* BACKDROP */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300"
                onClick={onClose}
            />


            {/* MODAL */}
            <div className="relative w-full max-w-md mx-4 bg-[#0a0a0a] border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
                >
                    <X className="size-5" />
                </button>

                <div className="p-8 flex flex-col items-center text-center">

                    {/* Crown Icon */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-full animate-pulse" />
                        <div className="relative size-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Crown className="size-10 text-white fill-white/20" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 mb-2">
                        Unlock Premium
                    </h2>

                    <p className="text-zinc-400 text-sm mb-8 max-w-xs leading-relaxed">
                        Experience the full potential with exclusive Pro features.
                    </p>

                    {/* FEATURES */}
                    <div className="w-full space-y-3 mb-8">

                        <Feature
                            icon={<Video className="size-5 text-amber-500" />}
                            title="HD Video Calling"
                            desc="Crystal clear face-to-face calls"
                        />

                        <Feature
                            icon={<Phone className="size-5 text-amber-500" />}
                            title="Unlimited Voice Calls"
                            desc="Talk anytime without limits"
                        />

                        <Feature
                            icon={<Crown className="size-5 text-amber-500" />}
                            title="Priority Support"
                            desc="Instant help whenever needed"
                        />
                    </div>

                    {/* UPGRADE BUTTON */}
                    <button
                        onClick={handleTakePro}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 p-4 font-bold text-black shadow-xl hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Crown className="size-5 fill-black/20" />
                            Upgrade to Pro
                        </span>
                    </button>

                    <p className="mt-4 text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
                        Secure Payment • Cancel Anytime
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Feature Component
const Feature = ({ icon, title, desc }) => (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors">
        <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            {icon}
        </div>
        <div className="text-left">
            <h3 className="font-semibold text-zinc-100 text-sm">{title}</h3>
            <p className="text-xs text-zinc-500">{desc}</p>
        </div>
    </div>
);

export default ProModal;
