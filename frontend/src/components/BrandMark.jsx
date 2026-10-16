// Simple solid mark (rounded tile + chat bubble). Uses fixed colours so it
// looks the same on every theme.
const BrandMark = ({ className = "size-8" }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="#18181B" />
    <path
      fill="#fff"
      d="M16 8c4.97 0 9 3.13 9 7.5S20.97 23 16 23c-.93 0-1.82-.1-2.66-.3L9 25l.86-3.6C8.1 20.05 7 17.9 7 15.5 7 11.13 11.03 8 16 8z"
    />
  </svg>
);

export const BrandLogo = ({ className = "", textClassName = "text-zinc-900" }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <BrandMark className="size-8" />
    <span className={`text-lg font-semibold tracking-tight ${textClassName}`}>Touki</span>
  </span>
);

export default BrandMark;
