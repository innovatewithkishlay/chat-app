import React, { useEffect, useState } from "react";
import SettingsLayout from "../components/SettingsLayout";
import { Crown, Zap, Video, Phone, Shield, BarChart, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { differenceInSeconds, format } from "date-fns";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const ProPage = () => {
    const { authUser, checkAuth } = useAuthStore();
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);

    const isPro = authUser?.isPro;
    const expiresAt = authUser?.proExpiresAt ? new Date(authUser.proExpiresAt) : null;
    const startedAt = authUser?.proStartedAt ? new Date(authUser.proStartedAt) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const isExpired = expiresAt && new Date() > expiresAt;

    // Countdown Logic
    useEffect(() => {
        if (!isPro || !expiresAt || isExpired) return;

        const calculateTime = () => {
            const now = new Date();
            const totalSeconds = differenceInSeconds(expiresAt, now);
            const totalDuration = differenceInSeconds(expiresAt, startedAt);
            const elapsed = differenceInSeconds(now, startedAt);

            if (totalSeconds <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0 });
                setProgress(100);
                return;
            }

            const days = Math.floor(totalSeconds / (3600 * 24));
            const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);

            setTimeLeft({ days, hours, minutes });

            // Calculate progress percentage
            const p = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
            setProgress(p);
        };

        calculateTime();
        const timer = setInterval(calculateTime, 60000); // 1 minute update is enough for "29d 23h"

        return () => clearInterval(timer);
    }, [isPro, expiresAt, startedAt, isExpired]);

    // Payment Handler
    const handleUpgrade = async () => {
        if (loading) return;
        setLoading(true);

        try {
            // 1. Create Order
            const { data: orderData } = await axiosInstance.post("/payment/create-order");

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Toukii Pro",
                description: "Upgrade to Toukii Pro Plan",
                order_id: orderData.orderId,
                handler: async function (response) {
                    try {
                        // 2. Verify Payment
                        const verifyRes = await axiosInstance.post("/payment/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            toast.success("Welcome to Pro!");
                            await checkAuth(); // Refresh user state
                        }
                    } catch (error) {
                        console.error("Verification failed:", error);
                        toast.error("Payment verification failed.");
                    }
                },
                theme: {
                    color: "#0F172A" // Slate-900 or Primary
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();

        } catch (error) {
            console.error("Order creation failed:", error);
            toast.error(error.response?.data?.message || "Failed to initiate payment");
        } finally {
            setLoading(false);
        }
    };


    return (
        <SettingsLayout>
            <div className="space-y-6 mx-auto max-w-[820px]">
                {/* Intro Text */}
                <div className="mb-2">
                    <h2 className="text-2xl font-bold text-base-content mb-1">Pro Plan</h2>
                    <p className="text-sm text-base-content/60">Unlock the full potential of Toukii</p>
                </div>

                {isPro && !isExpired ? (
                    // PRO USER UI (SaaS Design)
                    <div className="space-y-6">
                        <div className="bg-base-100 border border-base-300 rounded-xl p-6 shadow-sm relative overflow-hidden">
                            {/* Texture/Bg */}
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                                <Crown size={180} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Crown size={24} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-base-content">Pro Plan</h3>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                                                    Active
                                                </span>
                                            </div>
                                            <p className="text-sm text-base-content/60 mt-1">Your subscription is active.</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-base-content/40 font-medium uppercase tracking-wider mb-1">Valid Until</p>
                                        <p className="text-sm font-semibold text-base-content/80">
                                            {expiresAt ? format(expiresAt, "MMMM d, yyyy") : "Lifetime"}
                                        </p>
                                    </div>
                                </div>

                                {/* Compact Countdown & Progress */}
                                <div className="mt-8">
                                    <div className="flex items-end justify-between mb-2">
                                        <span className="text-xs font-medium text-base-content/50 uppercase tracking-wide">Time Remaining</span>
                                        <p className="text-lg font-bold text-base-content/80 font-mono tracking-tight">
                                            {timeLeft.days}d <span className="text-base-content/30 mx-1">/</span> {timeLeft.hours}h <span className="text-base-content/30 mx-1">/</span> {timeLeft.minutes}m
                                        </p>
                                    </div>

                                    {/* Thin Progress Bar */}
                                    <div className="h-1 w-full bg-base-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-1000 ease-in-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {/* Renewal Text */}
                                    <div className="mt-3 flex justify-between items-center">
                                        <p className="text-xs text-base-content/50">
                                            Renews on <span className="font-medium text-base-content/70">{expiresAt ? format(expiresAt, "MMM d, yyyy") : "N/A"}</span>
                                        </p>

                                        {timeLeft.days < 5 && (
                                            <span className="text-xs font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/20 flex items-center gap-1">
                                                <AlertTriangle size={10} /> Expiring Soon
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <FeaturesSection />
                            <UsageSection active user={authUser} />
                        </div>
                    </div>
                ) : (
                    // FREE USER UI (Upgrade CTA)
                    <div className="space-y-6">
                        <div className="bg-base-100 border border-base-300 rounded-2xl p-8 relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 p-8 opacity-5 text-primary">
                                <Crown size={200} />
                            </div>

                            <div className="relative z-10 max-w-lg">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 uppercase tracking-wide">
                                    <Crown size={12} />
                                    <span>Recommended Plan</span>
                                </div>
                                <h2 className="text-3xl font-bold mb-3 text-base-content">Upgrade to Pro</h2>
                                <p className="text-base-content/70 mb-8 leading-relaxed">
                                    Get unlimited access to video calls, advanced analytics, ghost mode, and priority support.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button
                                        onClick={handleUpgrade}
                                        disabled={loading}
                                        className="btn btn-primary w-full sm:w-auto px-8 border-none"
                                    >
                                        {loading ? "Processing..." : "Get Pro for ₹499"}
                                    </button>
                                    <p className="text-xs text-base-content/50">Secure payment via Razorpay</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <FeaturesSection locked />
                            <UsageSection user={authUser} />
                        </div>
                    </div>
                )}
            </div>
        </SettingsLayout>
    );
};

// Sub-components
const FeaturesSection = ({ locked = false }) => (
    <section>
        <h3 className="text-base font-semibold text-base-content mb-4 flex items-center gap-2">
            <Zap size={18} className="text-warning" />
            Premium Features
        </h3>
        <div className={`bg-base-100 border border-base-300 rounded-xl p-5 shadow-sm space-y-4 ${locked ? 'opacity-70' : ''}`}>
            <FeatureItem icon={<Video size={16} />} title="HD Video Calling" desc="Crystal clear 1080p video calls" locked={locked} />
            <FeatureItem icon={<Phone size={16} />} title="Unlimited Voice Calls" desc="Talk for as long as you want" locked={locked} />
            <FeatureItem icon={<Shield size={16} />} title="Advanced Privacy" desc="Ghost mode and screenshot alerts" locked={locked} />
            <FeatureItem icon={<BarChart size={16} />} title="Viewer Analytics" desc="See who views your profile" locked={locked} />
        </div>
    </section>
);

const UsageSection = ({ active = false, user }) => (
    <section>
        <h3 className="text-base font-semibold text-base-content mb-4 flex items-center gap-2">
            <BarChart size={18} className="text-info" />
            Usage Limits
        </h3>
        <div className="bg-base-100 border border-base-300 rounded-xl p-5 shadow-sm space-y-5">
            <UsageItem label="Status Updates" used={user?.usage?.statusCount || 3} limit={active ? 30 : 5} />
            <UsageItem label="Cloud Storage" used={150} limit={active ? 2048 : 500} unit="MB" />
        </div>
    </section>
);

const FeatureItem = ({ icon, title, desc, locked }) => (
    <div className="flex items-start gap-3 group">
        <div className={`p-2 rounded-lg mt-0.5 transition-colors ${locked ? 'bg-base-200 text-base-content/40' : 'bg-primary/10 text-primary'}`}>
            {icon}
        </div>
        <div>
            <div className="flex items-center gap-2">
                <h4 className={`text-sm font-medium ${locked ? 'text-base-content/60' : 'text-base-content'}`}>{title}</h4>
                {locked && <span className="text-[10px] bg-base-200 text-base-content/50 px-1.5 py-0.5 rounded border border-base-300">LOCKED</span>}
            </div>
            <p className="text-xs text-base-content/60">{desc}</p>
        </div>
    </div>
);

const UsageItem = ({ label, used, limit, unit = "" }) => {
    const percentage = Math.min((used / limit) * 100, 100);
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
                <span className="font-medium text-base-content/70">{label}</span>
                <span className="text-base-content/50">{used} / {limit} {unit}</span>
            </div>
            <div className="h-1.5 w-full bg-base-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default ProPage;
