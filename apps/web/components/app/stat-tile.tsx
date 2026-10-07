import clsx from "clsx";
import Link from "next/link";

type Props = {
  label: string;
  value: React.ReactNode;
  note: React.ReactNode;
  tone?: "plain" | "income" | "highlight";
  href?: string;
  // the lead figure stays large on phones; the others shrink to share a row
  big?: boolean;
  className?: string;
};

/** One headline figure with a label above and a plain-language note below. */
export function StatTile({ label, value, note, tone = "plain", href, big, className }: Props) {
  const body = (
    <>
      <span className={clsx("text-xs tracking-[0.01em]", tone === "highlight" ? "text-on-highlight-muted" : "text-ink-3")}>
        {label}
      </span>
      <span className={clsx("font-figure leading-none tabular-nums sm:text-5xl", big ? "text-[52px]" : "text-[30px]", tone === "income" && "text-income")}>
        {value}
      </span>
      <span className={clsx("text-sm", tone === "highlight" ? "text-[#3d3a33]" : "text-ink-2")}>{note}</span>
    </>
  );
  const classes = clsx(
    "flex flex-col gap-2 rounded-[20px] p-5 sm:p-6",
    tone === "highlight" ? "bg-highlight text-[#292826]" : "bg-surface",
    className,
  );
  if (!href) return <div className={classes}>{body}</div>;
  return (
    <Link href={href} className={clsx(classes, "transition-transform duration-200 ease-ui hover:-translate-y-0.5")}>
      {body}
    </Link>
  );
}
