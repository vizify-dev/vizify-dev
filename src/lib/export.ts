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

/**
 * Splits wide tables into printable column groups, keeping the first column in each group.
 */
function splitWideTable(doc: Document, maxWidth = 980): void {
  const table = doc.querySelector<HTMLTableElement>(".cssv-scroll > table");
  const originalContainer = table?.parentElement;
  const headerRow = table?.tHead?.rows[0];
  if (!table || !originalContainer || !headerRow) return;

  const columnWidths = Array.from(headerRow.cells, (cell) => cell.getBoundingClientRect().width);
  if (columnWidths.reduce((total, width) => total + width, 0) <= maxWidth) return;

  const firstColumnWidth = columnWidths[0] ?? 0;
  const groups: number[][] = [];
  let group: number[] = [];
  let groupWidth = firstColumnWidth;

  for (let column = 1; column < columnWidths.length; column += 1) {
    const width = columnWidths[column] ?? 0;
    if (group.length > 0 && groupWidth + width > maxWidth) {
      groups.push(group);
      group = [];
      groupWidth = firstColumnWidth;
    }
    group.push(column);
    groupWidth += width;
  }
  if (group.length > 0) groups.push(group);
  if (groups.length < 2) return;

  groups.forEach((columns, index) => {
    const includedColumns = new Set([0, ...columns]);
    const partTable = table.cloneNode(true) as HTMLTableElement;

    for (const row of Array.from(partTable.rows)) {
      Array.from(row.cells).forEach((cell, column) => {
        if (!includedColumns.has(column)) cell.remove();
      });
    }

    const label = doc.createElement("p");
    label.className = "cssv-part-label";
    label.textContent = `Columns part ${index + 1} of ${groups.length}`;

    const scrollContainer = doc.createElement("div");
    scrollContainer.className = "cssv-scroll";
    scrollContainer.append(partTable);

    const part = doc.createElement("section");
    part.className = "cssv-part";
    part.append(label, scrollContainer);
    originalContainer.before(part);
  });

  originalContainer.remove();
}

/** Prints a static HTML document from a hidden frame (user picks "Save as PDF"). */
export function printHtml(
  html: string,
  {
    fitResumeToPage = false,
    fitTableWidth = false,
  }: { fitResumeToPage?: boolean; fitTableWidth?: boolean } = {},
): void {
  const frame = document.createElement("iframe");
  frame.style.cssText = fitResumeToPage
    ? "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0"
    : fitTableWidth
      ? "position:fixed;left:-10000px;top:0;width:297mm;height:210mm;border:0"
      : "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.srcdoc = html;
  frame.onload = async () => {
    const win = frame.contentWindow;
    if (!win) return;
    await win.document.fonts.ready;
    if (fitResumeToPage) {
      const resume = win.document.querySelector<HTMLElement>(".resume");
      if (resume) {
        resume.style.setProperty("height", "auto", "important");
        resume.style.setProperty("min-height", "0", "important");
        resume.style.setProperty("overflow", "visible", "important");
        const pageHeight = (297 * 96) / 25.4;
        const contentHeight = Math.max(resume.offsetHeight, resume.scrollHeight);
        resume.style.zoom = String(Math.min(1, (pageHeight * 0.92) / contentHeight));
      }
    }
    if (fitTableWidth) splitWideTable(win.document);
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
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}
