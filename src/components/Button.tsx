import type { ComponentProps } from "react";

const BASE =
  "flex h-[40px] shrink-0 cursor-pointer items-center justify-center gap-[8px] rounded-[8px] text-[14px] font-semibold " +
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0098c4] " +
  "disabled:cursor-default disabled:opacity-50";

const VARIANTS = {
  outline: "border border-line bg-surface px-[16px] text-ink hover:bg-sunken active:bg-line",
  primary: "bg-accent-light px-[16px] text-ed hover:brightness-95 active:brightness-90 data-open:brightness-90",
  ghost: "px-[12px] text-ink hover:bg-sunken active:bg-line",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/** Class string for button-looking elements (e.g. Headless UI's MenuButton). */
export function buttonClass(variant: ButtonVariant = "outline", extra = "") {
  return `${BASE} ${VARIANTS[variant]} ${extra}`;
}

export default function Button({
  variant = "outline",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
