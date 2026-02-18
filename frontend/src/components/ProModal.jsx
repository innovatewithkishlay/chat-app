import { useState } from "react";
import { X, Check, Zap, Crown, Star, Shield } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import logo from "/vite.svg"; // Assuming vite logo or app logo exists

const ProModal = ({ onClose }) => {
    const [loading, setLoading] = useState(false);
    const { authUser, checkAuth } = useAuthStore();

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            const res = await loadRazorpayScript();

            if (!res) {
                toast.error("Razorpay SDK failed to load. Are you online?");
                setLoading(false);
                return;
            }

            // 1. Create Order
            const { data: orderData } = await axiosInstance.post("/payment/create-order");

            if (!orderData.success) {
                toast.error("Failed to create order");
                setLoading(false);
                return;
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Chatify Pro",
                description: "Unlock Premium Features",
                image: "https://t4.ftcdn.net/jpg/04/18/38/54/360_F_418385494_xUfN94j821k1X4q1v86q4q6q4q6q4q6.jpg", // Quick placeholder logo
                order_id: orderData.orderId,
                handler: async function (response) {
                    // 2. Verify Payment
                    try {
                        const verifyRes = await axiosInstance.post("/payment/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (verifyRes.data.success) {
                            toast.success("Welcome to Pro! 🎉");
                            await checkAuth(); // Refresh user state
                            onClose();
                        } else {
                            toast.error("Payment verification failed");
                        }
                    } catch (error) {
                        console.error("Verification Error:", error);
                        toast.error("Payment verification failed");
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: authUser?.fullname,
                    email: authUser?.email,
                    contact: "", // specific to user if available
                },
                theme: {
                    color: "#00BFFF", // Primary color
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error("Payment Error:", error);
            toast.error(error.response?.data?.message || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
            <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all z-20"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center relative z-10 flex flex-col items-center">
                    {/* Header */}
                    <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-tr from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/20">
                        <Crown size={32} className="text-white drop-shadow-md" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Upgrade to Pro</h2>
                    <p className="text-white/60 mb-6 text-sm">Unlock the full potential of your chat experience.</p>

                    {/* Pricing */}
                    <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 w-full">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-lg text-white/60">₹</span>
                            <span className="text-4xl font-bold text-white">499</span>
                            <span className="text-sm text-white/40 ml-1">/ lifetime</span>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-8 w-full">
                        <FeatureItem icon={<Zap className="text-yellow-400 size-5" />} text="Post & View Status Updates" />
                        <FeatureItem icon={<Star className="text-purple-400 size-5" />} text="Crystal Clear Video Calls" />
                        <FeatureItem icon={<Shield className="text-green-400 size-5" />} text="Unlimited Voice Calls" />
                        <FeatureItem icon={<Crown className="text-orange-400 size-5" />} text="Exclusive Pro Badge" />
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full py-3 px-6 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Crown size={20} />
                                <span>Get Pro Access Now</span>
                            </>
                        )}
                    </button>

                    <p className="mt-4 text-[10px] text-white/30 uppercase tracking-wider">
                        Secure payment via Razorpay
                    </p>
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ icon, text }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-colors w-full">
        <div className="shrink-0">{icon}</div>
        <span className="text-sm font-medium text-white/90 text-left flex-1">{text}</span>
        <Check size={16} className="text-primary" />
    </div>
);

export default ProModal;
