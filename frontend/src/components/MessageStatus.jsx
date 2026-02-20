import { Check, CheckCheck, Clock } from "lucide-react";

const MessageStatus = ({ status }) => {
    if (status === "sending") {
        return <Clock className="size-[14px] text-base-content/50" />;
    }
    if (status === "sent") {
        return <Check className="size-[14px] text-base-content/50 opacity-80" />;
    }
    if (status === "delivered") {
        return <CheckCheck className="size-[14px] text-base-content/50" />;
    }
    if (status === "read") {
        return <CheckCheck className="size-[14px] text-[#4FC3F7]" />;
    }
    return null;
};

export default MessageStatus;
