(() => {
  const input = document.querySelector<HTMLInputElement>(".certs-tools input");
  const certs = Array.from(document.querySelectorAll<HTMLElement>(".cert"));
  input?.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    certs.forEach((cert) => {
      cert.hidden = !!query && !(cert.textContent ?? "").toLowerCase().includes(query);
    });
  });
})();
