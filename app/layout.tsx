import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const bodyFont = Noto_Sans_JP({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Supermarket Finance Console",
  description: "スーパーマーケット決算データを店舗横断で比較・登録する管理画面",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--surface)] text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
