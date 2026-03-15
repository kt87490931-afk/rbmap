import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://rbbmap.com";

/**
 * 구글, 네이버, 다음, 카카오, Bing 등 모든 검색엔진 크롤링 허용.
 * /admin 만 비공개(색인·크롤 제외).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/admin"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
