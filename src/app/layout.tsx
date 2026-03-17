import type { Metadata } from "next";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { VisitTracker } from "@/components/layout/VisitTracker";
import { RightClickGuard } from "@/components/layout/RightClickGuard";
import { ReviewMetaInHead } from "@/components/ReviewMetaInHead";
import { VenueMetaInHead } from "@/components/VenueMetaInHead";
import { getSiteSection } from "@/lib/data/site";
import "./globals.css";

const SITE_URL = "https://rbbmap.com";

/** 루트 레이아웃은 title/description/og/twitter를 반환하지 않음. 각 페이지의 generateMetadata가 유일한 소스가 되어 리뷰 상세 등에서 기대값이 자동 반영됨 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSiteSection<{ siteUrl?: string; googleVerify?: string; keywords?: string }>("seo");
    const siteUrl = seo?.siteUrl || SITE_URL;
    const googleVerify = seo?.googleVerify || "-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY";
    const keywords =
      seo?.keywords ||
      "룸빵여지도, 강남 가라오케, 수원 가라오케, 동탄 가라오케, 제주 가라오케, 룸싸롱, 하이퍼블릭, 셔츠룸, 쩜오, 퍼블릭";
    return {
      metadataBase: new URL(siteUrl),
      keywords,
      icons: {
        icon: [
          { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
          { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
          { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
          { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
        shortcut: "/favicon.ico",
      },
      verification: { google: googleVerify },
    };
  } catch {
    return {
      metadataBase: new URL(SITE_URL),
      keywords: "룸빵여지도, 강남 가라오케, 수원 가라오케, 동탄 가라오케, 제주 가라오케, 룸싸롱, 하이퍼블릭, 셔츠룸, 쩜오, 퍼블릭",
      icons: {
        icon: [
          { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
          { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
          { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
          { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
        shortcut: "/favicon.ico",
      },
      verification: { google: "-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY" },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "룸빵여지도",
    url: "https://rbbmap.com",
    description: "믿을 수 있는 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다. 20분마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.",
    inLanguage: "ko",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: "https://rbbmap.com/reviews?region={search_term_string}" },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ko">
      <head>
        {/* 리뷰 상세 / 업체소개글 URL이면 여기서 title/og를 넣어 크롤러 초기 HTML에 반드시 포함됨 */}
        <ReviewMetaInHead />
        <VenueMetaInHead />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body>
        <AuthProvider>
          <VisitTracker />
          <RightClickGuard />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
