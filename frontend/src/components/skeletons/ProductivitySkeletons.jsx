import React from "react";

export const KanbanSkeleton = () => {
    return (
        <div className="flex h-full gap-4 p-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col w-72 min-w-[288px] bg-base-200/50 rounded-xl h-full animate-pulse">
                    <div className="p-3 flex items-center justify-between">
                        <div className="h-4 w-24 bg-base-300 rounded"></div>
                        <div className="h-6 w-6 bg-base-300 rounded-full"></div>
                    </div>
                    <div className="p-2 space-y-3">
                        {[1, 2, 3].map((j) => (
                            <div key={j} className="h-24 bg-base-100 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const NotesSkeleton = () => {
    return (
        <div className="flex h-full w-full">
            <div className="w-64 border-r border-base-300 bg-base-200/30 flex flex-col h-full p-2 gap-2 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-base-300 rounded-lg w-full"></div>
                ))}
            </div>
            <div className="flex-1 p-6 space-y-4 animate-pulse">
                <div className="h-8 w-1/3 bg-base-300 rounded"></div>
                <div className="h-4 w-full bg-base-300 rounded"></div>
                <div className="h-4 w-full bg-base-300 rounded"></div>
                <div className="h-4 w-3/4 bg-base-300 rounded"></div>
            </div>
        </div>
    );
};

export const PollsSkeleton = () => {
    return (
        <div className="flex-1 bg-base-100 p-4 overflow-y-auto animate-pulse">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-8 w-32 bg-base-300 rounded"></div>
                    <div className="h-8 w-24 bg-base-300 rounded"></div>
                </div>
                {[1, 2].map((i) => (
                    <div key={i} className="card bg-base-200 shadow-sm border border-base-300 h-48"></div>
                ))}
            </div>
        </div>
    );
};
