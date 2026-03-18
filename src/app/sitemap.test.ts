import { describe, it, expect, vi, beforeEach } from 'vitest'
import sitemap from './sitemap'

vi.mock('@/lib/data/regions', () => ({
  getRegions: vi.fn().mockResolvedValue([{ slug: 'gangnam' }, { slug: 'dongtan' }]),
}))

vi.mock('@/lib/data/partners', () => ({
  getPartners: vi.fn().mockResolvedValue([
    { href: '/gangnam/karaoke/dalto', name: '달토' },
  ]),
}))

vi.mock('@/lib/data/review-posts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/data/review-posts')>()
  return {
    ...mod,
    getReviewPostsList: vi.fn().mockResolvedValue([
      {
        region: 'dongtan',
        type: 'karaoke',
        venue_slug: 'dongtan-choigga',
        slug: 'review-1',
        updated_at: '2026-03-14T12:00:00Z',
      },
    ]),
  }
})

describe('sitemap', () => {
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
