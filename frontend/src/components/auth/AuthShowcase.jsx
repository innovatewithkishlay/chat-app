import { CheckCheck, KanbanSquare, MessageSquare, Phone, Search, Video } from "lucide-react";

const CONVERSATIONS = [
  { initials: "AR", name: "Aanya Rao", preview: "Moved the design tasks to Done", time: "10:42", active: true },
  { initials: "PT", name: "Product team", preview: "Rohan: Standup notes are in", time: "09:15" },
  { initials: "MK", name: "Meera Kapoor", preview: "Call you after lunch?", time: "Tue" },
  { initials: "DS", name: "Design sync", preview: "Poll: Thursday or Friday", time: "Mon" },
];

const FEATURES = [
  { icon: MessageSquare, title: "Real-time messaging", text: "Delivery and read receipts, replies, reactions and search." },
  { icon: KanbanSquare, title: "Work inside the chat", text: "Every conversation has its own board, notes and polls." },
  { icon: Video, title: "Voice and video", text: "Start a call from any conversation." },
];

// Decorative right-hand panel for the auth screens: a static preview of the
// product. Fixed colours, no theme dependency.
const AuthShowcase = ({ title, subtitle }) => (
  <aside className="relative hidden lg:flex flex-col justify-center overflow-hidden border-l border-zinc-200 bg-zinc-50 px-14 py-16">
    <div className="mx-auto w-full max-w-xl">
      {/* Product preview */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
          <span className="size-2.5 rounded-full bg-zinc-300" />
        </div>

        <div className="grid grid-cols-[200px_1fr] text-[13px]">
          {/* Conversation list */}
          <div className="border-r border-zinc-200">
            <div className="p-3">
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5 text-zinc-400">
                <Search className="size-3.5" /> Search
              </div>
            </div>
            <ul>
              {CONVERSATIONS.map((c) => (
                <li
                  key={c.name}
                  className={`flex items-center gap-2.5 px-3 py-2.5 ${c.active ? "bg-zinc-100" : ""}`}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700">
                    {c.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-medium text-zinc-900">{c.name}</span>
                      <span className="shrink-0 text-[10px] text-zinc-400">{c.time}</span>
                    </span>
                    <span className="block truncate text-[11px] text-zinc-500">{c.preview}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Thread */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 border-b border-zinc-200 px-4 py-3">
              <span className="relative flex size-8 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-700">
                AR
                <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>
              <span className="flex-1">
                <span className="block font-medium text-zinc-900">Aanya Rao</span>
                <span className="block text-[11px] text-zinc-500">Online</span>
              </span>
              <Phone className="size-4 text-zinc-400" />
              <Video className="size-4 text-zinc-400" />
            </div>

            <div className="flex-1 space-y-2.5 px-4 py-4">
              <div className="flex">
                <p className="max-w-[80%] rounded-lg bg-zinc-100 px-3 py-2 text-zinc-800">
                  Did you get a chance to look at the launch board?
                </p>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-zinc-900 px-3 py-2 text-white">
                  <p>Yes, moved the design tasks to Done.</p>
                  <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-zinc-400">
                    10:42 <CheckCheck className="size-3 text-blue-400" />
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-2.5">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-600">
                  <KanbanSquare className="size-3.5" /> Launch board
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-zinc-600">
                  {[
                    ["To do", 2],
                    ["In progress", 1],
                    ["Done", 5],
                  ].map(([label, n]) => (
                    <span key={label} className="flex items-center justify-between rounded border border-zinc-200 bg-zinc-50 px-1.5 py-1">
                      {label} <span className="font-semibold text-zinc-900">{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{subtitle}</p>
        <ul className="mt-8 space-y-5">
          {FEATURES.map(({ icon: Icon, title: featureTitle, text }) => (
            <li key={featureTitle} className="flex gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700">
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-zinc-900">{featureTitle}</span>
                <span className="block text-sm text-zinc-500">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </aside>
);

export default AuthShowcase;
