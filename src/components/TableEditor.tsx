"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button";
import { parseCsv } from "@/lib/csv-parser";
import { toCsv } from "@/lib/csv-serialize";

function toGrid(csv: string): string[][] {
  const rows = parseCsv(csv);
  if (rows.length === 0) return [[""]];
  const cols = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => [...r, ...Array<string>(cols - r.length).fill("")]);
}

const letter = (i: number) => String.fromCharCode(65 + (i % 26)).repeat(Math.floor(i / 26) + 1);

const I = {
  plus: "M8 3v10M3 8h10",
  x: "m4 4 8 8M12 4l-8 8",
  grid: "M2.5 3.5h11v9h-11zM2.5 7h11M2.5 10h11M6.2 3.5v9M9.8 3.5v9",
};
function Ic({ d, className = "size-[14px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

type Props = {
  csv: string;
  title?: string;
  onApply: (csv: string) => void;
  onClose: () => void;
};

export default function TableEditor({ csv, title = "Edit table", onApply, onClose }: Props) {
  const [grid, setGrid] = useState<string[][]>(() => toGrid(csv));
  const [shown, setShown] = useState(false);
  const [initialCsv] = useState(() => toCsv(grid));
  const cols = grid[0].length;
  const dirty = toCsv(grid) !== initialCsv;

  // Enter animation + focus first body cell.
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      setShown(true);
      document.querySelector<HTMLInputElement>(`[data-cell="${grid.length > 1 ? 1 : 0}-0"]`)?.focus();
    });
    return () => cancelAnimationFrame(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc closes, Ctrl/Cmd+Enter applies.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onApply(toCsv(grid));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [grid, onApply, onClose]);

  const setCell = (r: number, c: number, v: string) =>
    setGrid((g) => g.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));
  const addRow = () => setGrid((g) => [...g, Array<string>(g[0].length).fill("")]);
  const addCol = () => setGrid((g) => g.map((row, i) => [...row, i === 0 ? `column_${row.length + 1}` : ""]));
  const delRow = (r: number) => setGrid((g) => (g.length > 1 ? g.filter((_, i) => i !== r) : g));
  const delCol = (c: number) => setGrid((g) => (g[0].length > 1 ? g.map((row) => row.filter((_, j) => j !== c)) : g));

  // Paste a block copied from Excel / Google Sheets.
  function onPaste(e: React.ClipboardEvent<HTMLInputElement>, r: number, c: number) {
    const text = e.clipboardData.getData("text");
    if (!/[\t\n]/.test(text)) return;
    e.preventDefault();
    const block = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n").map((l) => l.split("\t"));
    setGrid((g) => {
      const next = g.map((row) => [...row]);
      const width = Math.max(next[0].length, c + Math.max(...block.map((b) => b.length)));
      while (next.length < r + block.length) next.push([]);
      next.forEach((row, i) => {
        while (row.length < width) row.push(i === 0 ? `column_${row.length + 1}` : "");
      });
      block.forEach((line, i) => line.forEach((v, j) => (next[r + i][c + j] = v)));
      return next;
    });
  }

  function onCellKey(e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) {
    const move = (dr: number) => {
      e.preventDefault();
      document.querySelector<HTMLInputElement>(`[data-cell="${r + dr}-${c}"]`)?.focus();
    };
    if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) move(e.shiftKey ? -1 : 1);
    else if (e.key === "ArrowDown") move(1);
    else if (e.key === "ArrowUp") move(-1);
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0b1220]/60 p-[12px] backdrop-blur-sm transition-opacity duration-200 md:p-[32px] ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-full w-full max-w-[960px] flex-col overflow-hidden rounded-[16px] bg-surface shadow-2xl ring-1 ring-black/10 transition duration-200 ${
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.97] opacity-0"
        }`}
      >
        <div className="h-[3px] shrink-0 bg-gradient-to-r from-[#00b8e6] to-[#9d00ff]" />

        {/* Header */}
        <div className="flex shrink-0 items-center gap-[12px] px-[20px] py-[16px]">
          <div className="flex size-[36px] items-center justify-center rounded-[10px] bg-gradient-to-br from-[#00b8e6]/15 to-[#9d00ff]/15 text-[#0098c4]">
            <Ic d={I.grid} className="size-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-bold leading-tight text-ink">{title}</h2>
            <p className="truncate text-[12px] text-ink3">Click a cell to edit. Paste straight from Excel or Google Sheets.</p>
          </div>
          {dirty && (
            <span className="hidden items-center gap-[6px] rounded-full bg-amber-100 px-[10px] py-[4px] font-mono text-[11px] font-medium text-amber-800 sm:flex">
              <span className="size-[6px] rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-[32px] cursor-pointer items-center justify-center rounded-[8px] text-ink3 transition-colors hover:bg-sunken hover:text-ink"
          >
            <Ic d={I.x} className="size-[16px]" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex shrink-0 items-center gap-[8px] border-y border-line bg-paper px-[20px] py-[10px]">
          <button type="button" onClick={addRow} className="flex h-[30px] cursor-pointer items-center gap-[6px] rounded-[8px] border border-line bg-surface px-[10px] text-[13px] font-semibold text-ink transition-colors hover:bg-sunken">
            <Ic d={I.plus} /> Row
          </button>
          <button type="button" onClick={addCol} className="flex h-[30px] cursor-pointer items-center gap-[6px] rounded-[8px] border border-line bg-surface px-[10px] text-[13px] font-semibold text-ink transition-colors hover:bg-sunken">
            <Ic d={I.plus} /> Column
          </button>
          <span className="ml-auto font-mono text-[12px] text-ink3">
            {grid.length - 1} rows · {cols} columns
          </span>
        </div>

        {/* Grid */}
        <div className="min-h-0 flex-1 overflow-auto bg-paper p-[16px]">
          <div className="inline-block min-w-full overflow-hidden rounded-[10px] border border-line bg-surface align-top">
            <table className="border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-20 h-[26px] w-[44px] border-b border-r border-line bg-sunken" />
                  {grid[0].map((_, c) => (
                    <th key={c} className="group sticky top-0 z-10 h-[26px] border-b border-r border-line bg-sunken px-[8px]">
                      <div className="flex items-center justify-center gap-[6px] font-mono text-[11px] font-medium text-ink3">
                        {letter(c)}
                        <button
                          type="button"
                          aria-label={`Delete column ${letter(c)}`}
                          onClick={() => delCol(c)}
                          className="hidden size-[16px] cursor-pointer items-center justify-center rounded-[4px] text-ink3 hover:bg-red-100 hover:text-red-600 group-hover:flex"
                        >
                          <Ic d={I.x} className="size-[10px]" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row, r) => (
                  <tr key={r} className={`group ${r > 0 && r % 2 === 0 ? "bg-paper/60" : ""}`}>
                    <td className="sticky left-0 z-10 w-[44px] border-b border-r border-line bg-sunken text-center font-mono text-[11px] text-ink3">
                      {r === 0 ? (
                        <span className="font-semibold text-[#0098c4]">HDR</span>
                      ) : (
                        <>
                          <span className="group-hover:hidden">{r}</span>
                          <button
                            type="button"
                            aria-label={`Delete row ${r}`}
                            onClick={() => delRow(r)}
                            className="mx-auto hidden size-[20px] cursor-pointer items-center justify-center rounded-[4px] text-ink3 hover:bg-red-100 hover:text-red-600 group-hover:flex"
                          >
                            <Ic d={I.x} className="size-[11px]" />
                          </button>
                        </>
                      )}
                    </td>
                    {row.map((cell, c) => (
                      <td key={c} className="border-b border-r border-line p-0">
                        <input
                          data-cell={`${r}-${c}`}
                          value={cell}
                          spellCheck={false}
                          onChange={(e) => setCell(r, c, e.target.value)}
                          onPaste={(e) => onPaste(e, r, c)}
                          onKeyDown={(e) => onCellKey(e, r, c)}
                          className={`block h-[38px] w-full min-w-[150px] bg-transparent px-[12px] text-[13px] text-ink outline-none transition-colors focus:bg-[#e6f8fd] focus:ring-2 focus:ring-inset focus:ring-[#00b8e6] ${
                            r === 0 ? "font-semibold" : ""
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              onClick={addRow}
              className="flex h-[36px] w-full cursor-pointer items-center justify-center gap-[6px] text-[12px] font-semibold text-ink3 transition-colors hover:bg-[#e6f8fd] hover:text-[#0098c4]"
            >
              <Ic d={I.plus} /> Add row
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-[12px] border-t border-line px-[20px] py-[14px]">
          <span className="hidden font-mono text-[11px] text-ink3 md:block">
            Tab / Enter to move · Ctrl+Enter to apply · Esc to close
          </span>
          <div className="ml-auto flex gap-[8px]">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={!dirty} onClick={() => onApply(toCsv(grid))}>
              Apply changes
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}