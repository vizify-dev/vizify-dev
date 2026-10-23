import type { Metadata } from "next";
import { hanken, jetbrains } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vizify",
  description: "Live playground for CSSV: Comma-Separated Styled Values",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
