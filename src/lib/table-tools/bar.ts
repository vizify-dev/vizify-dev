const BAR_CSS = `.vz-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font: 14px system-ui, sans-serif;
}
.vz-title {
  font: 600 26px Georgia, serif;
  margin-right: auto;
  white-space: nowrap;
}
.vz-title:empty { display: none; }
.vz-search {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e2e7f0;
  border-radius: 8px;
  background: #fff;
  color: #5f6a7f;
}
.vz-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  padding: 0;
  background: transparent;
  font: inherit;
  color: #1f2837;
}
.vz-search kbd {
  font: 11px system-ui, sans-serif;
  color: #5f6a7f;
  border: 1px solid #e2e7f0;
  border-radius: 6px;
  padding: 2px 6px;
}
.vz-bar select,
.vz-bar button {
  height: 36px;
  border: 1px solid #e2e7f0;
  border-radius: 8px;
  padding: 0 12px;
  font: inherit;
  background: #fff;
  color: #1f2837;
}
.vz-bar button {
  cursor: pointer;
  width: 36px;
  padding: 0;
}
.vz-count {
  color: #5f6a7f;
  font-size: 12px;
  white-space: nowrap;
}
tr[hidden] { display: none !important; }
`;

export const BAR = `<style>
${BAR_CSS}
</style>
<div class="vz-bar">
  <span class="vz-title" id="vz-title"></span>
  <label class="vz-search">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>
    <input id="vz-q" type="search" placeholder="Search…" aria-label="Search table">
    <kbd>⌘K</kbd>
  </label>
  <select id="vz-col" aria-label="Sort by"><option value="">Sort by…</option></select>
  <button id="vz-dir" type="button" aria-label="Toggle sort direction">↑</button>
  <span class="vz-count" id="vz-n"></span>
</div>`;
