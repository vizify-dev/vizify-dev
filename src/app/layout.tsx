import type { Metadata } from "next";
import { geist, jetbrains } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vizify",
  description: "Live playground for CSSV: Comma-Separated Styled Values",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
