import { Link } from "react-router-dom";
import { BrandLogo } from "../BrandMark";

// Centered sign-in card on a plain background. Auth screens use a fixed
// light palette rather than the user's chat theme.
const AuthLayout = ({ heading, description, children, footer }) => (
  <div className="h-full min-h-0 flex-1 overflow-y-auto bg-white text-zinc-900 [color-scheme:light] sm:bg-zinc-50">
    <div className="flex min-h-full flex-col items-center px-5 py-10 sm:justify-center sm:py-12">
      <Link
        to="/login"
        className="mb-8 inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
      >
        <BrandLogo />
      </Link>

      <main className="w-full max-w-[400px] motion-safe:animate-rise-in sm:rounded-2xl sm:border sm:border-zinc-200 sm:bg-white sm:p-8 sm:shadow-[0_1px_2px_rgba(24,24,27,0.04)]">
        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{heading}</h1>
          {description && <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-500">{description}</p>}
        </div>
        {children}
      </main>

      {footer && <div className="mt-6 text-center text-sm text-zinc-500">{footer}</div>}

      <p className="mt-10 text-xs text-zinc-400">© {new Date().getFullYear()} Touki</p>
    </div>
  </div>
);

export default AuthLayout;
