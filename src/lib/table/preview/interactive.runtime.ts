(() => {
  const table = document.querySelector("table");
  if (!table) return;
  const body = table.tBodies[0];
  const headerRow = table.tHead?.rows[0];
  if (!body || !headerRow) return;
  const tableBody = body;

  const rows = Array.from(body.rows);
  const headers = Array.from(headerRow.cells);
  const names = headers.map((h) => (h.textContent ?? "").replace(/\s+/g, " ").trim());
  const PAGE_SIZES = [10, 25, 50, 100, 500, 0]; // 0 = All
  let pageSize = 10;
  let page = 1;
  let sortColumn = -1;
  let sortDirection: -1 | 0 | 1 = 0;
  let statColumn = -1; // -1 = summary hidden

  function cellText(row: HTMLTableRowElement, column: number): string {
    return row.cells[column]?.textContent?.trim() ?? "";
  }

  // Duplicate highlight.
  // headers.forEach((_header, column) => {
  //   const counts = new Map<string, number>();
  //   rows.forEach((row) => {
  //     const value = cellText(row, column).toLowerCase();
  //     if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  //   });
  //   rows.forEach((row) => {
  //     const value = cellText(row, column).toLowerCase();
  //     if (value && (counts.get(value) ?? 0) > 1) {
  //       row.cells[column]?.classList.add("cssv-dup");
  //     }
  //   });
  // });

  // Order below the table: summary bar, then pager.
  const pager = document.createElement("div");
  pager.className = "cssv-pager";
  table.after(pager);
  const stats = document.createElement("div");
  stats.className = "cssv-stats";
  stats.hidden = true;
  table.after(stats);


  // ---------- Column summary ----------
  type Kind = "number" | "date" | "text";
  const DATE_LIKE =
    /\d{1,4}[-\/.]\d{1,2}[-\/.]\d{1,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}/;
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  function values(column: number): string[] {
    return rows.map((r) => cellText(r, column)).filter((v) => v !== "");
  }
  function numbers(column: number): number[] {
    return values(column)
      .map((v) => v.replace(/,/g, ""))
      .filter((v) => Number.isFinite(Number(v)))
      .map(Number);
  }
  function kindOf(column: number): Kind {
    const all = values(column);
    if (all.length === 0) return "text";
    const need = all.length * 0.8;
    if (numbers(column).length >= need) return "number";
    if (all.filter((v) => DATE_LIKE.test(v) && !Number.isNaN(Date.parse(v))).length >= need) return "date";
    return "text";
  }
  const kinds = headers.map((_h, column) => kindOf(column));

  function statsFor(column: number): [string, string][] {
    const all = values(column);
    const out: [string, string][] = [["Rows", fmt(all.length)]];
    if (kinds[column] === "number") {
      const nums = numbers(column);
      const sum = nums.reduce((a, b) => a + b, 0);
      out.push(
        ["Sum", fmt(sum)],
        ["Avg", fmt(sum / nums.length)],
        ["Min", fmt(nums.reduce((a, b) => Math.min(a, b)))],
        ["Max", fmt(nums.reduce((a, b) => Math.max(a, b)))],
      );
    } else if (kinds[column] === "date") {
      const dates = all
        .filter((v) => !Number.isNaN(Date.parse(v)))
        .sort((a, b) => Date.parse(a) - Date.parse(b));
      out.push(["Earliest", dates[0] ?? "n/a"], ["Latest", dates[dates.length - 1] ?? "n/a"]);
    } else {
      const freq = new Map<string, { label: string; n: number }>();
      all.forEach((v) => {
        const key = v.toLowerCase();
        const hit = freq.get(key);
        if (hit) hit.n++;
        else freq.set(key, { label: v, n: 1 });
      });
      out.push(["Unique", fmt(freq.size)]);
      // Top values only help when values repeat and there are few of them.
      if (freq.size > 1 && freq.size <= 8 && freq.size < all.length) {
        [...freq.values()]
          .sort((a, b) => b.n - a.n)
          .slice(0, 3)
          .forEach(({ label, n }) =>
            out.push([label.length > 14 ? `${label.slice(0, 13)}…` : label, fmt(n)]),
          );
      }
    }
    return out;
  }

  const sumButtons: HTMLButtonElement[] = [];

  function renderStats(): void {
    stats.replaceChildren();
    stats.hidden = statColumn < 0;
    if (statColumn < 0) return;

    const icon = document.createElement("span");
    icon.className = "cssv-stats-icon";
    icon.textContent = "Σ";
    icon.setAttribute("aria-hidden", "true");

    const title = document.createElement("span");
    title.className = "cssv-stats-title";
    const name = document.createElement("b");
    name.textContent = names[statColumn];
    const scope = document.createElement("small");
    scope.textContent = "All results";
    title.append(name, scope);

    const list = document.createElement("span");
    list.className = "cssv-stats-list";
    statsFor(statColumn).forEach(([label, value]) => {
      const item = document.createElement("span");
      item.className = "stat";
      const key = document.createElement("i");
      key.textContent = label;
      const val = document.createElement("b");
      val.textContent = value;
      item.append(key, val);
      list.appendChild(item);
    });

    const close = document.createElement("button");
    close.type = "button";
    close.className = "cssv-stats-close";
    close.setAttribute("aria-label", "Hide summary");
    close.textContent = "×";
    close.onclick = () => selectColumn(statColumn);

    stats.append(icon, title, list, close);
  }

  // Click the same Σ again (or ×) to hide the summary.
  function selectColumn(column: number): void {
    statColumn = statColumn === column ? -1 : column;
    headers.forEach((h, i) => h.classList.toggle("cssv-col", i === statColumn));
    rows.forEach((r) =>
      Array.from(r.cells).forEach((c, i) => c.classList.toggle("cssv-col", i === statColumn)),
    );
    sumButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === statColumn)));
    renderStats();
  }

  // ---------- Sorting ----------
  function sortedRows(): HTMLTableRowElement[] {
    if (sortDirection === 0) return [...rows];
    return [...rows].sort((a, b) => {
      const aText = cellText(a, sortColumn);
      const bText = cellText(b, sortColumn);
      const aNumber = Number.parseFloat(aText);
      const bNumber = Number.parseFloat(bText);
      const numeric =
        !Number.isNaN(aNumber) &&
        !Number.isNaN(bNumber) &&
        Number.isFinite(Number(aText)) &&
        Number.isFinite(Number(bText));
      const comparison = numeric
        ? aNumber - bNumber
        : aText.localeCompare(bText, undefined, { numeric: true, sensitivity: "base" });
      return comparison * sortDirection;
    });
  }

  // ---------- Pager ----------
  const CHEVRON = (d: string) =>
    `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

  function arrow(name: string, d: string, target: number, disabled: boolean): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cssv-arrow";
    button.setAttribute("aria-label", name);
    button.disabled = disabled;
    button.innerHTML = CHEVRON(d); // static markup, no user data
    button.onclick = () => {
      page = target;
      render();
    };
    return button;
  }

  function render(): void {

    const allRows = sortedRows();
    const size = pageSize === 0 ? Math.max(1, allRows.length) : pageSize;
    const pageCount = Math.max(1, Math.ceil(allRows.length / size));
    page = Math.min(page, pageCount);
    const start = (page - 1) * size;
    tableBody.replaceChildren(...allRows.slice(start, start + size));
    pager.hidden = allRows.length <= PAGE_SIZES[0];
    pager.replaceChildren();

    const left = document.createElement("div");
    left.className = "cssv-pg-left";

    const label = document.createElement("span");
    label.textContent = "Rows per page";

    const selectWrap = document.createElement("span");
    selectWrap.className = "cssv-select";
    const sizeSelect = document.createElement("select");
    sizeSelect.setAttribute("aria-label", "Rows per page");
    PAGE_SIZES.forEach((n) => {
      const option = document.createElement("option");
      option.value = String(n);
      option.textContent = n === 0 ? "All" : String(n);
      option.selected = n === pageSize;
      sizeSelect.appendChild(option);
    });
    sizeSelect.onchange = () => {
      pageSize = Number(sizeSelect.value);
      page = 1;
      render();
    };
    selectWrap.appendChild(sizeSelect);

    const dot = document.createElement("span");
    dot.className = "cssv-dot";
    dot.setAttribute("aria-hidden", "true");

    const range = document.createElement("span");
    const from = allRows.length === 0 ? 0 : start + 1;
    const to = Math.min(start + size, allRows.length);
    range.textContent = `${from}–${to} of ${allRows.length}`;

    left.append(label, selectWrap, dot, range);

    const right = document.createElement("div");
    right.className = "cssv-pg-right";
    const status = document.createElement("span");
    status.className = "cssv-page";
    status.append("Page ");
    const current = document.createElement("b");
    current.textContent = String(page);
    status.append(current, ` of ${pageCount}`);

    right.append(
      arrow("Previous page", "M10 3.5 5.5 8 10 12.5", page - 1, page === 1),
      status,
      arrow("Next page", "M6 3.5 10.5 8 6 12.5", page + 1, page === pageCount),
    );

    pager.append(left, right);
  }

  // ---------- Headers: sort + Σ ----------
  headers.forEach((header, column) => {
    const sortIndicator = document.createElement("span");
    sortIndicator.className = "cssv-sort";
    sortIndicator.setAttribute("aria-hidden", "true");
        sortIndicator.innerHTML =
      '<svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path class="up" d="M4.5 6.5l3.5-3.5 3.5 3.5"/><path class="down" d="M4.5 9.5l3.5 3.5 3.5-3.5"/></svg>'; // static markup
    header.appendChild(sortIndicator);

    const sum = document.createElement("button");
    sum.type = "button";
    sum.className = "cssv-sum";
    sum.textContent = "Σ";
    sum.title = "Show summary for this column";
    sum.setAttribute("aria-label", `Summary for ${names[column]}`);
    sum.setAttribute("aria-pressed", "false");
    sum.addEventListener("click", (event) => {
      event.stopPropagation(); // don't trigger sort
      selectColumn(column);
    });
    sum.addEventListener("keydown", (event) => event.stopPropagation());
    sumButtons.push(sum);
    header.appendChild(sum);

    header.tabIndex = 0;
    header.setAttribute("aria-sort", "none");

    function sortByHeader(): void {
      if (sortColumn === column) {
        sortDirection = sortDirection === 1 ? -1 : sortDirection === -1 ? 0 : 1;
      } else {
        sortColumn = column;
        sortDirection = 1;
      }
      if (sortDirection === 0) sortColumn = -1;
      headers.forEach((item, index) => {
        item.setAttribute(
          "aria-sort",
          index === sortColumn ? (sortDirection === 1 ? "ascending" : "descending") : "none",
        );
      });
      page = 1;
      render();
    }
    header.addEventListener("click", sortByHeader);
    header.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        sortByHeader();
      }
    });
  });

  render();
})();