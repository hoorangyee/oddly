import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polly — 사내 예측 베팅",
  description: "점수로 즐기는 사내 예측 베팅 · 랭킹 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
