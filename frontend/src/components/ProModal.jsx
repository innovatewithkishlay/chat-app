import { X, Crown, Video, Phone } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const ProModal = ({ onClose }) => {
    const { activatePro } = useAuthStore();

    const handleTakePro = async () => {
        const success = await activatePro();
        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
                >
                    <X className="size-5" />
                </button>

                <div className="p-8 flex flex-col items-center text-center relative z-10">
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-full animate-pulse" />
                        <div className="relative size-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 rotate-3 hover:rotate-6 transition-transform duration-500">
                            <Crown className="size-10 text-white fill-white/20" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 mb-2">
                        Unlock Premium
                    </h2>
                    <p className="text-zinc-400 text-sm mb-8 max-w-xs leading-relaxed">
                        Experience the full potential of productivity with exclusive Pro features.
                    </p>

                    <div className="w-full space-y-3 mb-8">
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors group">
                            <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                <Video className="size-5 text-amber-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-zinc-100 text-sm">HD Video Calling</h3>
                                <p className="text-xs text-zinc-500">Face-to-face in crystal clear quality</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors group">
                            <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                <Phone className="size-5 text-amber-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-zinc-100 text-sm">Unlimited Voice Calls</h3>
                                <p className="text-xs text-zinc-500">Connect with anyone, anytime</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors group">
                            <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                <Crown className="size-5 text-amber-500" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-zinc-100 text-sm">Priority Support</h3>
                                <p className="text-xs text-zinc-500">Get help whenever you need it</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleTakePro}
                        className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 p-4 font-bold text-black shadow-xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out skew-x-12 -translate-x-full" />
                        <span className="relative flex items-center justify-center gap-2">
                            <Crown className="size-5 fill-black/20" /> Upgrade to Pro
                        </span>
                    </button>

                    <p className="mt-4 text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
                        Secure Payment • Cancel Anytime
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProModal;
