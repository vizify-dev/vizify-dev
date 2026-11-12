(() => {
  const board = document.querySelector<HTMLElement>(".board");
  if (!board) return;
  const input = document.querySelector<HTMLInputElement>(".board-tools input");
  const lanes = Array.from(board.querySelectorAll<HTMLElement>(".lane"));

  function applyFilter(): void {
    const query = (input?.value ?? "").trim().toLowerCase();
    lanes.forEach((lane) => {
      let shown = 0;
      lane.querySelectorAll<HTMLElement>(".card").forEach((card) => {
        const match = !query || (card.textContent ?? "").toLowerCase().includes(query);
        card.hidden = !match;
        if (match) shown++;
      });
      const count = lane.querySelector("h2 span");
      if (count) count.textContent = String(shown);
    });
  }
  input?.addEventListener("input", applyFilter);

  lanes.forEach((lane) => {
    const head = lane.querySelector<HTMLElement>("h2");
    if (!head) return;
    head.tabIndex = 0;
    head.setAttribute("role", "button");
    head.setAttribute("aria-expanded", "true");
    function toggle(): void {
      const collapsed = lane.classList.toggle("collapsed");
      head!.setAttribute("aria-expanded", String(!collapsed));
    }
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });
})();
