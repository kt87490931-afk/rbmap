import { MetadataRoute } from "next";
import { REGION_SLUGS } from "@/lib/data/venues";

const BASE = "https://rbbmap.com";
const CATEGORIES = ["karaoke", "highpublic", "shirtroom", "public", "jjomoh"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/reviews`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/regions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/ranking`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  for (const region of REGION_SLUGS) {
    urls.push({
      url: `${BASE}/${region}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    });
    for (const cat of CATEGORIES) {
      urls.push({
        url: `${BASE}/${region}/category/${cat}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      });
    }
  }

  for (const cat of CATEGORIES) {
    urls.push({
      url: `${BASE}/category/${cat}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    });
  }

  return urls;
}
