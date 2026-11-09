"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_NAME = "Untitled project";

export default function ProjectTitle({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const input = useRef<HTMLInputElement>(null);
  const committed = useRef(false);
  const cancelled = useRef(false);

  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  function start() {
    setDraft(value);
    committed.current = false;
    cancelled.current = false;
    setEditing(true);
  }

  function commit() {
    if (committed.current || cancelled.current) return;
    committed.current = true;
    setEditing(false);
    const name = draft.trim().slice(0, 100) || DEFAULT_NAME;
    if (name !== value) onCommit(name);
  }

  if (editing) {
    return (
      <input
        ref={input}
        value={draft}
        maxLength={100}
        aria-label="Project name"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            cancelled.current = true;
            setEditing(false);
          }
        }}
        className="h-[32px] w-[180px] shrink-0 rounded-[6px] border border-accent-light bg-surface px-[8px] text-[15px] font-semibold text-ink outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      title="Rename project"
      className="max-w-[180px] shrink-0 cursor-pointer truncate rounded-[6px] px-[8px] py-[4px] text-left text-[15px] font-semibold text-ink hover:bg-sunken focus-visible:outline-2 focus-visible:outline-accent-light"
    >
      {value}
    </button>
  );
}
