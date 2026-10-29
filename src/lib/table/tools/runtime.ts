(() => {
  const table = document.querySelector("table");
  if (!table) return;
  const body = table.tBodies[0];
  if (!body) return;

  const originalRows = Array.from(body.rows);
  let ascending = true;
  const headers = Array.from(table.querySelectorAll("thead th"), (header) =>
    header.textContent?.trim() ?? "",
  );

  function indexOfHeader(name: string): number {
    return headers.findIndex((header) => header.toLowerCase() === name);
  }

  function slug(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function hue(value: string): number {
    let result = 0;
    for (let i = 0; i < value.length; i++) result = (result * 31 + value.charCodeAt(i)) % 360;
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
        statusCell.textContent = "";
        statusCell.appendChild(pill);
      }

      const ownerCell = row.cells[ownerIndex];
      const ownerValue = ownerCell?.getAttribute("data-v");
      if (ownerIndex > -1 && ownerCell && ownerValue) {
        const wrapper = document.createElement("div");
        wrapper.className = "owner-cell";

        const avatar = document.createElement("div");
        avatar.className = `avatar ${slug(ownerValue)}`;
        avatar.textContent = ownerValue.charAt(0).toUpperCase();
        avatar.setAttribute("aria-hidden", "true");
        if (!["sam", "priya", "lee"].includes(slug(ownerValue))) {
          avatar.style.background = `hsl(${hue(ownerValue)},55%,45%)`;
        }

        const label = document.createElement("span");
        label.textContent = ownerValue;
        wrapper.append(avatar, label);
        ownerCell.textContent = "";
        ownerCell.appendChild(wrapper);
      }
    });
  }

  enhanceTable();

  const search = document.querySelector<HTMLInputElement>("#vz-q");
  const columnSelect = document.querySelector<HTMLSelectElement>("#vz-col");
  const directionButton = document.querySelector<HTMLButtonElement>("#vz-dir");
  const resultCount = document.querySelector<HTMLElement>("#vz-n");
  const titleElement = document.querySelector<HTMLElement>("#vz-title");

  if (
    !search ||
    !columnSelect ||
    !directionButton ||
    !resultCount ||
    !titleElement
  ) {
    return;
  }

  const searchInput = search;
  const select = columnSelect;
  const sortDirectionButton = directionButton;
  const count = resultCount;
  const title = titleElement;
  const dueIndex = indexOfHeader("due");
  const defaultTitle = getComputedStyle(document.documentElement)
    .getPropertyValue("--vz-title")
    .trim()
    .replace(/^["']|["']$/g, "");
  title.textContent = title.getAttribute("data-t") || defaultTitle;

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
    }
  });

  headers.forEach((header, index) => {
    select.add(new Option(header, String(index)));
  });

  function numericValue(value: string): number | null {
    const parsed = Number.parseFloat(value.replace(/[,$%\s]/g, ""));
    return Number.isNaN(parsed) ? null : parsed;
  }

  function cellValue(row: HTMLTableRowElement, index: number): string {
    return row.cells[index]?.getAttribute("data-v") ?? "";
  }

  function sort(): void {
    const selectedIndex = select.value;
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
            : aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" });
        return ascending ? comparison : -comparison;
      });
    }
    rows.forEach((row) => body.appendChild(row));
  }

  function filter(): void {
    const query = searchInput.value.toLowerCase();
    let visibleCount = 0;
    originalRows.forEach((row) => {
      const text = Array.from(row.cells, (cell) => cell.getAttribute("data-v") ?? "")
        .join(" ")
        .toLowerCase();
      const visible = text.includes(query);
      row.hidden = !visible;
      if (visible) visibleCount++;
    });
    count.textContent = `${visibleCount} / ${originalRows.length}`;
  }

  searchInput.oninput = filter;
  select.onchange = sort;
  sortDirectionButton.onclick = () => {
    ascending = !ascending;
    sortDirectionButton.textContent = ascending ? "↑" : "↓";
    sort();
  };
  filter();

  if (dueIndex > -1) {
    originalRows.forEach((row) => row.cells[dueIndex]?.classList.add("col-due"));
  }
})();
