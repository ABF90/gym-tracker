"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary:
    "bg-lime-400 text-ink-950 shadow-lime hover:bg-lime-300 active:bg-lime-500 disabled:bg-ink-700 disabled:text-steel-500 disabled:shadow-none",
  secondary:
    "glass text-chalk hover:bg-glass-strong hover:border-line-strong active:bg-ink-700 disabled:text-steel-500",
  ghost: "text-steel-300 hover:text-chalk hover:bg-glass active:bg-glass-strong disabled:text-steel-500",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/15 active:bg-danger/20 disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm gap-2 rounded-xl",
  md: "h-12 px-5 text-base gap-2 rounded-2xl",
  lg: "h-14 px-6 text-lg gap-2.5 rounded-2xl",
  xl: "h-16 px-8 text-xl gap-3 rounded-3xl",
};

const base =
  "inline-flex select-none items-center justify-center font-medium transition-[background-color,color,box-shadow,transform,border-color] duration-200 active:scale-[0.98] disabled:pointer-events-none";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  block?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading,
  block,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], block && "w-full", className)}
      {...props}
    >
      {loading ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  block,
  className,
  children,
  ...props
}: Omit<CommonProps, "loading"> & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], block && "w-full", className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  variant = "secondary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: { label: string; variant?: Variant; size?: "sm" | "md" | "lg" } & ComponentProps<"button">) {
  const dims = { sm: "size-10 rounded-xl", md: "size-12 rounded-2xl", lg: "size-14 rounded-2xl" }[size];
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(base, variants[variant], dims, "shrink-0", className)}
      {...props}
    >
      {children}
    </button>
  );
}
