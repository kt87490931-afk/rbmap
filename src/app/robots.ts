import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://rbbmap.com";

const DISALLOW = ["/admin", "/api/admin"];

/**
 * 어드민 제외 모든 페이지 크롤링 허용.
 * 구글, 네이버, 야후, 다음, 빙, 카카오 등 모든 검색엔진 봇 허용.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: "Googlebot", allow: "/", disallow: DISALLOW },
      { userAgent: "Yeti", allow: "/", disallow: DISALLOW },
      { userAgent: "Bingbot", allow: "/", disallow: DISALLOW },
      { userAgent: "Slurp", allow: "/", disallow: DISALLOW },
      { userAgent: "Daumoa", allow: "/", disallow: DISALLOW },
      { userAgent: "KakaoBot", allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
