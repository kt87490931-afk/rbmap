import { MetadataRoute } from 'next'
import { getFlatSlugIndex } from '@/lib/data/review-flat'
import { supabaseAdmin } from '@/lib/supabase-server'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'
const REVIEW_BATCH = 500

type SitemapReviewRow = {
  id: string
  updated_at?: string | null
  published_at?: string | null
  created_at?: string | null
}

export type SitemapDiagnostics = {
  generated_at: string
  total_url_count: number
  static_url_count: number
  review_url_count: number
  review_count: number
  review_batches: number
  partial: boolean
  errors: string[]
}

async function getAllPublishedReviewIdsStrict(): Promise<SitemapReviewRow[]> {
  const list: SitemapReviewRow[] = []
  let offset = 0
  let chunk: SitemapReviewRow[] = []
  do {
    const { data, error } = await supabaseAdmin
      .from('review_posts')
      .select('id, updated_at, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + REVIEW_BATCH - 1)
    if (error) {
      throw new Error(`review_posts 조회 실패(offset=${offset}): ${error.message}`)
    }
    chunk = (data ?? []) as SitemapReviewRow[]
    list.push(...chunk)
    offset += REVIEW_BATCH
  } while (chunk.length === REVIEW_BATCH)
  return list
}

export async function generateSitemapPayload(): Promise<{
  urls: MetadataRoute.Sitemap
  diagnostics: SitemapDiagnostics
}> {
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/reviews`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ]
  const diagnostics: SitemapDiagnostics = {
    generated_at: new Date().toISOString(),
    total_url_count: 0,
    static_url_count: urls.length,
    review_url_count: 0,
    review_count: 0,
    review_batches: 0,
    partial: false,
    errors: [],
  }

  try {
    const [reviews, index] = await Promise.all([
      getAllPublishedReviewIdsStrict(),
      getFlatSlugIndex(),
    ])
    diagnostics.review_count = reviews.length
    diagnostics.review_batches = Math.ceil(reviews.length / REVIEW_BATCH)

    for (const r of reviews) {
      const flatSlug = index.idToFlat.get(r.id)
      if (!flatSlug) continue
      const lastMod = r.updated_at || r.published_at || r.created_at
      const reviewPath = `/reviews/${encodeURIComponent(flatSlug)}`
      urls.push({
        url: `${BASE}${reviewPath}`,
        lastModified: lastMod ? new Date(lastMod) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })
    }
    diagnostics.review_url_count = urls.length - diagnostics.static_url_count
  } catch (e) {
    diagnostics.errors.push(`reviews 조회 실패: ${e instanceof Error ? e.message : 'unknown'}`)
    diagnostics.partial = true
  }

  diagnostics.total_url_count = urls.length
  return { urls, diagnostics }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await generateSitemapPayload()
  return payload.urls
}
