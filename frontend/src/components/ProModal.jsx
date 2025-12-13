import { X, Crown } from "lucide-react";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-base-100 w-full max-w-md rounded-2xl p-6 relative border border-amber-500/20 shadow-2xl shadow-amber-500/10">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-base-200 rounded-full transition-colors"
                >
                    <X className="size-5" />
                </button>

                <div className="flex flex-col items-center text-center gap-4">
                    <div className="size-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                        <Crown className="size-8 text-amber-500" />
                    </div>

                    <h2 className="text-2xl font-bold">Unlock Video Calling</h2>
                    <p className="text-base-content/70">
                        Video calling is an exclusive feature for Pro members. Upgrade now to start face-to-face conversations!
                    </p>

                    <div className="w-full bg-base-200 rounded-xl p-4 my-2 text-left space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="size-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-500 text-xs">✓</span>
                            </div>
                            <span className="text-sm">Unlimited Video Calls</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="size-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-500 text-xs">✓</span>
                            </div>
                            <span className="text-sm">High Quality Streaming</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="size-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-500 text-xs">✓</span>
                            </div>
                            <span className="text-sm">Priority Support</span>
                        </div>
                    </div>

                    <button
                        onClick={handleTakePro}
                        className="btn btn-primary w-full bg-gradient-to-r from-amber-500 to-orange-600 border-none hover:from-amber-600 hover:to-orange-700 text-white font-bold gap-2"
                    >
                        <Crown className="size-5" />
                        Get Pro Access
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProModal;
