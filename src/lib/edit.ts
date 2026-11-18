import { escapeHtml } from "@/lib/html";

/** Put on the element that shows a CSV value. `row` is the index in parseCsv() output (header = 0). Pass `raw` only if the displayed text differs from the CSV value. */
export function editAttrs(row: number, col: number, raw?: string): string {
  return ` data-row="${row}" data-col="${col}"${raw === undefined ? "" : ` data-raw="${escapeHtml(raw)}"`}`;
}

const style = `<style>
[data-row][data-col]{cursor:text}
[data-row][data-col]:hover{outline:2px solid rgba(0,184,230,.45);outline-offset:2px;border-radius:3px}
[data-row][data-col]:focus{outline:2px solid #00b8e6;outline-offset:2px;border-radius:3px;background:rgba(0,184,230,.12)}
[data-row][data-col]:empty::before{content:"Add…";opacity:.35}
</style>`;

const script = (scrollY: number) => `<script>
(function () {
  var SEL = "[data-row][data-col]";
  function arm() {
    document.querySelectorAll(SEL + ":not([contenteditable])").forEach(function (el) {
      el.setAttribute("contenteditable", "plaintext-only");
      el.spellcheck = false;
    });
  }
  arm();
  new MutationObserver(arm).observe(document.body, { childList: true, subtree: true });

  var original = "", display = "";
  function cell(e) { return e.target.closest && e.target.closest(SEL); }

  document.addEventListener("focusin", function (e) {
    var el = cell(e); if (!el) return;
    display = el.innerHTML;
    if (el.dataset.raw !== undefined) el.textContent = el.dataset.raw;
    original = el.textContent;
  });
  document.addEventListener("focusout", function (e) {
    var el = cell(e); if (!el) return;
    var value = el.textContent;
    if (value === original) { el.innerHTML = display; return; }
    parent.postMessage({
      source: "cssv-edit",
      row: Number(el.dataset.row), col: Number(el.dataset.col),
      value: value, scroll: window.scrollY
    }, "*");
  });
  document.addEventListener("keydown", function (e) {
    var el = cell(e); if (!el) return;
    if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    else if (e.key === "Escape") { el.textContent = original; el.blur(); }
  });

  var y = ${Math.max(0, Math.round(scrollY)) || 0};
  if (y) { scrollTo(0, y); addEventListener("load", function () { scrollTo(0, y); }); }
})();
</script>`;

/** Click-to-edit layer for the live preview only. Never use on exported/printed HTML. */
export function withEditing(html: string, scrollY = 0): string {
  return html.replace("</body>", () => style + script(scrollY) + "</body>");
}
