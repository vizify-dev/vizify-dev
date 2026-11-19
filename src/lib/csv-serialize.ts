export function toCsv(rows: string[][]): string {
  const q = (v: string) =>
    /[",\r\n]|^\s|\s$/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  return rows.map((r) => r.map(q).join(",")).join("\n");
}