import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useStatusStore } from "../../store/useStatusStore";
import { useAuthStore } from "../../store/useAuthStore";

const StatusViewer = ({
    initialStoryIndex = 0,
    stories,
    onClose,
    userId, // Owner of the stories
    onNextUser,
    onPrevUser
}) => {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
    const [progress, setProgress] = useState(0);
    const { viewStatus } = useStatusStore();
    const { authUser } = useAuthStore();

    const currentStory = stories[currentStoryIndex];
    const isVideo = currentStory?.type === "video";
    const duration = isVideo ? (currentStory.duration || 15) : 5; // Default 5s for image/text

    const videoRef = useRef(null);

    // Handle View Counting
    useEffect(() => {
        if (currentStory && currentStory._id) {
            viewStatus(userId, currentStory._id);
        }
    }, [currentStoryIndex, userId]);

    // Auto Advance Logic
    useEffect(() => {
        setProgress(0);
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const calculatedProgress = Math.min((elapsed / (duration * 1000)) * 100, 100);
            setProgress(calculatedProgress);

            if (calculatedProgress >= 100) {
                handleNext();
            }
        }, 50);

        return () => clearInterval(interval);
    }, [currentStoryIndex, duration]);

    const handleNext = () => {
        if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
        } else {
            // End of stories for this user
            if (onNextUser) onNextUser();
            else onClose();
        }
    };

    const handlePrev = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
        } else {
            if (onPrevUser) onPrevUser();
            // else do nothing or close? usually stay or close. Let's stay.
        }
    };

    if (!currentStory) return null;

    if (!currentStory) return null;

    return (
        <div className="w-full h-full flex items-center justify-center bg-black relative">
            {/* Mobile: Full Screen. Desktop: Constrained aspect ratio or full? 
                User asked for "Immersive", "Full width and height of chat area". 
                Sidebar visible on left.
                So we take full space of the parent div.
            */}
            <div className="relative w-full h-full bg-zinc-900 overflow-hidden flex flex-col">

                {/* Progress Bars */}
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
                    {stories.map((story, idx) => (
                        <div key={story._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-75 ease-linear"
                                style={{
                                    width: idx < currentStoryIndex ? "100%" : idx === currentStoryIndex ? `${progress}%` : "0%"
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-4 left-0 right-0 z-20 px-4 py-2 flex items-center justify-between pointer-events-none">
                    {/* pointer-events-none to let clicks pass through to nav overlays? 
                       No, buttons need pointer-events-auto
                   */}
                    <div className="flex items-center gap-2 pointer-events-auto">
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm">
                            <ChevronLeft size={20} />
                        </button>
                        {/* Could show user info here */}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm pointer-events-auto">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Overlays */}
                <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-w-resize" onClick={handlePrev} />
                <div className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-e-resize" onClick={handleNext} />

                {/* Media */}
                <div className="flex-1 flex items-center justify-center bg-black">
                    {currentStory.type === "text" ? (
                        <div
                            className="w-full h-full flex items-center justify-center p-8 text-center text-white font-bold text-2xl break-words"
                            style={{ backgroundColor: currentStory.color || "#000" }}
                        >
                            {currentStory.content}
                        </div>
                    ) : currentStory.type === "video" ? (
                        <video
                            src={currentStory.content}
                            className="w-full h-full object-contain"
                            autoPlay
                            ref={videoRef}
                        // On video, we might want to sync progress with video time update rather than timer
                        // For simplicity in this iteration, we use timer.
                        />
                    ) : (
                        <img src={currentStory.content} className="w-full h-full object-contain" alt="Status" />
                    )}
                </div>

                {/* Footer / Caption / Views */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none">
                    {userId === authUser?._id && (
                        <div className="flex flex-col items-center text-white/80 pointer-events-auto">
                            <div className="flex items-center gap-1 mb-2">
                                <Eye size={16} />
                                <span className="text-sm font-medium">{currentStory.viewerCount}</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default StatusViewer;
