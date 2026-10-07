import { initials } from "@/lib/profile";

/** A round initial in the brand colour. */
export function Avatar({ name, email, size = "sm" }: { name: string | null | undefined; email: string; size?: "sm" | "lg" }) {
  return (
    <span
      aria-hidden
      className={
        size === "lg"
          ? "inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-medium text-on-brand"
          : "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-medium text-on-brand"
      }
    >
      {initials(name, email)}
    </span>
  );
}
