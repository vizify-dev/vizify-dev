(() => {
  const input = document.querySelector<HTMLInputElement>(".cards-tools input");
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".id-card"));
  input?.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    cards.forEach((card) => {
      card.hidden = !!query && !(card.textContent ?? "").toLowerCase().includes(query);
    });
  });
})();
