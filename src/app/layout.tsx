import type { Metadata } from "next";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { VisitTracker } from "@/components/layout/VisitTracker";
import { getSiteSection } from "@/lib/data/site";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await getSiteSection<{ title?: string; description?: string; ogImage?: string; siteUrl?: string; googleVerify?: string }>("seo");
    const title = seo?.title || "룸빵여지도 | 전국 가라오케·룸싸롱·하이퍼블릭 지역별 정보";
    const description = seo?.description || "강남, 수원, 동탄, 제주 등 전국 지역별 가라오케·룸싸롱·하이퍼블릭 정보";
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
      title: "룸빵여지도 | 전국 가라오케·룸싸롱·하이퍼블릭 지역별 정보",
      description: "강남, 수원, 동탄, 제주 등 전국 지역별 가라오케·룸싸롱·하이퍼블릭 정보",
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
      <body>
        <AuthProvider>
          <VisitTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
