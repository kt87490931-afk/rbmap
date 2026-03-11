import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "룸빵여지도 | 전국 가라오케·룸싸롱·하이퍼블릭 지역별 정보",
  description: "강남, 수원, 동탄, 제주 등 전국 지역별 가라오케·룸싸롱·하이퍼블릭 정보",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
