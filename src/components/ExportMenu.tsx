"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { buttonClass } from "@/components/Button";
import { ChevronDownIcon, CopyIcon } from "@/components/Icons";

const ITEM =
  "group flex w-full cursor-pointer flex-col items-start gap-[2px] rounded-[8px] px-[10px] py-[8px] text-left text-ink data-focus:bg-sunken";

export default function ExportMenu({
  onDownloadHtml,
  onCopyHtml,
}: {
  onDownloadHtml: () => void;
  onCopyHtml: () => void;
}) {
  return (
    <Menu>
      <MenuButton className={`group ${buttonClass("primary")}`}>
        Export
        <ChevronDownIcon className="size-[16px] transition-transform group-data-open:rotate-180" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        transition
        className="z-50 w-[288px] rounded-[12px] border border-line bg-surface p-[6px] shadow-xl [--anchor-gap:6px] focus:outline-none transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0"
      >
        <MenuItem>
          <button type="button" className={ITEM} onClick={onDownloadHtml}>
            <span className="text-[14px] font-semibold">HTML file</span>
            <span className="text-[12px] text-ink3">One self-contained page · .html</span>
          </button>
        </MenuItem>
        <div className="mx-[4px] my-[6px] h-px bg-line" />
        <MenuItem>
          <button type="button" className={`${ITEM} flex-row items-center gap-[8px]`} onClick={onCopyHtml}>
            <CopyIcon className="size-[16px] text-ink3" />
            <span className="text-[14px] font-semibold">Copy HTML</span>
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
