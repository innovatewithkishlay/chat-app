import { CircleDashed } from "lucide-react";

const StatusListPlaceholder = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4 p-8 text-center">
            <div className="relative">
                <CircleDashed className="size-16 opacity-20 animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                </div>
            </div>
            <div>
                <h3 className="font-medium text-lg text-primary">Status Feature</h3>
                <p className="text-sm opacity-70 mt-1 max-w-[200px]">
                    Share your moments with friends. Coming very soon!
                </p>
            </div>
        </div>
    );
};

export default StatusListPlaceholder;
