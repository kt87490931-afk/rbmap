import type { Metadata } from "next";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { VisitTracker } from "@/components/layout/VisitTracker";
import { getSiteSection } from "@/lib/data/site";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSiteSection<{ title?: string; description?: string; ogImage?: string; siteUrl?: string; googleVerify?: string }>("seo");
    const title = seo?.title || "룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보";
    const description = seo?.description || "내 주변 합법 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 전국 380개 이상의 검증된 업소와 3,200건이 넘는 실제 이용 후기가 당신의 선택을 돕습니다.";
    const siteUrl = seo?.siteUrl || "https://rbbmap.com";
    const ogImage = seo?.ogImage || `${siteUrl}/og-image.png`;
    const googleVerify = seo?.googleVerify || "-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY";
    return {
      title,
      description,
      openGraph: { title, description, url: siteUrl, images: [{ url: ogImage }], type: "website" },
      verification: { google: googleVerify },
    };
  } catch {
    return {
      title: "룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보",
      description: "내 주변 합법 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 전국 380개 이상의 검증된 업소와 3,200건이 넘는 실제 이용 후기가 당신의 선택을 돕습니다.",
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
    description: "내 주변 합법 업소를 한눈에! 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보",
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
