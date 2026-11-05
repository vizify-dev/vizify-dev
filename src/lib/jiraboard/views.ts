import { renderBoard } from "./render";
import { BOARD_CSV } from "./sample";

export type ViewId = "table" | "resume" | "board";
export type ViewOutput = { css: string; body: string };
export type ViewDef = {
  id: ViewId;
  name: string;
  soon?: boolean;
  sample?: string;
  render?: (rows: string[][], theme?: string, interactive?: boolean) => ViewOutput;
};

export const VIEWS: ViewDef[] = [
  { id: "table", name: "Table" },
  { id: "resume", name: "Resume" },
  { id: "board", name: "Jira Board", sample: BOARD_CSV, render: renderBoard },
];
