// Right-hand panel for the auth screens. Deliberately editorial rather than a
// mock of the app: warm paper background, a large serif headline and a short
// exchange set like a pull quote. Fixed colours, no theme dependency.
const EXCHANGE = [
  { text: "Can we move the launch to Thursday?", name: "Aanya", align: "left" },
  { text: "Done. The board's updated and the team has a poll.", name: "Rohan", align: "right" },
];

const AuthShowcase = ({ title, subtitle }) => (
  <aside className="relative hidden lg:flex p-4">
    <div className="relative flex w-full flex-col overflow-hidden rounded-[28px] bg-[#F3EEE6] px-12 py-12 text-[#1C1917] xl:px-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#1C1917]/55">
        Touki · Messaging that gets things done
      </p>

      <div className="flex flex-1 flex-col justify-center py-12">
        <h2 className="max-w-xl font-serif text-[clamp(2.75rem,4.6vw,4.5rem)] leading-[1.02] tracking-[-0.01em]">
          {title}
        </h2>
        <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[#1C1917]/65">{subtitle}</p>

        <div className="mt-14 max-w-xl space-y-8">
          {EXCHANGE.map((line) => (
            <figure key={line.name} className={line.align === "right" ? "ml-auto max-w-sm text-right" : "max-w-sm"}>
              <blockquote className="font-serif text-[26px] leading-snug">
                <span className="text-[#C2410C]">&ldquo;</span>
                {line.text}
                <span className="text-[#C2410C]">&rdquo;</span>
              </blockquote>
              <figcaption className="mt-2 text-[12px] uppercase tracking-[0.18em] text-[#1C1917]/50">
                {line.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <p className="font-serif text-[18px] italic text-[#1C1917]/70">
        Messages, boards, notes, polls &amp; calls.
      </p>
    </div>
  </aside>
);

export default AuthShowcase;
