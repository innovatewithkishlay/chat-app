import React, { useEffect, useState } from "react";
import SettingsLayout from "../components/SettingsLayout";
import { Crown, Zap, Video, Phone, Shield, BarChart, HardDrive, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { differenceInDays, differenceInSeconds, format } from "date-fns";

const ProPage = () => {
    const { authUser, activatePro } = useAuthStore();
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [progress, setProgress] = useState(0);

    const isPro = authUser?.isPro;
    const expiresAt = authUser?.proExpiresAt ? new Date(authUser.proExpiresAt) : null;
    const startedAt = authUser?.proStartedAt ? new Date(authUser.proStartedAt) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Fallback

    const isExpired = expiresAt && new Date() > expiresAt;

    // Calculate time left and progress
    useEffect(() => {
        if (!isPro || !expiresAt || isExpired) return;

        const calculateTime = () => {
            const now = new Date();
            const totalSeconds = differenceInSeconds(expiresAt, now);
            const totalDuration = differenceInSeconds(expiresAt, startedAt);
            const elapsed = differenceInSeconds(now, startedAt);

            if (totalSeconds <= 0) {
                // Handle expiry (UI update only, backend should handle real logic)
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                setProgress(100);
                return;
            }

            const days = Math.floor(totalSeconds / (3600 * 24));
            const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);

            setTimeLeft({ days, hours, minutes, seconds });

            // Calculate progress percentage
            const p = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
            setProgress(p);
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);

        return () => clearInterval(timer);
    }, [isPro, expiresAt, startedAt, isExpired]);


    return (
        <SettingsLayout>
            <div className="space-y-6 mx-auto max-w-[820px]">
                {/* Intro Text */}
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-base-content mb-2">Pro Plan</h2>
                        <p className="text-base-content/60">Unlock the full potential of Toukii</p>
                    </div>
                </div>

                {isPro && !isExpired ? (
                    // PRO USER UI
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-gradient-to-br from-primary/10 via-base-100 to-base-100 border border-primary/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Crown size={120} className="text-primary" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-base-content">Current Plan</h3>
                                            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-content flex items-center gap-1">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        </div>
                                        <p className="text-4xl font-bold text-primary">Pro</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-base-content/60 uppercase tracking-wider font-semibold mb-1">Valid Until</p>
                                        <p className="text-sm font-medium text-base-content">
                                            {expiresAt ? format(expiresAt, "MMMM d, yyyy") : "Lifetime"}
                                        </p>
                                    </div>
                                </div>

                                {/* Countdown Timer */}
                                <div className="bg-base-100/50 backdrop-blur-sm rounded-xl p-4 border border-base-content/5 mt-4">
                                    <div className="flex items-center justify-between mb-3 text-sm text-base-content/70">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-primary" />
                                            <span>Time Remaining</span>
                                        </div>
                                        <span className="text-xs font-medium text-primary">{Math.round(progress)}% of cycle used</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-center mb-4">
                                        <TimeBlock value={timeLeft.days} label="Days" />
                                        <TimeBlock value={timeLeft.hours} label="Hours" />
                                        <TimeBlock value={timeLeft.minutes} label="Mins" />
                                        <TimeBlock value={timeLeft.seconds} label="Secs" />
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-base-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Renewal Warning */}
                                {timeLeft.days < 7 && (
                                    <div className="mt-4 flex items-center gap-3 p-3 bg-warning/10 text-warning rounded-lg border border-warning/20 text-sm">
                                        <AlertTriangle size={18} />
                                        <span>Your subscription is expiring soon. Renew now to keep your features.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Premium Features List */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <section>
                                <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-amber-500" />
                                    Your Premium Features
                                </h3>
                                <div className="bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm space-y-4">
                                    <FeatureItem icon={<Video size={18} />} title="HD Video Calling" desc="Active" active />
                                    <FeatureItem icon={<Phone size={18} />} title="Unlimited Voice Calls" desc="Active" active />
                                    <FeatureItem icon={<Shield size={18} />} title="Ghost Mode" desc="Active" active />
                                    <FeatureItem icon={<BarChart size={18} />} title="Viewer Analytics" desc="Active" active />
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                                    <HardDrive size={18} className="text-blue-500" />
                                    Usage Stats
                                </h3>
                                <div className="bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm space-y-5">
                                    <UsageItem label="Status Updates" used={8} limit={30} active />
                                    <UsageItem label="Cloud Storage" used={1.2} limit={50} unit="GB" active />
                                </div>
                            </section>
                        </div>
                    </div>
                ) : (
                    // FREE USER UI
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-base-100 to-base-200 border border-base-300 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Crown size={120} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-base-content">Current Plan</h3>
                                        <p className="text-3xl font-bold text-base-content/70 mt-2">Free</p>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-base-300 text-base-content/70">
                                        Active
                                    </span>
                                </div>
                                <p className="text-base-content/60 text-sm mb-6 max-w-md">
                                    You are currently on the free plan. Upgrade to remove limits and access exclusive features.
                                </p>
                                <button className="btn btn-primary px-6" onClick={activatePro}>
                                    Upgrade to Pro
                                </button>
                            </div>
                        </div>

                        {/* Features Comparison */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <section>
                                <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-amber-500" />
                                    Premium Features
                                </h3>
                                <div className="bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm space-y-4 opacity-70">
                                    <FeatureItem icon={<Video size={18} />} title="HD Video Calling" desc="Locked" />
                                    <FeatureItem icon={<Phone size={18} />} title="Unlimited Voice Calls" desc="Locked" />
                                    <FeatureItem icon={<Shield size={18} />} title="Advanced Privacy" desc="Locked" />
                                    <FeatureItem icon={<BarChart size={18} />} title="Viewer Analytics" desc="Locked" />
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                                    <HardDrive size={18} className="text-blue-500" />
                                    Usage Limits
                                </h3>
                                <div className="bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm space-y-5">
                                    <UsageItem label="Status Updates" used={3} limit={5} />
                                    <UsageItem label="Cloud Storage" used={150} limit={500} unit="MB" />
                                </div>
                            </section>
                        </div>

                        {/* Upgrade CTA */}
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary hidden sm:block">
                                    <Crown size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-base-content">Go Pro Today</h3>
                                    <p className="text-sm text-base-content/60">Get instant access to all features for just $5/month.</p>
                                </div>
                            </div>
                            <button className="btn btn-primary w-full md:w-auto whitespace-nowrap" onClick={activatePro}>
                                Unlock Premium
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SettingsLayout>
    );
};

// Helper Components
const TimeBlock = ({ value, label }) => (
    <div className="bg-base-200/50 rounded-lg p-2 flex flex-col items-center">
        <span className="text-2xl font-bold font-mono text-primary">{String(value).padStart(2, '0')}</span>
        <span className="text-[10px] uppercase text-base-content/50 font-medium">{label}</span>
    </div>
);

const FeatureItem = ({ icon, title, desc, active = false }) => (
    <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg mt-0.5 ${active ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/40'}`}>
            {icon}
        </div>
        <div>
            <h4 className={`text-sm font-medium ${active ? 'text-base-content' : 'text-base-content/70'}`}>{title}</h4>
            <p className="text-xs text-base-content/60">{desc}</p>
        </div>
    </div>
);

const UsageItem = ({ label, used, limit, unit = "", active = false }) => {
    const percentage = Math.min((used / limit) * 100, 100);
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
                <span className="font-medium text-base-content/70">{label}</span>
                <span className="text-base-content/50">{used} / {limit} {unit}</span>
            </div>
            <div className="h-2 w-full bg-base-200 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${active ? 'bg-primary' : 'bg-base-content/30'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default ProPage;
