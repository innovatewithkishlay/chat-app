import { Link } from "react-router-dom";
import { BrandLogo } from "../BrandMark";
import AuthShowcase from "./AuthShowcase";

// Auth screens use a fixed light palette rather than the user's chat theme,
// so they look consistent for everyone.
const AuthLayout = ({ heading, description, showcaseTitle, showcaseSubtitle, children, footer }) => (
  <div className="h-full min-h-0 flex-1 overflow-y-auto bg-white text-zinc-900 [color-scheme:light]">
    <div className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main className="flex flex-col px-6 py-6 sm:px-10 lg:px-16">
        <header>
          <Link to="/login" className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40">
            <BrandLogo />
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm motion-safe:animate-rise-in">
            <div className="mb-8">
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-zinc-900">{heading}</h1>
              {description && <p className="mt-2 text-[15px] leading-relaxed text-zinc-500">{description}</p>}
            </div>
            {children}
            {footer && <div className="mt-8 text-center text-sm text-zinc-500">{footer}</div>}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 lg:text-left">© {new Date().getFullYear()} Touki</p>
      </main>

      <AuthShowcase title={showcaseTitle} subtitle={showcaseSubtitle} />
    </div>
  </div>
);

export default AuthLayout;
