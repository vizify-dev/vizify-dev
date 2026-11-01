(() => {
  const table = document.querySelector<HTMLTableElement>("table");
  const body = table?.tBodies.item(0);
  if (!table || !body) return;
  const tableBody = body;

  const originalRows = Array.from(body.rows);
  let ascending = true;
  const headers = Array.from(
    table.querySelectorAll("thead th"),
    (header) => header.textContent?.trim() ?? "",
  );

  function indexOfHeader(name: string): number {
    return headers.findIndex((header) => header.toLowerCase() === name);
  }

  function slug(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function avatarTone(value: string): number {
    let result = 0;
    for (let i = 0; i < value.length; i++) result = (result * 31 + value.charCodeAt(i)) % 6;
    return result;
  }

  function enhanceTable(): void {
    originalRows.forEach((row) => {
      Array.from(row.cells).forEach((cell) => {
        cell.setAttribute("data-v", cell.textContent?.trim() ?? "");
      });
    });

    const statusIndex = indexOfHeader("status");
    const ownerIndex = indexOfHeader("owner");

    originalRows.forEach((row) => {
      const statusCell = row.cells[statusIndex];
      const statusValue = statusCell?.getAttribute("data-v");
      if (statusIndex > -1 && statusCell && statusValue) {
        const pill = document.createElement("span");
        pill.className = `status-pill ${slug(statusValue)}`;
        pill.textContent = statusValue;
        statusCell.replaceChildren(pill);
      }

      const ownerCell = row.cells[ownerIndex];
      const ownerValue = ownerCell?.getAttribute("data-v");
      if (ownerIndex > -1 && ownerCell && ownerValue) {
        const wrapper = document.createElement("div");
        wrapper.className = "owner-cell";

        const avatar = document.createElement("div");
        avatar.className = `avatar tone-${avatarTone(ownerValue)}`;
        avatar.textContent = ownerValue.charAt(0).toUpperCase();
        avatar.setAttribute("aria-hidden", "true");

        const label = document.createElement("span");
        label.textContent = ownerValue;
        wrapper.append(avatar, label);
        ownerCell.replaceChildren(wrapper);
      }
    });
  }

  enhanceTable();

  const search = document.querySelector<HTMLInputElement>("#vz-q");
  const columnSelect = document.querySelector<HTMLSelectElement>("#vz-col");
  const directionButton = document.querySelector<HTMLButtonElement>("#vz-dir");
  const resultCount = document.querySelector<HTMLElement>("#vz-n");
  const title = document.querySelector<HTMLElement>("#vz-title");
  const dueIndex = indexOfHeader("due");

  if (title) {
    const defaultTitle = getComputedStyle(document.documentElement)
      .getPropertyValue("--vz-title")
      .trim()
      .replace(/^["']|["']$/g, "");
    title.textContent = title.getAttribute("data-t") || defaultTitle;
  }

  if (search) {
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.focus();
      }
    });
  }

  if (columnSelect) {
    headers.forEach((header, index) => {
      columnSelect.add(new Option(header, String(index)));
    });
  }

  function cellValue(row: HTMLTableRowElement, index: number): string {
    return row.cells[index]?.getAttribute("data-v") ?? "";
  }

  function numericValue(value: string): number | null {
    const normalized = value.replace(/[,$%\s]/g, "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function sort(): void {
    if (!columnSelect) return;
    const selectedIndex = columnSelect.value;
    const rows = [...originalRows];
    if (selectedIndex !== "") {
      const columnIndex = Number(selectedIndex);
      rows.sort((a, b) => {
        const aValue = cellValue(a, columnIndex);
        const bValue = cellValue(b, columnIndex);
        const aNumber = numericValue(aValue);
        const bNumber = numericValue(bValue);
        const comparison =
          aNumber !== null && bNumber !== null
            ? aNumber - bNumber
            : aValue.localeCompare(bValue, undefined, {
                numeric: true,
                sensitivity: "base",
              });
        return ascending ? comparison : -comparison;
      });
    }
    rows.forEach((row) => tableBody.appendChild(row));
  }

  function filter(): void {
    const query = search?.value.toLowerCase() ?? "";
    let visibleCount = 0;
    originalRows.forEach((row) => {
      const text = Array.from(row.cells, (cell) => cell.getAttribute("data-v") ?? "")
        .join(" ")
        .toLowerCase();
      const visible = text.includes(query);
      row.hidden = !visible;
      if (visible) visibleCount++;
    });
    if (resultCount) {
      resultCount.textContent = `${visibleCount} / ${originalRows.length}`;
    }
  }

  search?.addEventListener("input", filter);
  columnSelect?.addEventListener("change", sort);
  directionButton?.addEventListener("click", () => {
    ascending = !ascending;
    directionButton.textContent = ascending ? "↑" : "↓";
    sort();
  });
  filter();

  if (dueIndex > -1) {
    originalRows.forEach((row) => row.cells[dueIndex]?.classList.add("col-due"));
  }
})();
