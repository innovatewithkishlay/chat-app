import { Check, CheckCheck, Clock } from "lucide-react";

// Ticks inherit the bubble's metadata colour so they stay legible on any
// theme's primary colour; "read" is set apart with a light sky tint.
const MessageStatus = ({ status }) => {
    if (status === "sending") {
        return <Clock className="size-[13px] opacity-70" aria-label="Sending" />;
    }
    if (status === "sent") {
        return <Check className="size-[14px]" aria-label="Sent" />;
    }
    if (status === "delivered") {
        return <CheckCheck className="size-[14px]" aria-label="Delivered" />;
    }
    if (status === "read") {
        return <CheckCheck className="size-[14px] text-sky-200" aria-label="Read" />;
    }
    return null;
};

export default MessageStatus;
