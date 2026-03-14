import type { Metadata } from "next";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { VisitTracker } from "@/components/layout/VisitTracker";
import { getSiteSection } from "@/lib/data/site";
import "./globals.css";

const DEFAULT_DESC =
  "믿을 수 있는 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다. 6시간마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.";
const DEFAULT_TITLE = "룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보";
const SITE_URL = "https://rbbmap.com";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSiteSection<{ title?: string; description?: string; ogImage?: string; siteUrl?: string; googleVerify?: string }>("seo");
    const title = seo?.title || DEFAULT_TITLE;
    const description = seo?.description || DEFAULT_DESC;
    const siteUrl = seo?.siteUrl || SITE_URL;
    const ogImage = seo?.ogImage || `${siteUrl}/og/og-home.png`;
    const googleVerify = seo?.googleVerify || "-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY";
    return {
      metadataBase: new URL(siteUrl),
      title,
      description,
      icons: {
        icon: [
          { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
          { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
          { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
        shortcut: "/favicon.ico",
      },
      openGraph: {
        type: "website",
        locale: "ko_KR",
        url: siteUrl,
        siteName: "룸빵여지도",
        title,
        description,
        images: [
          { url: "/og/og-home.png", width: 1200, height: 630, alt: "룸빵여지도 — 믿을 수 있는 업소를 한눈에" },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: "믿을 수 있는 업소를 한눈에!",
        images: ["/og/og-home.png"],
      },
      verification: { google: googleVerify },
    };
  } catch {
    return {
      metadataBase: new URL(SITE_URL),
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      icons: {
        icon: [
          { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
          { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
          { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
        shortcut: "/favicon.ico",
      },
      openGraph: {
        type: "website",
        locale: "ko_KR",
        url: SITE_URL,
        siteName: "룸빵여지도",
        title: DEFAULT_TITLE,
        description: DEFAULT_DESC,
        images: [
          { url: "/og/og-home.png", width: 1200, height: 630, alt: "룸빵여지도 — 믿을 수 있는 업소를 한눈에" },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: DEFAULT_TITLE,
        description: "믿을 수 있는 업소를 한눈에!",
        images: ["/og/og-home.png"],
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
    description: "믿을 수 있는 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다. 6시간마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.",
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
        <meta name="google-site-verification" content="-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body>
        <AuthProvider>
          <VisitTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
