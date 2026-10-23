"use client";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@/components/Icons";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  value: T;
  /** Text shown in the trigger; defaults to the selected option's label. */
  display?: string;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  label: string;
};

/** Compact dropdown for the dark editor pane headers. */
export default function Select<T extends string>({ value, display, options, onChange, label }: Props<T>) {
  const selected = options.find((o) => o.value === value);
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        aria-label={label}
        className="group flex cursor-pointer items-center gap-[6px] rounded-[6px] border border-edline py-[5px] pr-[6px] pl-[8px] font-mono text-[12px] font-medium text-edtext transition-colors hover:bg-edline/50 focus-visible:outline-2 focus-visible:outline-accent-light data-open:bg-edline/50"
      >
        {display ?? selected?.label}
        <ChevronDownIcon className="size-[12px] text-eddim transition-transform group-data-open:rotate-180" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom end"
        transition
        className="z-50 min-w-(--button-width) rounded-[8px] border border-edline bg-ed2 p-[4px] font-mono text-[12px] shadow-xl [--anchor-gap:6px] focus:outline-none transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0"
      >
        {options.map((o) => (
          <ListboxOption
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            className="group flex cursor-pointer items-center gap-[8px] rounded-[6px] px-[8px] py-[6px] text-edtext select-none data-disabled:cursor-default data-disabled:opacity-40 data-focus:bg-edline"
          >
            <CheckIcon className="size-[12px] shrink-0 text-accent-light opacity-0 group-data-selected:opacity-100" />
            <span className="whitespace-nowrap">{o.label}</span>
            {o.hint && <span className="ml-auto pl-[12px] text-eddim">{o.hint}</span>}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
