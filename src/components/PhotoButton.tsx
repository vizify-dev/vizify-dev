"use client";

import { useRef } from "react";
import { UploadIcon } from "@/components/Icons";

const BTN =
  "flex cursor-pointer items-center gap-[6px] rounded-[6px] border border-edline px-[8px] py-[5px] font-mono text-[12px] font-medium text-edtext transition-colors hover:bg-edline/50 focus-visible:outline-2 focus-visible:outline-accent-light";

type Props = {
  hasPhoto: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
};

/** Photo picker for the dark editor pane header. */
export default function PhotoButton({ hasPhoto, onPick, onRemove }: Props) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-[6px]">
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
      <button type="button" className={BTN} onClick={() => input.current?.click()}>
        <UploadIcon className="size-[12px]" />
        {hasPhoto ? "Change" : "Add photo"}
      </button>
      {hasPhoto && (
        <button type="button" aria-label="Remove photo" className={BTN} onClick={onRemove}>
          ×
        </button>
      )}
    </div>
  );
}