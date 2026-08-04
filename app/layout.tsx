import type { Metadata } from "next";
import "./globals.css";
import { GtmLoader } from "@/components/GtmLoader";

export const metadata: Metadata = {
  title: "Agatha Forum 2026｜製造業 AI 商用實戰論壇",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Mulish:wght@400;600;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <GtmLoader />
        {children}
      </body>
    </html>
  );
}
