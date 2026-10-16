import BrandMark from "./BrandMark";

// Mirrors the static splash in index.html so there is no visual jump when
// React takes over.
const AppSplash = ({ isServerWaking = false }) => (
  <div className="h-full w-full flex flex-col items-center justify-center gap-5 bg-white px-6 text-center">
    <BrandMark className="size-12" />
    <div className="h-1 w-24 overflow-hidden rounded-full bg-zinc-200" aria-hidden="true">
      <div className="h-full w-1/3 rounded-full bg-zinc-900 motion-safe:animate-splash-bar" />
    </div>
    <p className="text-sm text-zinc-500 min-h-[2.5rem] max-w-xs" role="status">
      {isServerWaking
        ? "Starting the server. This can take up to a minute after a period of inactivity."
        : "Loading…"}
    </p>
  </div>
);

export default AppSplash;
