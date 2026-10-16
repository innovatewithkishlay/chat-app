import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff, Loader2, Info } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { getPasswordScore } from "../../lib/authValidation";

export const AuthInput = forwardRef(function AuthInput(
  { label, icon: Icon, error, hint, trailing, labelAction, prefix, className = "", ...props },
  ref
) {
  const id = useId();
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={hasMessage ? messageId : undefined}
          className={`peer h-11 w-full rounded-lg border bg-white text-[15px] text-zinc-900 shadow-sm outline-none transition
            placeholder:text-zinc-400 focus:ring-[3px]
            ${Icon ? (prefix ? "pl-[3.75rem]" : "pl-11") : "pl-4"} ${trailing ? "pr-12" : "pr-4"}
            ${error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
              : "border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-blue-600/15"}`}
          {...props}
        />
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400 transition-colors peer-focus:text-zinc-700" />
        )}
        {prefix && (
          <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-[15px] text-zinc-400">
            {prefix}
          </span>
        )}
        {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
      </div>
      {hasMessage && (
        <p id={messageId} className={`text-xs ${error ? "text-red-600" : "text-zinc-500"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <AuthInput
      ref={ref}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex size-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      }
      {...props}
    />
  );
});

export const SubmitButton = ({ loading, loadingText, children, disabled, ...props }) => (
  <button
    type="submit"
    disabled={loading || disabled}
    aria-busy={loading}
    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-[15px] font-medium text-white shadow-sm transition
      hover:bg-zinc-800 active:bg-zinc-950
      focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blue-600/30
      disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-zinc-900"
    {...props}
  >
    {loading ? (
      <>
        <Loader2 className="size-5 animate-spin" />
        {loadingText}
      </>
    ) : (
      children
    )}
  </button>
);

// Shown while an auth request is unusually slow - almost always the Render
// instance spinning back up - so the form doesn't just look stuck.
export const ServerWakeNotice = () => {
  const isServerWaking = useAuthStore((s) => s.isServerWaking);
  if (!isServerWaking) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm motion-safe:animate-rise-in"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-zinc-500" />
      <div>
        <p className="font-medium text-zinc-900">Starting the server</p>
        <p className="mt-0.5 text-zinc-500">
          The server was idle and is starting up. This can take up to a minute; after that it&apos;s fast.
        </p>
      </div>
    </div>
  );
};

const STRENGTH_LEVELS = [
  { label: "Too short", color: "bg-red-500", text: "text-red-600" },
  { label: "Weak", color: "bg-red-500", text: "text-red-600" },
  { label: "Fair", color: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", color: "bg-blue-600", text: "text-blue-600" },
  { label: "Strong", color: "bg-emerald-600", text: "text-emerald-600" },
];

export const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score = getPasswordScore(password);
  const level = STRENGTH_LEVELS[score];
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1 rounded-full transition-colors duration-300 ${score >= step ? level.color : "bg-zinc-200"}`}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Password strength: <span className={`font-medium ${level.text}`}>{level.label}</span>
      </p>
    </div>
  );
};
