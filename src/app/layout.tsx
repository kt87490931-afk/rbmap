import type { Metadata } from "next";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { VisitTracker } from "@/components/layout/VisitTracker";
import { getSiteSection } from "@/lib/data/site";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSiteSection<{ title?: string; description?: string; ogImage?: string; siteUrl?: string; googleVerify?: string }>("seo");
    const title = seo?.title || "룸빵여지도 | 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보";
    const description = seo?.description || "강남, 수원 인계동, 동탄, 제주 등 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보. 지역별 업소 평점, 가격, 리뷰를 한눈에 비교하세요.";
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
      description: "강남, 수원 인계동, 동탄, 제주 등 전국 룸싸롱·가라오케·셔츠룸·쩜오·퍼블릭·노래방 유흥 정보. 지역별 업소 평점, 가격, 리뷰를 한눈에 비교하세요.",
      verification: { google: "-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY" },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-site-verification" content="-nLZWOQW-BmcPOZRQuq61o9RsoCYZwyYYvmIa0NVouY" />
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
