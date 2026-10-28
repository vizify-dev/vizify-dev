export const DEFAULT_CSV = `Task,Owner,Due,Status
Draft homepage copy,Sam,Oct 28,In progress
Pick a theme,Priya,Oct 30,Done
Record the demo,Lee,Nov 4,Not started
Publish the playground,Sam,Nov 8,Not started
Collect feedback,Priya,Nov 15,Not started`;

export type { Theme } from "@/lib/table/themes";

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
