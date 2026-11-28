export type SaveState =
  | "idle"
  | "saving"
  | "saved"
  | "offline"
  | "failed"
  | "conflict";

const LABEL: Record<SaveState, string> = {
  idle: "",
  saving: "Saving…",
  saved: "✓ Saved",
  offline: "Offline · saved on this device",
  failed: "Couldn't save · changes kept on this device",
  conflict: "Changed elsewhere",
};

export default function SaveStatus({
  state,
  retryable = false,
  onRetry,
}: {
  state: SaveState;
  retryable?: boolean;
  onRetry: () => void;
}) {
  if (state === "idle") return null;
  const warn = state === "failed" || state === "offline" || state === "conflict";

  return (
    <span
      role="status"
      aria-live="polite"
      className={`whitespace-nowrap font-mono text-[12px] ${warn ? "text-amber-700" : "text-ink3"}`}
    >
      {state === "failed" && !retryable
        ? "Couldn't save · we're looking into it"
        : LABEL[state]}
      {state === "failed" && retryable && (
        <button type="button" onClick={onRetry} className="ml-2 underline">
          Retry
        </button>
      )}
      {state === "conflict" && (
        <button type="button" onClick={onRetry} className="ml-2 underline">
          Review
        </button>
      )}
    </span>
  );
}
