// Small animations use the built-in Web Animations API instead of GSAP,
// which was ~80% of the chat screen's JavaScript for a handful of fades.
export function animate(el, keyframes, options) {
  if (!el?.animate) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(keyframes, options);
}

export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(date) {
  return Math.round((startOfDay(new Date()) - startOfDay(new Date(date))) / DAY_MS);
}

// Sidebar timestamp: time today, "Yesterday", weekday within a week, else a date.
export function formatConversationTime(date) {
  if (!date) return "";
  const d = new Date(date);
  const diff = daysAgo(d);
  if (diff <= 0) return formatMessageTime(d);
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
}

// Label for the day separators in a conversation.
export function formatDayLabel(date) {
  const d = new Date(date);
  const diff = daysAgo(d);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
}

export function isSameDay(a, b) {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

let razorpayScriptPromise = null;

// Loads the Razorpay checkout SDK on demand instead of blocking every page
// load with a <script> tag in index.html - only the Pro upgrade flow needs it.
export function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}
