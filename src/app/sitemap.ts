import { MetadataRoute } from "next";
import { getRegions } from "@/lib/data/regions";
import { getPartners } from "@/lib/data/partners";
import { getReviewPostsList, buildReviewUrl } from "@/lib/data/review-posts";
import { REGION_SLUGS } from "@/lib/data/venues";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://rbbmap.com";
const CATEGORIES = ["karaoke", "highpublic", "shirtroom", "public", "jjomoh", "room-salon", "bar"] as const;
const REVIEW_BATCH = 1000;

/** 모든 published 리뷰를 배치로 조회 (Supabase 기본 1000건 제한 대응) */
async function getAllPublishedReviews(): Promise<Awaited<ReturnType<typeof getReviewPostsList>>> {
  const list: Awaited<ReturnType<typeof getReviewPostsList>> = [];
  let offset = 0;
  let chunk: Awaited<ReturnType<typeof getReviewPostsList>>;
  do {
    chunk = await getReviewPostsList({ limit: REVIEW_BATCH, offset });
    list.push(...chunk);
    offset += REVIEW_BATCH;
  } while (chunk.length === REVIEW_BATCH);
  return list;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/reviews`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/regions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/ranking`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  let regions: { slug: string }[] = [];
  try {
    regions = (await getRegions()).map((r) => ({ slug: r.slug }));
  } catch {
    regions = REGION_SLUGS.map((s) => ({ slug: s }));
  }

  const regionSlugs = regions.length > 0 ? regions.map((r) => r.slug) : [...REGION_SLUGS];
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
    const partners = await getPartners(0);
    for (const p of partners) {
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
  } catch {
    /* ignore */
  }

  try {
    const reviews = await getAllPublishedReviews();
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
      urls.push({
        url: `${BASE}${reviewPath}`,
        lastModified: lastMod ? new Date(lastMod) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    }

    for (const type of allTypes) {
      if (CATEGORIES.includes(type as (typeof CATEGORIES)[number])) continue;
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
  } catch {
    /* ignore */
  }

  return urls;
}
