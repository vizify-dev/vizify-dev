"use client";

import { useMemo } from "react";
import ExportMenuView from "@/components/ExportMenuView";
import { copyText, download, printHtml, separateHtmlAssets } from "@/lib/export";
import type { View } from "@/components/ViewSwitch";

type ExportMenuProps = {
  view: View;
  html: string;
  csv: string;
  staticHtml: string;
};

export default function ExportMenu({ view, html, csv, staticHtml }: ExportMenuProps) {
  const baseName = `vizify-${view}`;
  const hasJavascript = view !== "resume" && view !== "idcard";
  const files = useMemo(
    () =>
      separateHtmlAssets(
        html,
        `${baseName}.css`,
        hasJavascript ? `${baseName}.js` : undefined,
      ),
    [baseName, hasJavascript, html],
  );

  return (
    <ExportMenuView
      onDownloadHtml={() => download(files.html, "text/html", `${baseName}.html`)}
      onDownloadCss={() => download(files.css, "text/css;charset=utf-8", `${baseName}.css`)}
      onDownloadJavascript={
        hasJavascript
          ? () =>
              download(
                files.javascript,
                "text/javascript;charset=utf-8",
                `${baseName}.js`,
              )
          : undefined
      }
      onDownloadCsv={() => download(csv, "text/csv;charset=utf-8", `${baseName}.csv`)}
      onDownloadPdf={() =>
        printHtml(staticHtml, {
          fitResumeToPage: view === "resume",
          fitTableWidth: view === "table",
        })
      }
      onCopyHtml={() => copyText(files.html)}
    />
  );
}
