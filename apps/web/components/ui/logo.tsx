import clsx from "clsx";

/** The FinSight mark: a green ledger tile with one marigold line highlighted. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden className={className}>
      <rect width="28" height="28" rx="9" fill="#1F5A43" />
      <rect x="6" y="8" width="16" height="2" rx="1" fill="#FAF9F7" fillOpacity="0.55" />
      <rect x="6" y="13" width="12" height="4" rx="2" fill="#FFCF4A" />
      <rect x="6" y="20" width="14" height="2" rx="1" fill="#FAF9F7" fillOpacity="0.55" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.01em]">FinSight</span>
    </span>
  );
}
