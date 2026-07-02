import { describe, it, expect, vi, beforeEach } from 'vitest'
import sitemap from './sitemap'

vi.mock('@/lib/data/review-flat', () => ({
  getFlatSlugIndex: vi.fn().mockResolvedValue({
    idToFlat: new Map([['post-1', 'dongtan-karaoke-review']]),
    flatToId: new Map([['dongtan-karaoke-review', 'post-1']]),
    legacyToFlat: new Map(),
  }),
}))

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'post-1',
            updated_at: '2026-03-14T12:00:00Z',
            published_at: '2026-03-14T12:00:00Z',
            created_at: '2026-03-01T12:00:00Z',
          },
        ],
        error: null,
      }),
    })),
  },
}))

describe('sitemap', () => {
  it('정적 페이지 URL 포함', async () => {
    const urls = await sitemap()
    const urlStrings = urls.map((u) => u.url)

    expect(urlStrings).toContain('https://rbbmap.com')
    expect(urlStrings).toContain('https://rbbmap.com/reviews')
    expect(urlStrings).not.toContain('https://rbbmap.com/regions')
  })

  it('평면 리뷰 URL 형식 맞음', async () => {
    const urls = await sitemap()
    const reviewUrl = urls.find((u) => u.url.includes('/reviews/dongtan-karaoke-review'))
    expect(reviewUrl).toBeDefined()
  })
})
