import { KanbanSquare, Phone, Search, Users } from "lucide-react";
import BrandMark from "./BrandMark";

const TIPS = [
  { icon: Search, title: "Find people", text: "Search by username to send a talk request." },
  { icon: Users, title: "Start a group", text: "Use the + button to bring everyone together." },
  { icon: KanbanSquare, title: "Plan in the chat", text: "Every conversation has its own board, notes and polls." },
  { icon: Phone, title: "Jump on a call", text: "Voice and video calls are one tap away with Pro." },
];

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-10 bg-base-200/50">

      <div className="max-w-xl text-center motion-safe:animate-rise-in">
        <BrandMark className="mx-auto mb-5 size-12 rounded-lg ring-1 ring-base-content/10" />

        <h2 className="text-xl font-semibold tracking-tight text-base-content">Welcome to Touki</h2>
        <p className="mx-auto mt-2 max-w-sm text-base-content/60">
          Pick a conversation from the sidebar to start chatting, or try one of these.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 text-left">
          {TIPS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-lg border border-base-300 bg-base-100 p-4"
            >
              <div className="mb-2.5 flex size-8 items-center justify-center rounded-md border border-base-300 text-base-content/70">
                <Icon className="size-4" />
              </div>
              <p className="text-sm font-medium text-base-content">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-base-content/55">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
