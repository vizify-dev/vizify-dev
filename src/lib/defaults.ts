export const DEFAULT_CSV = `task,owner,due,status
Draft homepage copy,Sam,Oct 28,In progress
Pick a theme,Priya,Oct 30,Done
Record the demo,Lee,Nov 4,Not started
Publish the playground,Sam,Nov 8,Not started
Collect feedback,Priya,Nov 15,Not started`;

export type Theme = { id: string; name: string; css: string };

export const THEMES: Theme[] = [
  {
    id: "ledger",
    name: "Ledger",
    css: `table {
  width: 100%;
  border-collapse: collapse;
  font: 15px/1.5 "Hanken Grotesk";
}

th {
  text-align: left;
  font-size: 11px;
  letter-spacing: .08em;
  text-transform: uppercase;
  border-bottom: 2px solid #14161a;
}

td {
  padding: 12px;
  border-bottom: 1px solid #d6d6cc;
}`,
  },
  {
    id: "classic",
    name: "Classic",
    css: `table {
  border-collapse: collapse;
  width: 100%;
  font-family: system-ui, sans-serif;
  font-size: 14px;
}

th {
  background: #4f46e5;
  color: white;
  text-align: left;
  padding: 10px 14px;
}

td {
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
}

tr:nth-child(even) td {
  background: #f3f4f6;
}`,
  },
];

export const DEFAULT_CSS: string = THEMES[0].css;
