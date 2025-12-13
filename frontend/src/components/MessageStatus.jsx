import { Check, CheckCheck } from "lucide-react";

const MessageStatus = ({ status }) => {
    if (status === "sent") {
        return <Check className="size-3 text-zinc-500" />;
    }
    if (status === "delivered") {
        return <CheckCheck className="size-3 text-zinc-500" />;
    }
    if (status === "seen") {
        return <CheckCheck className="size-3 text-blue-500" />;
    }
    return null;
};

export default MessageStatus;
