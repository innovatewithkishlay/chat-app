import React from "react";
import SettingsLayout from "../components/SettingsLayout";
import { ShieldAlert, Unlock } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import Avatar from "../components/Avatar";

const PrivacyPage = () => {
    const { blockedUsers, unblockUser } = useAuthStore();

    return (
        <SettingsLayout>
            <div className="space-y-6 mx-auto max-w-[820px]">
                {/* Intro Text */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-base-content mb-2 flex items-center gap-2">
                        <ShieldAlert size={24} className="text-error" /> Privacy & Safety
                    </h2>
                    <p className="text-base-content/60">Manage your blocked contacts and privacy settings</p>
                </div>

                {/* Blocked Users Section */}
                <section>
                    <div className="bg-base-100 border border-base-300 rounded-xl p-5 shadow-sm">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-medium text-base-content text-sm">Blocked Users</h3>
                                <span className="text-xs text-base-content/60">{blockedUsers?.length || 0} blocked</span>
                            </div>

                            {!blockedUsers || blockedUsers.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-base-300 rounded-xl bg-base-200/50">
                                    <p className="text-sm text-base-content/50">You haven't blocked any users.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {blockedUsers.map((user) => (
                                        <div key={user._id} className="flex items-center justify-between p-3 rounded-xl border border-base-200 bg-base-100 hover:bg-base-200/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    <Avatar user={user} size="size-10" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold">{user.fullname}</h4>
                                                    <p className="text-xs text-base-content/60">@{user.username}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => unblockUser(user._id)}
                                                className="btn btn-sm btn-ghost hover:bg-error/10 hover:text-error rounded-lg"
                                            >
                                                <Unlock size={16} className="mr-1" /> Unblock
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </SettingsLayout>
    );
};

export default PrivacyPage;
