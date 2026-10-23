"use client";

import { useRef, useState } from "react";

const KEY_STEP = 16;

type Props = {
  /** Current width of the panel to the left of the handle, in px. */
  value: number;
  min: number;
  onChange: (width: number) => void;
  onReset: () => void;
};

/** Vertical splitter: drag, use ←/→, or double-click to reset. */
export default function ResizeHandle({ value, min, onChange, onReset }: Props) {
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, width: 0 });

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize editors"
      aria-valuenow={value}
      aria-valuemin={min}
      tabIndex={0}
      data-dragging={dragging || undefined}
      className="group hidden w-[8px] shrink-0 cursor-col-resize touch-none select-none justify-center focus:outline-none md:flex"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, width: value };
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (dragging) onChange(start.current.width + e.clientX - start.current.x);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onChange(value - KEY_STEP);
        else if (e.key === "ArrowRight") onChange(value + KEY_STEP);
        else return;
        e.preventDefault();
      }}
    >
      <div className="my-[4px] w-[3px] rounded-full bg-transparent transition-colors group-hover:bg-accent-light/60 group-focus-visible:bg-accent-light group-data-dragging:bg-accent-light" />
    </div>
  );
}
