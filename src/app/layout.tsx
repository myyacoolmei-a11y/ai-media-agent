import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_TC } from "next/font/google";
import "./globals.css";

import { PreviewBanner } from "@/components/preview-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsSerif = Noto_Serif_TC({
  variable: "--font-news-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Media",
    template: "%s · AI Media",
  },
  description: "AI Media 媒體網站：最新報導、影音報導與內容後台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} ${newsSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#070707] text-white">
        <PreviewBanner />
        {children}
      </body>
    </html>
  );
}
