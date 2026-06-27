import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "통계",
  description: "PV · UV · 봇 · PC/모바일/태블릿 · 일별/월별 방문 통계",
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
