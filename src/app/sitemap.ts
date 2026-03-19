import { MetadataRoute } from "next";
import { getRegions } from "@/lib/data/regions";
import { buildReviewUrl } from "@/lib/data/review-posts";
import { REGION_SLUGS } from "@/lib/data/venues";
import { supabaseAdmin } from "@/lib/supabase-server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://rbbmap.com";
const CATEGORIES = ["karaoke", "highpublic", "shirtroom", "public", "jjomoh", "room-salon", "bar"] as const;
const REVIEW_BATCH = 500;

type SitemapReviewRow = {
  region: string;
  type: string;
  venue_slug: string;
  slug: string;
  updated_at?: string | null;
  published_at?: string | null;
  created_at?: string | null;
};

type SitemapPartnerRow = {
  href: string | null;
};

export type SitemapDiagnostics = {
  generated_at: string;
  total_url_count: number;
  static_url_count: number;
  region_url_count: number;
  category_url_count: number;
  partner_url_count: number;
  review_url_count: number;
  dynamic_type_url_count: number;
  region_count: number;
  partner_count: number;
  review_count: number;
  review_batches: number;
  partial: boolean;
  errors: string[];
};

/** 모든 published 리뷰를 배치로 조회 (오류 시 throw) */
async function getAllPublishedReviewsStrict(): Promise<SitemapReviewRow[]> {
  const list: SitemapReviewRow[] = [];
  let offset = 0;
  let chunk: SitemapReviewRow[] = [];
  do {
    const { data, error } = await supabaseAdmin
      .from("review_posts")
      .select("region, type, venue_slug, slug, updated_at, published_at, created_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(offset, offset + REVIEW_BATCH - 1);
    if (error) {
      throw new Error(`review_posts 조회 실패(offset=${offset}): ${error.message}`);
    }
    chunk = (data ?? []) as SitemapReviewRow[];
    list.push(...chunk);
    offset += REVIEW_BATCH;
  } while (chunk.length === REVIEW_BATCH);
  return list;
}

export async function generateSitemapPayload(): Promise<{
  urls: MetadataRoute.Sitemap;
  diagnostics: SitemapDiagnostics;
}> {
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/reviews`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/regions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/ranking`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
  const diagnostics: SitemapDiagnostics = {
    generated_at: new Date().toISOString(),
    total_url_count: 0,
    static_url_count: urls.length,
    region_url_count: 0,
    category_url_count: 0,
    partner_url_count: 0,
    review_url_count: 0,
    dynamic_type_url_count: 0,
    region_count: 0,
    partner_count: 0,
    review_count: 0,
    review_batches: 0,
    partial: false,
    errors: [],
  };

  // 색인 가능한 지역만 사이트맵에 포함 (REGION_SLUGS와 일치하는 지역만)
  // busan, incheon 등 준비중/리다이렉트되는 지역은 제외 → "발견됨-색인안됨" 방지
  let regionSlugs: string[] = [];
  try {
    const allRegions = await getRegions();
    const allowedSet = new Set(REGION_SLUGS as readonly string[]);
    regionSlugs = allRegions.map((r) => r.slug).filter((s) => allowedSet.has(s));
    if (regionSlugs.length === 0) {
      diagnostics.errors.push("regions 조회 후 REGION_SLUGS와 일치하는 지역 없음: fallback 사용");
      regionSlugs = [...REGION_SLUGS];
    }
  } catch {
    diagnostics.errors.push("regions 조회 실패: fallback REGION_SLUGS 사용");
    diagnostics.partial = true;
    regionSlugs = [...REGION_SLUGS];
  }
  diagnostics.region_count = regionSlugs.length;
  const allTypes = new Set<string>(CATEGORIES);

  for (const slug of regionSlugs) {
    urls.push({
      url: `${BASE}/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    });
    for (const cat of allTypes) {
      urls.push({
        url: `${BASE}/${slug}/category/${cat}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      });
    }
  }
  diagnostics.region_url_count = regionSlugs.length;
  diagnostics.category_url_count = regionSlugs.length * allTypes.size + allTypes.size;

  for (const cat of allTypes) {
    urls.push({
      url: `${BASE}/category/${cat}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    });
  }

  const seenPaths = new Set<string>();

  try {
    const { data: partners, error } = await supabaseAdmin
      .from("partners")
      .select("href")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1000);
    if (error) {
      throw new Error(error.message);
    }
    const list = (partners ?? []) as SitemapPartnerRow[];
    diagnostics.partner_count = list.length;
    for (const p of list) {
      const href = (p.href || "").trim().replace(/\/$/, "");
      if (href.startsWith("/") && href.length > 2 && !seenPaths.has(href)) {
        seenPaths.add(href);
        urls.push({
          url: `${BASE}${href}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        });
      }
    }
    diagnostics.partner_url_count = seenPaths.size;
  } catch (e) {
    diagnostics.errors.push(`partners 조회 실패: ${e instanceof Error ? e.message : "unknown"}`);
    diagnostics.partial = true;
  }

  try {
    const reviews = await getAllPublishedReviewsStrict();
    diagnostics.review_count = reviews.length;
    diagnostics.review_batches = Math.ceil(reviews.length / REVIEW_BATCH);
    for (const r of reviews) {
      allTypes.add(r.type);

      const venuePath = `/${r.region}/${r.type}/${r.venue_slug}`;
      if (!seenPaths.has(venuePath)) {
        seenPaths.add(venuePath);
        urls.push({
          url: `${BASE}${venuePath}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        });
      }

      const reviewPath = buildReviewUrl(r.region, r.type, r.venue_slug, r.slug);
      const lastMod = r.updated_at || r.published_at || r.created_at;
      const fullReviewUrl = `${BASE}${reviewPath}`;
      urls.push({
        url: encodeURI(fullReviewUrl),
        lastModified: lastMod ? new Date(lastMod) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }
    diagnostics.review_url_count = reviews.length;

    let dynamicTypeCount = 0;
    for (const type of allTypes) {
      if (CATEGORIES.includes(type as (typeof CATEGORIES)[number])) continue;
      dynamicTypeCount += 1;
      urls.push({
        url: `${BASE}/category/${type}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      });
      for (const slug of regionSlugs) {
        const catPath = `/${slug}/category/${type}`;
        if (!seenPaths.has(catPath)) {
          seenPaths.add(catPath);
          urls.push({
            url: `${BASE}${catPath}`,
            lastModified: new Date(),
            changeFrequency: "daily" as const,
            priority: 0.8,
          });
        }
      }
    }
    diagnostics.dynamic_type_url_count = dynamicTypeCount;
  } catch (e) {
    diagnostics.errors.push(`reviews 조회 실패: ${e instanceof Error ? e.message : "unknown"}`);
    diagnostics.partial = true;
  }

  diagnostics.total_url_count = urls.length;
  return { urls, diagnostics };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await generateSitemapPayload();
  return payload.urls;
}
