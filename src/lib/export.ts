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

export type HtmlAssets = {
  html: string;
  css: string;
  javascript: string;
};

export function separateHtmlAssets(
  html: string,
  cssFilename: string,
  javascriptFilename?: string,
): HtmlAssets {
  const styles: string[] = [];
  const scripts: string[] = [];
  let separatedHtml = html.replace(/<style>([\s\S]*?)<\/style>/gi, (_tag, content: string) => {
    styles.push(content);
    return "";
  });

  if (styles.length > 0) {
    separatedHtml = separatedHtml.replace(
      /<\/head>/i,
      `  <link rel="stylesheet" href="${cssFilename}">\n</head>`,
    );
  }

  if (javascriptFilename) {
    let hasScriptReference = false;
    separatedHtml = separatedHtml.replace(
      /<script>([\s\S]*?)<\/script>/gi,
      (_tag, content: string) => {
        scripts.push(content);
        if (!hasScriptReference) {
          hasScriptReference = true;
          return `<script src="${javascriptFilename}" defer></script>`;
        }
        return "";
      },
    );
    if (scripts.length === 0) {
      throw new Error("A JavaScript filename was provided, but the HTML contains no scripts.");
    }
  } else if (/<script>([\s\S]*?)<\/script>/i.test(separatedHtml)) {
    throw new Error("A JavaScript filename is required to separate embedded scripts.");
  }

  return {
    html: separatedHtml,
    css: styles.join("\n"),
    javascript: scripts.join("\n"),
  };
}

/** Prints a static HTML document from a hidden frame (user picks "Save as PDF"). The doc must contain no script. */
export function printHtml(
  html: string,
  { fitResumeToPage = false }: { fitResumeToPage?: boolean } = {},
): void {
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

export async function copyText(text: string): Promise<void> {
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