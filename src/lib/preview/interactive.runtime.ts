(() => {
  const table = document.querySelector("table");
  if (!table) return;
  const body = table.tBodies[0];
  const headerRow = table.tHead?.rows[0];
  if (!body || !headerRow) return;

  const rows = Array.from(body.rows);
  const headers = Array.from(headerRow.cells);
  const pageSize = 10;
  let page = 1;
  let sortColumn = -1;
  let sortDirection: -1 | 0 | 1 = 0;

  function cellText(row: HTMLTableRowElement, column: number): string {
    return row.cells[column]?.textContent?.trim() ?? "";
  }

  headers.forEach((_header, column) => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const value = cellText(row, column).toLowerCase();
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    });
    rows.forEach((row) => {
      const value = cellText(row, column).toLowerCase();
      if (value && (counts.get(value) ?? 0) > 1) {
        row.cells[column]?.classList.add("cssv-dup");
      }
    });
  });

  const pager = document.createElement("div");
  pager.className = "cssv-pager";
  table.after(pager);

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

  function render(): void {
    const allRows = sortedRows();
    const pageCount = Math.max(1, Math.ceil(allRows.length / pageSize));
    page = Math.min(page, pageCount);
    body.replaceChildren(...allRows.slice((page - 1) * pageSize, page * pageSize));
    pager.hidden = allRows.length <= pageSize;
    pager.replaceChildren();

    const info = document.createElement("span");
    info.textContent = `Page ${page} of ${pageCount} · ${allRows.length} rows`;
    const navigation = document.createElement("div");

    function addButton(label: string, targetPage: number, disabled: boolean, active = false): void {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.disabled = disabled;
      if (active) button.className = "on";
      button.onclick = () => {
        page = targetPage;
        render();
      };
      navigation.appendChild(button);
    }

    addButton("Prev", page - 1, page === 1);
    for (let targetPage = 1; targetPage <= pageCount; targetPage++) {
      if (targetPage === 1 || targetPage === pageCount || Math.abs(targetPage - page) <= 1) {
        addButton(String(targetPage), targetPage, false, targetPage === page);
      } else if (Math.abs(targetPage - page) === 2) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "…";
        navigation.appendChild(ellipsis);
      }
    }
    addButton("Next", page + 1, page === pageCount);
    pager.append(info, navigation);
  }

  headers.forEach((header, column) => {
    const sortIndicator = document.createElement("span");
    sortIndicator.className = "cssv-sort";
    sortIndicator.setAttribute("aria-hidden", "true");

    const up = document.createElement("i");
    up.className = "up";
    up.textContent = "▲";

    const down = document.createElement("i");
    down.className = "down";
    down.textContent = "▼";
    sortIndicator.append(up, down);

    header.appendChild(sortIndicator);
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
