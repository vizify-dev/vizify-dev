"use client";

import { isViewEnabled } from "@/lib/features";
import type { ViewId } from "@/lib/jiraboard/views";

export type View = ViewId;

const ALL_OPTIONS: { value: View; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "resume", label: "Resume" },
  { value: "idcard", label: "ID Card" },
  { value: "board", label: "Jira Board" },
  { value: "cards", label: "ID Cards" },
  { value: "certificates", label: "Certificates" },
];

const OPTIONS = ALL_OPTIONS.filter((option) => isViewEnabled(option.value));

/** Segmented control for choosing how the data is rendered. */
export default function ViewSwitch({
  value,
  onChange,
}: {
  value: View;
  onChange: (v: View) => void;
}) {
  // Nothing to switch between while only Resume is enabled.
  if (OPTIONS.length < 2) return null;

  return (
    <div
      role="radiogroup"
      aria-label="View"
      className="flex h-[40px] shrink-0 items-center gap-[2px] rounded-[8px] bg-sunken p-[3px]"
    >
      {OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`h-full cursor-pointer rounded-[6px] px-[14px] text-[14px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-accent-light ${
              active ? "bg-surface text-ink shadow-sm" : "text-ink3 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}