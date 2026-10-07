import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet" | "highlight" | "action";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgb(31_90_67/0.28)]",
  secondary: "bg-surface text-ink hover:bg-sunk",
  quiet: "bg-sunk text-ink hover:bg-surface",
  highlight: "bg-highlight text-[#292826] hover:-translate-y-0.5",
  action: "bg-action font-semibold text-on-action hover:-translate-y-0.5",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
};

function classes(variant: Variant, size: Size, className?: string) {
  return clsx(
    "group inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap",
    "transition-[transform,box-shadow,background-color] duration-200 ease-ui",
    variants[variant],
    sizes[size],
    className,
  );
}

/** Arrow that nudges right when its button is hovered. */
export function Arrow() {
  return (
    <span aria-hidden className="transition-transform duration-200 ease-ui group-hover:translate-x-0.5">
      →
    </span>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return <Link className={classes(variant, size, className)} {...props} />;
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={classes(variant, size, className)} {...props} />;
}
