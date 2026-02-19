import React from "react";
import SettingsLayout from "../components/SettingsLayout";
import { Crown, Zap, Video, Phone, Shield, BarChart, HardDrive } from "lucide-react";

const ProPage = () => {
    return (
        <SettingsLayout>
            <div className="space-y-6 mx-auto max-w-[820px]">
                {/* Intro Text */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-base-content mb-2">Pro Plan</h2>
                    <p className="text-base-content/60">Unlock the full potential of Toukii</p>
                </div>

                {/* Section 1: Current Plan Card */}
                <div className="bg-gradient-to-br from-base-100 to-base-200 border border-base-300 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Crown size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-base-content">Current Plan</h3>
                                <p className="text-3xl font-bold text-primary mt-2">Free</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-base-300 text-base-content/70">
                                Active
                            </span>
                        </div>
                        <p className="text-base-content/60 text-sm mb-6 max-w-md">
                            You are currently on the free plan. Upgrade to remove limits and access exclusive features.
                        </p>
                        <button className="btn btn-primary btn-sm px-6">
                            Upgrade to Pro
                        </button>
                    </div>
                </div>

                {/* Section 2: Pro Features */}
                <div className="grid md:grid-cols-2 gap-6">
                    <section>
                        <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                            <Zap size={18} className="text-amber-500" />
                            Premium Features
                        </h3>
                        <div className="bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm space-y-4">
                            <FeatureItem icon={<Video size={18} />} title="HD Video Calling" desc="Crystal clear 1080p video calls" />
                            <FeatureItem icon={<Phone size={18} />} title="Unlimited Voice Calls" desc="Talk for as long as you want" />
                            <FeatureItem icon={<Shield size={18} />} title="Advanced Privacy" desc="Ghost mode and screenshot alerts" />
                            <FeatureItem icon={<BarChart size={18} />} title="Viewer Analytics" desc="See who views your profile" />
                        </div>
                    </section>

                    {/* Section 3: Usage Summary (Mock Data for Free Plan) */}
                    <section>
                        <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                            <HardDrive size={18} className="text-blue-500" />
                            Usage Summary
                        </h3>
                        <div className="bg-base-100 border border-base-300 rounded-2xl p-6 shadow-sm space-y-5">
                            <UsageItem label="Status Updates" used={3} limit={10} />
                            <UsageItem label="Cloud Storage" used={150} limit={500} unit="MB" />
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-medium text-base-content">Active Chats</span>
                                <span className="text-sm font-bold text-base-content">12</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-base-200 pt-3">
                                <span className="text-sm font-medium text-base-content">Total Views</span>
                                <span className="text-sm font-bold text-base-content">1.2k</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Section 4: Upgrade CTA */}
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
                    <button className="btn btn-primary w-full md:w-auto whitespace-nowrap">
                        Unlock Premium
                    </button>
                </div>

            </div>
        </SettingsLayout>
    );
};

// Helper Components
const FeatureItem = ({ icon, title, desc }) => (
    <div className="flex items-start gap-3">
        <div className="p-2 bg-base-200 rounded-lg text-base-content/70 mt-0.5">
            {icon}
        </div>
        <div>
            <h4 className="text-sm font-medium text-base-content">{title}</h4>
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
            <div className="h-2 w-full bg-base-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default ProPage;
