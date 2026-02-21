import { useState } from "react";
import { useStatusStore } from "../../store/useStatusStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Plus, Moon, Lock } from "lucide-react";
import StatusViewer from "./StatusViewer";
import Avatar from "../Avatar";
import toast from "react-hot-toast";

const StatusList = () => {
    const { statuses, myStatus, createStatus, openStatus, openCreateStatus } = useStatusStore(); // added openStatus
    const { authUser } = useAuthStore();

    const [createModalOpen, setCreateModalOpen] = useState(false); // remove eventually? kept for now to avoid breaking too much logic if used elsewhere, but variable is unused if we remove the JSX.

    const handleViewStatus = (userStatusDoc) => {
        openStatus(userStatusDoc); // Use global action
    };

    const handleCreateClick = () => {
        openCreateStatus();
    };

    return (
        <div className="h-full flex flex-col">

            {/* Viewer is now handled by HomePage via activeStatus */}

            {/* My Status */}
            <div className="p-4 py-2">
                <div className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-xl cursor-pointer transition-colors" onClick={() => myStatus?.stories?.length > 0 ? handleViewStatus(myStatus) : handleCreateClick()}>
                    <div className="relative">
                        <div className={myStatus?.stories?.length > 0 ? "p-[2px] border-2 border-primary rounded-full inline-block" : ""}>
                            <Avatar user={authUser} size="size-12" rounded="rounded-full" />
                        </div>
                        {!myStatus?.stories?.length && (
                            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-base-100">
                                <Plus size={10} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">My Status</h3>
                        <p className="text-xs text-zinc-500">
                            {myStatus?.stories?.length
                                ? `${new Date(myStatus.stories[myStatus.stories.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : "Tap to add status update"}
                        </p>
                    </div>
                </div>

                {/* If I have a status, maybe show a small "Add" button separately? 
             WhatsApp style: clicking own status shows viewer. 
             If you want to add MORE, there's usually a separate button or you add from viewer.
             For now, let's keep it simple: if you have status, you VIEW it. 
             To ADD, you might need a separate button if we strictly follow that.
             User requested specific UI? "If exists -> show preview ring. Clicking opens viewer."
             User didn't explicitly ask for "Add to existing".
             So for now, if stories exist, you View. If not, you Add.
             Wait, how do you add a 2nd story? 
             Let's add a small "+" icon button next to "My Status" header or text if stories exist.
         */}
                {myStatus?.stories?.length > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCreateClick(); }}
                        className="btn btn-xs btn-circle btn-ghost absolute right-6 mt-2 text-primary"
                        title="Add another story"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>

            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-4 py-1">Recent Updates</div>

            {/* Friends Statuses */}
            <div className="flex-1 overflow-y-auto px-2">
                {statuses.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 flex flex-col items-center gap-2">
                        <Moon className="size-8 opacity-20" />
                        <p className="text-sm">No recent updates</p>
                    </div>
                ) : (
                    statuses.map((doc) => {
                        const lastStory = doc.stories[doc.stories.length - 1];
                        const isUnread = doc.stories.some(s => !s.viewers.some(v => v.userId === authUser._id || v.userId._id === authUser._id));

                        return (
                            <div key={doc._id} className="w-full p-2 flex items-center gap-3 hover:bg-base-200/50 rounded-xl transition-all cursor-pointer mb-1"
                                onClick={() => handleViewStatus(doc)}
                            >
                                <div className={`relative rounded-full p-[2px] ${isUnread ? "border-2 border-primary" : "border-2 border-zinc-300"}`}>
                                    <div className="border-2 border-base-100 rounded-full overflow-hidden">
                                        <Avatar user={doc.userId} size="size-10" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-sm">{doc.userId.fullname}</div>
                                    <div className="text-xs text-zinc-400">
                                        {new Date(lastStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default StatusList;
