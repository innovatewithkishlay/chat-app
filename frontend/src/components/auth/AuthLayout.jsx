import { Link } from "react-router-dom";
import { BrandLogo } from "../BrandMark";

// Centered sign-in card on a plain background. Auth screens use a fixed
// light palette rather than the user's chat theme.
const AuthLayout = ({ heading, description, children, footer }) => (
  // On larger screens a faint doodle wallpaper (public/auth-pattern.svg,
  // drawn from the app's icon set) sits behind the card, chat-app style.
  <div className="h-full min-h-0 flex-1 overflow-y-auto bg-white text-zinc-900 [color-scheme:light] sm:bg-[#F7F7F5] sm:bg-[url('/auth-pattern.svg')] sm:bg-[length:360px_360px] sm:bg-repeat">
    <div className="flex min-h-full flex-col items-center px-5 py-10 sm:justify-center sm:py-12">
      <Link
        to="/login"
        className="mb-8 inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
      >
        <BrandLogo />
      </Link>

      <main className="w-full max-w-[400px] motion-safe:animate-rise-in sm:rounded-2xl sm:border sm:border-zinc-200 sm:bg-white sm:p-8 sm:shadow-[0_1px_2px_rgba(24,24,27,0.04),0_12px_32px_-12px_rgba(24,24,27,0.12)]">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{heading}</h1>
          {description && <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-500">{description}</p>}
        </div>
        {children}
      </main>

      {footer && (
        <div className="mt-5 rounded-full text-center text-sm text-zinc-600 sm:bg-white/80 sm:px-4 sm:py-1.5 sm:backdrop-blur-sm">
          {footer}
        </div>
      )}

      <p className="mt-8 text-xs text-zinc-500">© {new Date().getFullYear()} Touki</p>
    </div>
  </div>
);

export default AuthLayout;
