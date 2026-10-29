import ExportMenuView from "@/components/ExportMenuView";

type ExportMenuProps = {
  onDownloadHtml: () => void;
  onDownloadCsv: () => void;
  onDownloadPdf: () => void;
  onCopyHtml: () => void;
};

export default function ExportMenu(props: ExportMenuProps) {
  return <ExportMenuView {...props} />;
}
