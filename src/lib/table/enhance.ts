export function enhanceTable(tableElement: HTMLTableElement): void {
  tableElement.querySelectorAll<HTMLTableCellElement>("td:last-child").forEach((cell) => {
    const text = cell.textContent?.trim() ?? "";
    const lower = text.toLowerCase();
    const statusClass = lower.includes("progress")
      ? "in-progress"
      : lower.includes("done")
        ? "done"
        : "not-started";
    const icon = lower.includes("progress") ? "◐" : lower.includes("done") ? "✓" : "○";

    const pill = document.createElement("span");
    pill.className = `status-pill ${statusClass}`;

    const iconElement = document.createElement("span");
    iconElement.className = "status-icon";
    iconElement.textContent = icon;

    pill.append(iconElement, document.createTextNode(` ${text}`));
    cell.replaceChildren(pill);
  });

  tableElement.querySelectorAll<HTMLTableCellElement>("td:nth-child(2)").forEach((cell) => {
    const name = cell.textContent?.trim() ?? "";
    const lowerName = name.toLowerCase();
    const avatarClass = lowerName.includes("sam")
      ? "sam"
      : lowerName.includes("priya")
        ? "priya"
        : lowerName.includes("lee")
          ? "lee"
          : "sam";

    const owner = document.createElement("div");
    owner.className = "owner-cell";

    const avatar = document.createElement("div");
    avatar.className = `avatar ${avatarClass}`;
    avatar.textContent = name.charAt(0).toUpperCase();

    const label = document.createElement("span");
    label.textContent = name;

    owner.append(avatar, label);
    cell.replaceChildren(owner);
  });

  tableElement.querySelectorAll<HTMLTableCellElement>("td:nth-child(3)").forEach((cell) => {
    const date = cell.textContent?.trim() ?? "";
    const due = document.createElement("div");
    due.className = "due-cell";

    const icon = document.createElement("span");
    icon.className = "due-icon";
    icon.textContent = "📅";

    const label = document.createElement("span");
    label.textContent = date;

    due.append(icon, label);
    cell.replaceChildren(due);
  });
}
