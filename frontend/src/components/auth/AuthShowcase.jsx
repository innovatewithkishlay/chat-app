import { CheckCheck, KanbanSquare, MessageSquare, Phone, PhoneOff, Search, Video } from "lucide-react";

const CONVERSATIONS = [
  { initials: "AR", name: "Aanya Rao", preview: "Moved the design tasks to Done", time: "10:42", active: true, online: true, tone: "bg-emerald-100 text-emerald-700" },
  { initials: "PT", name: "Product team", preview: "Rohan: Standup notes are in", time: "09:15", unread: 3, tone: "bg-blue-100 text-blue-700" },
  { initials: "MK", name: "Meera Kapoor", preview: "Call you after lunch?", time: "Tue", tone: "bg-amber-100 text-amber-800" },
  { initials: "DS", name: "Design sync", preview: "Poll: Thursday or Friday", time: "Mon", tone: "bg-rose-100 text-rose-700" },
];

const FEATURES = [
  { icon: MessageSquare, title: "Real-time chat", text: "Receipts, replies, reactions and search." },
  { icon: KanbanSquare, title: "Plan in the chat", text: "A board, notes and polls in every conversation." },
  { icon: Video, title: "Voice & video", text: "Start a call from any conversation." },
];

const Initials = ({ children, tone, className = "size-9" }) => (
  <span className={`flex shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${tone} ${className}`}>
    {children}
  </span>
);

// Decorative right-hand panel for the auth screens: a static, layered preview
// of the product. Fixed colours, no theme dependency.
const AuthShowcase = ({ title, subtitle }) => (
  <aside className="relative hidden lg:flex p-4">
    <div className="relative flex w-full flex-col justify-center overflow-hidden rounded-[32px] bg-zinc-100 px-10 pb-12 pt-20 xl:px-14">
      <div className="mx-auto w-full max-w-[34rem]">
        {/* Product preview */}
        <div className="relative">
          <div className="rounded-[28px] bg-white p-2.5 shadow-[0_2px_4px_rgba(24,24,27,0.04),0_24px_48px_-12px_rgba(24,24,27,0.18)]">
            <div className="grid grid-cols-[minmax(0,190px)_minmax(0,1fr)] gap-2.5 text-[13px]">
              {/* Conversation list */}
              <div className="rounded-[22px] bg-zinc-50 p-2">
                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-zinc-400 shadow-[0_1px_2px_rgba(24,24,27,0.06)]">
                  <Search className="size-3.5" /> Search
                </div>
                <ul className="mt-2 space-y-1">
                  {CONVERSATIONS.map((c) => (
                    <li
                      key={c.name}
                      className={`flex items-center gap-2.5 rounded-2xl px-2 py-2 ${c.active ? "bg-white shadow-[0_1px_3px_rgba(24,24,27,0.08)]" : ""}`}
                    >
                      <span className="relative">
                        <Initials tone={c.tone}>{c.initials}</Initials>
                        {c.online && <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-1">
                          <span className="truncate font-medium text-zinc-900">{c.name}</span>
                          <span className="shrink-0 text-[10px] text-zinc-400">{c.time}</span>
                        </span>
                        <span className="flex items-center justify-between gap-1">
                          <span className="truncate text-[11px] text-zinc-500">{c.preview}</span>
                          {c.unread && (
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-semibold text-white">
                              {c.unread}
                            </span>
                          )}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Thread */}
              <div className="flex min-w-0 flex-col py-1 pr-1">
                <div className="flex items-center gap-2.5 rounded-full bg-zinc-50 py-1.5 pl-1.5 pr-2">
                  <span className="relative">
                    <Initials tone="bg-emerald-100 text-emerald-700" className="size-8">AR</Initials>
                    <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-500 ring-2 ring-zinc-50" />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate font-medium text-zinc-900">Aanya Rao</span>
                    <span className="block text-[11px] text-emerald-600">Online</span>
                  </span>
                  <span className="flex size-7 items-center justify-center rounded-full bg-white text-zinc-500 shadow-[0_1px_2px_rgba(24,24,27,0.06)]">
                    <Phone className="size-3.5" />
                  </span>
                  <span className="flex size-7 items-center justify-center rounded-full bg-white text-zinc-500 shadow-[0_1px_2px_rgba(24,24,27,0.06)]">
                    <Video className="size-3.5" />
                  </span>
                </div>

                <div className="flex-1 space-y-2 px-1 pt-3">
                  <div className="flex">
                    <p className="max-w-[85%] rounded-[20px] rounded-tl-md bg-zinc-100 px-3.5 py-2 text-zinc-800">
                      Did you get a chance to look at the launch board?
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-[20px] rounded-tr-md bg-zinc-900 px-3.5 py-2 text-white">
                      <p>Yes, moved the design tasks to Done.</p>
                      <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-zinc-400">
                        10:42 <CheckCheck className="size-3 text-sky-300" />
                      </p>
                    </div>
                  </div>
                  <div className="rounded-[20px] bg-zinc-50 p-2.5">
                    <p className="mb-2 flex items-center gap-1.5 px-0.5 text-[11px] font-medium text-zinc-600">
                      <KanbanSquare className="size-3.5" /> Launch board
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-zinc-600">
                      {[
                        ["To do", 2, "bg-amber-400"],
                        ["In progress", 1, "bg-blue-500"],
                        ["Done", 5, "bg-emerald-500"],
                      ].map(([label, n, dot]) => (
                        <span key={label} className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-[0_1px_2px_rgba(24,24,27,0.06)]">
                          <span className={`size-1.5 rounded-full ${dot}`} />
                          {label}
                          <span className="font-semibold text-zinc-900">{n}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex items-center gap-1 rounded-full bg-zinc-100 px-3.5 py-2.5" aria-hidden="true">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="size-1.5 rounded-full bg-zinc-400 motion-safe:animate-typing-dot"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating: incoming call */}
          <div className="absolute -right-4 -top-12 motion-safe:animate-float">
            <div className="flex items-center gap-2.5 rounded-full bg-zinc-900 py-1.5 pl-1.5 pr-1.5 text-white shadow-[0_16px_32px_-8px_rgba(24,24,27,0.45)]">
              <Initials tone="bg-amber-100 text-amber-800" className="size-8">MK</Initials>
              <span className="pr-1 leading-tight">
                <span className="block text-[12px] font-medium">Meera Kapoor</span>
                <span className="block text-[10px] text-zinc-400">Incoming voice call</span>
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-rose-500">
                <PhoneOff className="size-3.5" />
              </span>
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500">
                <Phone className="size-3.5" />
              </span>
            </div>
          </div>

          {/* Floating: live poll */}
          <div className="absolute -bottom-14 -right-6 w-52 motion-safe:animate-float [animation-delay:-3s]">
            <div className="rounded-3xl bg-white p-3.5 shadow-[0_2px_4px_rgba(24,24,27,0.04),0_20px_40px_-12px_rgba(24,24,27,0.25)]">
              <p className="text-[12px] font-semibold text-zinc-900">Ship on Thursday or Friday?</p>
              <div className="mt-2.5 space-y-2 text-[11px] text-zinc-600">
                {[
                  ["Thursday", 68],
                  ["Friday", 32],
                ].map(([label, pct]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between">
                      <span>{label}</span>
                      <span className="font-medium text-zinc-900">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24">
          <h2 className="text-[26px] font-semibold leading-tight tracking-tight text-zinc-900">{title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{subtitle}</p>
          <ul className="mt-7 grid grid-cols-3 gap-3 [@media(max-height:880px)]:hidden">
            {FEATURES.map(({ icon: Icon, title: featureTitle, text }) => (
              <li key={featureTitle} className="rounded-3xl bg-white p-4 shadow-[0_1px_3px_rgba(24,24,27,0.06)]">
                <span className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                  <Icon className="size-4" />
                </span>
                <span className="mt-3 block text-sm font-medium text-zinc-900">{featureTitle}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-zinc-500">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </aside>
);

export default AuthShowcase;
