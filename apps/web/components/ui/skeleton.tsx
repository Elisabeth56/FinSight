import clsx from "clsx";

/** A placeholder block in the sunk tone; size it to match the content it stands in for. */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden style={style} className={clsx("animate-pulse rounded-full bg-sunk motion-reduce:animate-none", className)} />;
}
