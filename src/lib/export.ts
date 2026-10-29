export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function download(content: string, type: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function printHtml(html: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("The print window was blocked by the browser.");
  }

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
