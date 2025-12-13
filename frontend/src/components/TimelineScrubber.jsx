import React, { useRef, useState } from "react";
import gsap from "gsap";

const TimelineScrubber = ({ messages, onScrollToMessage }) => {
    const [hoverDate, setHoverDate] = useState(null);
    const scrubberRef = useRef(null);
    const tooltipRef = useRef(null);

    // Group messages by date to create stops
    // This is a simplified version. For a real scrubber, we'd map height to time.
    // Here we just show a bar and calculate date based on mouse position relative to height.

    const handleMouseMove = (e) => {
        if (!scrubberRef.current || messages.length === 0) return;

        const rect = scrubberRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        const percentage = Math.max(0, Math.min(1, y / height));

        const index = Math.floor(percentage * (messages.length - 1));
        const message = messages[index];

        if (message) {
            const date = new Date(message.createdAt).toLocaleDateString();
            setHoverDate(date);

            // Move tooltip
            gsap.to(tooltipRef.current, {
                y: y,
                opacity: 1,
                duration: 0.1,
                overwrite: true
            });
        }
    };

    const handleMouseLeave = () => {
        gsap.to(tooltipRef.current, { opacity: 0, duration: 0.2 });
    };

    const handleClick = (e) => {
        if (!scrubberRef.current || messages.length === 0) return;
        const rect = scrubberRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        const percentage = Math.max(0, Math.min(1, y / height));
        const index = Math.floor(percentage * (messages.length - 1));
        const message = messages[index];
        if (message) {
            onScrollToMessage(message._id);
        }
    };

    if (messages.length < 20) return null; // Only show for long chats

    return (
        <div
            className="absolute right-2 top-20 bottom-24 w-4 z-40 flex flex-col items-center group"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            {/* The Line */}
            <div ref={scrubberRef} className="w-1 h-full bg-base-300 rounded-full group-hover:bg-primary/50 transition-colors cursor-pointer relative">
                {/* Tooltip */}
                <div
                    ref={tooltipRef}
                    className="absolute left-[-100px] top-0 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none whitespace-nowrap"
                >
                    {hoverDate}
                </div>
            </div>
        </div>
    );
};

export default TimelineScrubber;
