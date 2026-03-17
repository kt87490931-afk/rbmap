import { describe, it, expect, vi, beforeEach } from 'vitest'
import sitemap from './sitemap'

vi.mock('@/lib/data/regions', () => ({
  getRegions: vi.fn().mockResolvedValue([{ slug: 'gangnam' }, { slug: 'dongtan' }]),
}))

let reviewRangeCalls = 0
vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table === 'partners') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({
                  data: [{ href: '/gangnam/karaoke/dalto' }],
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'review_posts') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                range: () => {
                  reviewRangeCalls += 1
                  if (reviewRangeCalls === 1) {
                    return Promise.resolve({
                      data: [{
                        region: 'dongtan',
                        type: 'karaoke',
                        venue_slug: 'dongtan-choigga',
                        slug: 'review-1',
                        updated_at: '2026-03-14T12:00:00Z',
                        published_at: '2026-03-14T12:00:00Z',
                        created_at: '2026-03-14T12:00:00Z',
                      }],
                      error: null,
                    })
                  }
                  return Promise.resolve({ data: [], error: null })
                },
              }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
              range: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }
    },
  },
}))

describe('sitemap', () => {
  beforeEach(() => {
    reviewRangeCalls = 0
  })

  it('정적 페이지 URL 포함', async () => {
    const urls = await sitemap()
    const urlStrings = urls.map((u) => u.url)

    expect(urlStrings).toContain('https://rbbmap.com')
    expect(urlStrings).toContain('https://rbbmap.com/reviews')
    expect(urlStrings).toContain('https://rbbmap.com/regions')
  })

  it('지역 페이지 URL 포함', async () => {
    const urls = await sitemap()
    const urlStrings = urls.map((u) => u.url)

    expect(urlStrings).toContain('https://rbbmap.com/gangnam')
    expect(urlStrings).toContain('https://rbbmap.com/dongtan')
  })

  it('리뷰 URL 형식 맞음', async () => {
    const urls = await sitemap()
    const reviewUrl = urls.find((u) => u.url.includes('/dongtan/karaoke/dongtan-choigga/review-1'))
    expect(reviewUrl).toBeDefined()
  })
})
