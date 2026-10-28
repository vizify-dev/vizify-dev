export function download(content: string, type: string, filename: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  /** Prints a static HTML document from a hidden frame (user picks "Save as PDF"). The doc must contain no script. */
  export function printHtml(html: string, { fitResumeToPage = false }: { fitResumeToPage?: boolean } = {}) {
    const frame = document.createElement("iframe");
    frame.style.cssText = fitResumeToPage
      ? "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0"
      : "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    frame.srcdoc = html;
    frame.onload = async () => {
      const win = frame.contentWindow;
      if (!win) return;
      await win.document.fonts.ready;
      if (fitResumeToPage) {
        const resume = win.document.querySelector<HTMLElement>(".resume");
        if (resume) {
          const pageHeight = (297 * 96) / 25.4;
          resume.style.zoom = String(Math.min(1, (pageHeight * 0.97) / resume.offsetHeight));
        }
      }
      win.focus();
      win.print();
      setTimeout(() => frame.remove(), 1000);
    };
    document.body.appendChild(frame);
  }
  
  export async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback when the Clipboard API is blocked or the page isn't focused.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }