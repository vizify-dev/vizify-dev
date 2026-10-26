export const DEFAULT_CSV = `Task,Owner,Due,Status
Draft homepage copy,Sam,Oct 28,In progress
Pick a theme,Priya,Oct 30,Done
Record the demo,Lee,Nov 4,Not started
Publish the playground,Sam,Nov 8,Not started
Collect feedback,Priya,Nov 15,Not started`;
const dueIcon = (hex: string) => `.col-due::before {
  content: ""; display: inline-block; width: 16px; height: 16px; margin-right: 8px; vertical-align: -3px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23${hex}' stroke-width='1.3' stroke-linecap='round'%3E%3Crect x='2' y='3' width='12' height='11' rx='2'/%3E%3Cpath d='M2 6.5h12M5.5 1.5v3M10.5 1.5v3'/%3E%3C/svg%3E") no-repeat center / contain;
}`;


export type Theme = { id: string; name: string; css: string; pro?: boolean };

const base = `
table {
  border-collapse: collapse;
  width: 100%;
  font: 14px system-ui, sans-serif;
}

th, td {
  padding: 12px 16px;
  text-align: left;
  vertical-align: middle;
}

/* ===== Status Pills ===== */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.status-pill.in-progress {
  background: #ffedd5;
  color: #c2410c;
}
.status-pill.done {
  background: #dcfce7;
  color: #15803d;
}
.status-pill.not-started {
  background: #e0f2fe;
  color: #0369a1;
}

/* Icons inside pills */
.status-icon {
  font-size: 13px;
  line-height: 1;
}

/* ===== Owner Avatars ===== */
.owner-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
.avatar.sam   { background: #0d9488; }
.avatar.priya { background: #db2777; }
.avatar.lee   { background: #d97706; }

/* Due date with calendar icon */
.due-cell {
  display: flex;
  align-items: center;
  gap: 7px;
}
.due-icon {
  font-size: 14px;
  opacity: 0.7;
}
`;

export const THEMES: Theme[] = [
  
  {
    id: "invoice",
    name: "Invoice",
    css: `${base}
body { background: #fff; color: #222; font-family: Georgia, serif; }
th { border-top: 3px double #222; border-bottom: 1px solid #222; font-variant: small-caps; }
td { border-bottom: 1px dotted #aaa; }
td:last-child, th:last-child { text-align: right; font-variant-numeric: tabular-nums; }
tbody tr:last-child td { border-bottom: 3px double #222; font-weight: 700; }`,
  },

  // 1. Glassmorphism
  {
    id: "glass-tasks",
    name: "Glass Tasks",
    css: `${base}
:root { --vz-title: "My Tasks"; }

html { background: linear-gradient(135deg, #d8c7fb 0%, #cfe2f8 50%, #bff0da 100%) fixed; }
body {
  box-sizing: border-box;
  width: min(960px, calc(100% - 32px));
  margin: 24px auto;
  padding: 20px;
  color: #1e1b4b;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 28px;
  box-shadow: 0 30px 60px -20px rgba(80, 70, 160, 0.3);
}

/* header bar */
.vz-bar { padding: 14px 18px; background: rgba(255, 255, 255, 0.6); border: 1px solid #fff; border-radius: 20px; }
.vz-bar::before {
  content: ""; width: 14px; height: 14px; border-radius: 50%; margin-right: 56px; flex-shrink: 0;
  background: #a78bfa; box-shadow: 22px 0 0 #60a5fa, 44px 0 0 #6ee7b7;
}
body .vz-search { max-width: 280px; background: rgba(255, 255, 255, 0.7); border-color: #fff; border-radius: 14px; }
body .vz-bar select, body .vz-bar button { background: rgba(255, 255, 255, 0.7); border-color: #fff; border-radius: 14px; }

/* table as row cards */
table { border-collapse: separate; border-spacing: 0 10px; }
th {
  background: transparent; color: #64748b; font-size: 12px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.08em;
  border-bottom: 1px solid rgba(100, 116, 139, 0.25);
}
td { background: rgba(255, 255, 255, 0.65); border: 0; padding: 14px 16px; }
td:first-child { border-radius: 16px 0 0 16px; font-weight: 500; }
td:last-child { border-radius: 0 16px 16px 0; }
tbody tr:hover td { background: rgba(255, 255, 255, 0.9); }

/* task status icon */
td:first-child::before {
  content: "○"; display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; margin-right: 14px; vertical-align: middle; font-size: 16px;
  border-radius: 50%; border: 1.5px solid #7dd3fc; color: #0ea5e9; background: #f0f9ff;
}
tr[data-status="done"] td:first-child::before { content: "✓"; border-color: #86efac; color: #16a34a; background: #f0fdf4; }
tr[data-status="in-progress"] td:first-child::before { content: "◔"; border-color: #c4b5fd; color: #7c3aed; background: #faf5ff; }

/* status dot, avatar ring, date icon */
.status-pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.avatar { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.6); }
.col-due::before {
  content: ""; display: inline-block; width: 16px; height: 16px; margin-right: 8px; vertical-align: -3px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%2364748b' stroke-width='1.3' stroke-linecap='round'%3E%3Crect x='2' y='3' width='12' height='11' rx='2'/%3E%3Cpath d='M2 6.5h12M5.5 1.5v3M10.5 1.5v3'/%3E%3C/svg%3E") no-repeat center / contain;
}`,
  },
  {
    id: "neon-board",
    name: "Neon Board",
    css: `${base}
:root { --vz-title: "My Tasks"; }
html { background: #070a14; }
body { box-sizing: border-box; max-width: 1000px; margin: 0 auto; padding: 28px 24px; color: #e6e9f5; }

body .vz-bar { margin-bottom: 20px; }
body .vz-title { font: 800 36px system-ui, sans-serif; background: linear-gradient(90deg, #a855f7, #38bdf8); -webkit-background-clip: text; background-clip: text; color: transparent; }
body .vz-search { max-width: 300px; background: #0d1224; border-color: #2a3358; color: #8b93b5; border-radius: 12px; }
body .vz-search input { color: #e6e9f5; }
body .vz-search kbd { display: none; }
body .vz-bar select, body .vz-bar button { background: #0d1224; border-color: #2a3358; color: #e6e9f5; border-radius: 12px; color-scheme: dark; }
body .vz-count { color: #8b93b5; }

table { border-collapse: separate; border-spacing: 0 10px; }
th { background: linear-gradient(90deg, #1a1f4d, #12183a); color: #c7cdf5; font-size: 12px; letter-spacing: .1em; border-top: 1px solid #2f3a7a; border-bottom: 1px solid #2f3a7a; }
th:first-child { border-left: 1px solid #2f3a7a; border-radius: 12px 0 0 12px; }
th:last-child { border-right: 1px solid #2f3a7a; border-radius: 0 12px 12px 0; }
td { background: #0d1224; border-top: 1px solid #1f2747; border-bottom: 1px solid #1f2747; }
td:first-child { border-left: 1px solid #1f2747; border-radius: 12px 0 0 12px; font-weight: 600; }
td:last-child { border-right: 1px solid #1f2747; border-radius: 0 12px 12px 0; }
tbody tr:hover td { background: #131a36; }

td:first-child::before { content: ""; display: inline-block; width: 10px; height: 10px; margin-right: 14px; border-radius: 50%; background: #60a5fa; box-shadow: 0 0 10px #60a5fa; }
tr[data-status="in-progress"] td:first-child::before { background: #f87171; box-shadow: 0 0 10px #f87171; }
tr[data-status="done"] td:first-child::before { background: #4ade80; box-shadow: 0 0 10px #4ade80; }

.status-pill { border: 1.5px solid currentColor; box-shadow: 0 0 12px -2px currentColor; }
.status-pill.in-progress { background: rgba(248, 113, 113, .08); color: #f87171; }
.status-pill.done { background: rgba(74, 222, 128, .08); color: #4ade80; }
.status-pill.not-started { background: rgba(96, 165, 250, .08); color: #60a5fa; }

.avatar { outline: 2px solid #a855f7; outline-offset: 2px; }
.avatar.sam { outline-color: #2dd4bf; }
.avatar.priya { outline-color: #f472b6; }
.avatar.lee { outline-color: #fbbf24; }
${dueIcon("94a3b8")}`,
  },

  // Image 2: playful pastel
  {
    id: "playful-pastel",
    name: "Playful Pastel",
    css: `${base}
:root { --vz-title: "Task Table"; }
html { background: #fdf8f0; }
body { box-sizing: border-box; max-width: 980px; margin: 0 auto; padding: 24px; color: #3b1d12; }

body .vz-bar { padding: 18px 24px; margin-bottom: 18px; background: linear-gradient(90deg, #ffd9c7, #f3d9f0 60%, #dcd0f5); border-radius: 28px; box-shadow: 0 10px 30px -12px rgba(160, 110, 200, .35); }
.vz-bar::before { content: "✓"; display: grid; place-items: center; width: 52px; height: 52px; margin-right: 12px; border-radius: 14px; background: #fdae85; color: #fff; font-size: 26px; font-weight: 800; }
body .vz-title { font: 800 32px system-ui, sans-serif; color: #3b1d12; }
body .vz-search { max-width: 260px; }
body .vz-search, body .vz-bar select, body .vz-bar button { background: rgba(255, 255, 255, .75); border-color: #fff; border-radius: 14px; }

table { border-collapse: separate; border-spacing: 0 12px; }
th { color: #8a6a5c; font-size: 12px; letter-spacing: .1em; }
td { background: #fff; padding: 14px 18px; border: 0; box-shadow: 0 6px 18px -10px rgba(120, 80, 60, .25); }
td:first-child { border-radius: 22px 0 0 22px; font-weight: 700; font-size: 15px; }
td:last-child { border-radius: 0 22px 22px 0; }

td:first-child::before { content: "📋"; display: inline-grid; place-items: center; width: 44px; height: 44px; margin-right: 14px; vertical-align: middle; border-radius: 50%; background: #e0f0ff; font-size: 20px; }
tr[data-status="in-progress"] td:first-child::before { content: "💡"; background: #fff1dc; }
tr[data-status="done"] td:first-child::before { content: "✅"; background: #e3f6ea; }

.status-pill { padding: 10px 22px; font-size: 14px; }
.status-pill.in-progress { background: #fb8f87; color: #fff; }
.status-pill.done { background: #7fcfa0; color: #fff; }
.status-pill.not-started { background: #85c4f0; color: #fff; }

.avatar { width: 40px; height: 40px; border: 3px solid #fff; box-shadow: 0 0 0 2px #e9d8fd; }
${dueIcon("a08a80")}`,
  },

  // Image 3: bold tracker
  {
    id: "bold-tracker",
    name: "Bold Tracker",
    css: `${base}
:root { --vz-title: "Task Tracker"; }
html { background: #fffdf5; }
body { box-sizing: border-box; max-width: 900px; margin: 0 auto; padding: 28px 24px; color: #000; font-family: "Arial Black", Impact, system-ui, sans-serif; }

body .vz-bar { margin-bottom: 22px; }
body .vz-title { font: 900 44px "Arial Black", Impact, sans-serif; text-transform: uppercase; background: linear-gradient(transparent 82%, #facc15 82%); }
body .vz-search { max-width: 240px; }
body .vz-search, body .vz-bar select, body .vz-bar button { background: #fff; border: 3px solid #000; border-radius: 0; box-shadow: 3px 3px 0 #000; font-weight: 800; }
body .vz-search kbd { display: none; }
body .vz-count { color: #000; font-weight: 800; }

table { border: 3px solid #000; background: #fff; box-shadow: 8px 8px 0 #000; }
th { background: #facc15; color: #000; font-size: 15px; font-weight: 900; letter-spacing: .04em; border: 2px solid #000; }
td { border: 2px solid #000; text-transform: uppercase; font-weight: 800; padding: 12px 14px; }
tbody tr:hover td { background: #fef9c3; }

td:first-child::before { content: "▢"; display: inline-grid; place-items: center; width: 40px; height: 40px; margin-right: 14px; vertical-align: middle; border: 2px solid #000; background: #fff; font-size: 20px; }
tr[data-status="in-progress"] td:first-child::before { content: "✎"; }
tr[data-status="done"] td:first-child::before { content: "✓"; }

.status-pill { border: 2px solid #000; border-radius: 2px; padding: 6px 12px; font-weight: 900; text-transform: uppercase; }
.status-pill.in-progress { background: #f97316; color: #fff; }
.status-pill.done { background: #16a34a; color: #fff; }
.status-pill.not-started { background: #2563eb; color: #fff; }

.avatar { border: 2px solid #000; color: #fff; }
tr[data-status="in-progress"] .avatar { background: #f97316 !important; }
tr[data-status="done"] .avatar { background: #16a34a !important; }
tr[data-status="not-started"] .avatar { background: #2563eb !important; }
${dueIcon("000000")}`,
  },

  // Image 4: violet header + tinted cards
  {
    id: "violet-cards",
    name: "Violet Cards",
    css: `${base}
:root { --vz-title: "My Tasks"; }
html { background: #f5f3ff; }
body { box-sizing: border-box; width: min(960px, calc(100% - 32px)); margin: 24px auto; padding: 0; overflow: hidden; background: #fff; border-radius: 28px; box-shadow: 0 30px 60px -24px rgba(79, 70, 229, .35); color: #1e1b4b; }

body .vz-bar { margin: 0 0 20px; padding: 22px 28px; background: linear-gradient(100deg, #7c3aed, #4f46e5 60%, #3b5bdb); }
body .vz-title { font: 700 30px system-ui, sans-serif; color: #fff; }
.vz-title::before { content: "✦ "; }
body .vz-search { max-width: 260px; }
body .vz-search, body .vz-bar select, body .vz-bar button { background: #fff; border-color: #fff; border-radius: 14px; }
body .vz-count { color: #e0e7ff; }

table { width: calc(100% - 48px); margin: 0 24px 24px; border-collapse: separate; border-spacing: 0 10px; }
th { color: #6d28d9; font-size: 12px; letter-spacing: .1em; }
td { border: 0; padding: 16px; background: #f5f0ff; }
tbody tr:nth-child(3n+2) td { background: #ecfbf3; }
tbody tr:nth-child(3n) td { background: #fff1e8; }
td:first-child { border-radius: 18px 0 0 18px; font-weight: 700; }
td:last-child { border-radius: 0 18px 18px 0; }

.status-pill { border: 1px solid #ddd6fe; box-shadow: 0 4px 10px -4px rgba(124, 58, 237, .3); }
.status-pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.status-pill.in-progress, .status-pill.not-started { background: #fff; color: #6d28d9; }
.status-pill.done { background: #fff; color: #15803d; border-color: #bbf7d0; }

.avatar { width: 44px; height: 44px; font-size: 16px; }
${dueIcon("6b7280")}`,
  },
  {
    id: "notebook",
    name: "Notebook",
    css: `@import url("https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap");
  ${base}
  :root { --vz-title: "Main Problems and Solutions"; }
  
  html { background: #f0f4ff; }
  body {
    box-sizing: border-box;
    width: max-content;
    min-width: min(920px, calc(100% - 32px));
    max-width: none;
    margin: 24px auto;
    padding: 20px 28px 28px;
    background: #eef1ff;
    border: 1px solid #dfe3f8;
    border-radius: 24px;
    color: #4a5fb0;
  }
  
  /* toolbar */
  body .vz-bar { flex-wrap: wrap; justify-content: center; margin-bottom: 4px; }
  body .vz-title { 
    order: -1; 
    flex: 1 0 100%; 
    margin: 0 0 10px; 
    text-align: center; 
    font: 700 22px Caveat, cursive; 
    color: #4a5fb0; 
  }
  body .vz-search, body .vz-bar select, body .vz-bar button { 
    background: #fff; 
    border: 1.5px solid #4a5fb0; 
    border-radius: 10px; 
    color: #4a5fb0; 
  }
  body .vz-search { max-width: 260px; }
  body .vz-search kbd { display: none; }
  body .vz-count { color: #4a5fb0; }
  
  table { 
    table-layout: auto; 
    width: 100%; 
    border-collapse: separate; 
    border-spacing: 16px 18px; 

  }
 
  
  /* ========== HEADER CARDS with spiral rings on top ========== */
  th {
    position: relative;
    padding: 32px 16px 16px;
    background: #fff;
    border: 2.5px solid #4a5fb0;
    border-radius: 16px;
    box-shadow: 6px 6px 0 #4a5fb0;
    text-align: center;
    text-transform: uppercase;
    font: 700 22px Caveat, cursive;
    letter-spacing: .04em;
    color: #4a5fb0;
    min-width: 110px;
  }
  
  /* Spiral rings on top of header cards */
  th::before {
    content: "";
    position: absolute;
    top: -14px;
    left: 14px;
    right: 14px;
    height: 22px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='22' viewBox='0 0 20 22'%3E%3Cpath d='M4.5 17 C0 9 5 2.5 11 3 C17.5 3.5 18 10.5 13 12.5 C9.5 14 6.5 12 8.5 9.5' fill='none' stroke='%234a5fb0' stroke-width='2.6' stroke-linecap='round'/%3E%3Ccircle cx='4.5' cy='17' r='2.2' fill='%234a5fb0'/%3E%3C/svg%3E");
    background-size: 20px 22px;
    background-repeat: space no-repeat;
  }
  
  /* ========== BODY CARDS with spiral rings on the left ========== */
  td {
    position: relative;
    padding: 20px 14px 20px 30px
    background: #fff;
    border: 2px solid #4a5fb0;
    border-radius: 14px;
    box-shadow: 5px 5px 0 #c9d1f6;
    text-align: center;
    font-size: 13px;
    line-height: 1.5;
    color: #4a5fb0;
    min-width: 110px;
  }
  
  td:first-child { 
    box-shadow: 5px 5px 0 #a9b8f7; 
    font: 500 20px Caveat, cursive; 
  }
  
  /* Spiral rings on the left side of body cards */
    td::before {
    content: "";
    position: absolute;
    left: -14px;
    top: 8px;
    bottom: 8px;
    width: 22px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='20' viewBox='0 0 22 20'%3E%3Cg transform='translate(0,20) rotate(-90)'%3E%3Cpath d='M4.5 17 C0 9 5 2.5 11 3 C17.5 3.5 18 10.5 13 12.5 C9.5 14 6.5 12 8.5 9.5' fill='none' stroke='%234a5fb0' stroke-width='2.6' stroke-linecap='round'/%3E%3Ccircle cx='4.5' cy='17' r='2.2' fill='%234a5fb0'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 22px 20px;
    background-repeat: no-repeat space;
  }
  
  tbody tr:hover td { 
    background: #f7f8ff; 
  }
  `,
  },
  {
    id: "receipt",
    name: "Receipt",
    pro: true,
    css: `${base}
:root { --vz-title: "Receipt"; }
html { background: #e8e2d6; }
body { position: relative; box-sizing: border-box; width: max-content; min-width: min(640px, calc(100% - 32px)); max-width: none;margin: 28px auto 44px; padding: 28px 26px 34px; background: #fffef8; color: #1c1c1c; font-family: "Courier New", ui-monospace, monospace; box-shadow: 0 18px 30px -18px rgba(0, 0, 0, .4); }
body::after { content: ""; position: absolute; left: 0; right: 0; bottom: -12px; height: 12px; background: linear-gradient(135deg, #fffef8 50%, transparent 50%) 0 0 / 16px 12px, linear-gradient(225deg, #fffef8 50%, transparent 50%) 0 0 / 16px 12px; }
body .vz-bar { flex-wrap: wrap; padding-bottom: 14px; margin-bottom: 6px; border-bottom: 2px dashed #1c1c1c; }
body .vz-title { order: -1; flex: 1 0 100%; margin: 0 0 12px; text-align: center; font: 700 22px "Courier New", monospace; letter-spacing: .35em; text-transform: uppercase; }
body .vz-search, body .vz-bar select, body .vz-bar button { background: transparent; border: 1px dashed #1c1c1c; border-radius: 0; color: #1c1c1c; font-family: inherit; }
body .vz-search kbd { display: none; }
body .vz-count { color: #1c1c1c; }
table { font: 13px "Courier New", ui-monospace, monospace; }
th { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; padding: 12px 6px; border-bottom: 2px dashed #1c1c1c; }
td { padding: 11px 6px; border-bottom: 1px dashed #b9b4a6; }
td:last-child, th:last-child { text-align: right; }
tbody tr:last-child td { border-bottom: 0; border-top: 2px solid #1c1c1c; font-weight: 700; }
tbody tr:hover td { background: #f6f1e2; }
.status-pill, .status-pill.in-progress, .status-pill.done, .status-pill.not-started { background: none; color: #1c1c1c; border: 1px solid #1c1c1c; border-radius: 2px; padding: 2px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
.status-pill.done::before { content: "✓"; }
.avatar { background: none !important; color: #1c1c1c; border: 1px solid #1c1c1c; width: 24px; height: 24px; font-size: 11px; }`,
  },
  {
    id: "terminal",
    name: "Terminal",
    pro: true,
    css: `@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap");
${base}
:root { --vz-title: "$ cat tasks.csv"; }
html { background: #050b07; }
body { box-sizing: border-box; max-width: 960px; margin: 0 auto; padding: 32px 28px; color: #5cff9d; font-family: "JetBrains Mono", ui-monospace, Consolas, monospace; text-shadow: 0 0 6px rgba(92, 255, 157, .45); }
body::before { content: ""; position: fixed; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none; z-index: 5; background: repeating-linear-gradient(0deg, rgba(0, 0, 0, .22) 0, rgba(0, 0, 0, .22) 1px, transparent 1px, transparent 3px); }
body .vz-bar { margin-bottom: 18px; }
body .vz-title { font: 700 22px "JetBrains Mono", monospace; color: #5cff9d; }
.vz-title::after { content: "▌"; margin-left: 4px; animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
body .vz-search, body .vz-bar select, body .vz-bar button { background: #07130c; border: 1px solid #1e5c3a; border-radius: 0; color: #5cff9d; font-family: inherit; color-scheme: dark; }
body .vz-search input { color: #5cff9d; }
body .vz-search kbd { display: none; }
body .vz-count { color: #3fae72; }
table { font: 13px "JetBrains Mono", ui-monospace, monospace; }
th { color: #9dffc6; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; border-bottom: 1px solid #2f8f5c; }
td { border-bottom: 1px solid #0f3320; }
td:first-child::before { content: "> "; opacity: .55; }
tbody tr:hover td { background: rgba(92, 255, 157, .08); }
.status-pill, .status-pill.in-progress, .status-pill.done, .status-pill.not-started { background: none; border: 0; border-radius: 0; padding: 0; font-weight: 700; text-transform: uppercase; }
.status-pill::before { content: "["; }
.status-pill::after { content: "]"; }
.status-pill.in-progress { color: #ffd166; }
.status-pill.done { color: #5cff9d; }
.status-pill.not-started { color: #7aa2ff; }
.avatar { border-radius: 0; background: #07130c !important; color: #5cff9d; border: 1px solid #2f8f5c; width: 26px; height: 26px; font-size: 11px; }`,
  },
  {
    id: "editorial",
    name: "Editorial",
    pro: true,
    css: `@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;900&family=Inter:wght@400;600&display=swap");
${base}
:root { --vz-title: "The Weekly Report"; }
html { background: #f6f1e7; }
body { box-sizing: border-box; max-width: 900px; margin: 0 auto; padding: 44px 32px; color: #111; font-family: Inter, system-ui, sans-serif; }
body .vz-bar { flex-wrap: wrap; padding-bottom: 16px; margin-bottom: 8px; border-bottom: 3px double #111; }
body .vz-title { order: -1; flex: 1 0 100%; margin: 0 0 14px; font: 900 48px "Playfair Display", Georgia, serif; letter-spacing: -.02em; }
body .vz-search, body .vz-bar select, body .vz-bar button { background: transparent; border: 0; border-bottom: 1px solid #111; border-radius: 0; color: #111; }
body .vz-search { max-width: 280px; }
body .vz-search kbd { display: none; }
body .vz-count { color: #6b6256; }
table { font: 14px Inter, system-ui, sans-serif; counter-reset: row; }
tbody tr { counter-increment: row; }
th { padding: 14px 10px; font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: #6b6256; border-bottom: 1px solid #111; }
td { padding: 18px 10px; border-bottom: 1px solid #d8d0bf; font-variant-numeric: tabular-nums; }
td:first-child { font: 600 18px "Playfair Display", Georgia, serif; }
td:first-child::before { content: counter(row, decimal-leading-zero); margin-right: 16px; font: 600 12px Inter, sans-serif; color: #c2410c; letter-spacing: .08em; }
tbody tr:hover td { background: #efe8d8; }
.status-pill, .status-pill.in-progress, .status-pill.done, .status-pill.not-started { background: none; padding: 0 0 2px; border-radius: 0; border-bottom: 2px solid currentColor; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
.status-pill.in-progress { color: #c2410c; }
.status-pill.done { color: #15803d; }
.status-pill.not-started { color: #6b6256; }
.avatar { background: #111 !important; width: 26px; height: 26px; font-size: 11px; }`,
  },

];

export const DEFAULT_CSS: string = THEMES[0].css;

// =====================================================
// Enhance Status Pills (with icons) + Owner Avatars + Due icons
// =====================================================
export function enhanceTable(tableElement: HTMLTableElement) {
  // ---- Status Pills with icons ----
  const statusCells = tableElement.querySelectorAll("td:last-child");
  statusCells.forEach((cell) => {
    const text = cell.textContent?.trim() || "";
    const lower = text.toLowerCase();

    let className = "status-pill ";
    let icon = "";

    if (lower.includes("progress")) {
      className += "in-progress";
      icon = "◐"; // or "⏳" / "●"
    } else if (lower.includes("done")) {
      className += "done";
      icon = "✓";
    } else {
      className += "not-started";
      icon = "○";
    }

    cell.innerHTML = `
      <span class="${className}">
        <span class="status-icon">${icon}</span>
        ${text}
      </span>
    `;
  });

  // ---- Owner Avatars ----
  const ownerCells = tableElement.querySelectorAll("td:nth-child(2)");
  ownerCells.forEach((cell) => {
    const name = cell.textContent?.trim() || "";
    const initial = name.charAt(0).toUpperCase();
    const lowerName = name.toLowerCase();

    let avatarClass = "avatar ";
    if (lowerName.includes("sam")) avatarClass += "sam";
    else if (lowerName.includes("priya")) avatarClass += "priya";
    else if (lowerName.includes("lee")) avatarClass += "lee";
    else avatarClass += "sam";

    cell.innerHTML = `
      <div class="owner-cell">
        <div class="${avatarClass}">${initial}</div>
        <span>${name}</span>
      </div>
    `;
  });

  // ---- Due date with calendar icon ----
  const dueCells = tableElement.querySelectorAll("td:nth-child(3)");
  dueCells.forEach((cell) => {
    const date = cell.textContent?.trim() || "";
    cell.innerHTML = `
      <div class="due-cell">
        <span class="due-icon">📅</span>
        <span>${date}</span>
      </div>
    `;
  });
}