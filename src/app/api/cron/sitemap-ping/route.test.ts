import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: {
    from: () => ({
      insert: () => ({
        select: () => ({ single: () => Promise.resolve({ data: { id: 'health-1' } }) }),
      }),
      update: () => ({ eq: () => Promise.resolve({}) }),
    }),
  },
}))

vi.mock('@/app/sitemap', () => ({
  generateSitemapPayload: () =>
    Promise.resolve({
      urls: [
        { url: 'https://rbbmap.com' },
        { url: 'https://rbbmap.com/reviews' },
      ],
      diagnostics: {
        review_count: 1,
        partner_count: 1,
        errors: [],
      },
    }),
}))

describe('GET /api/cron/sitemap-ping', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    process.env.CRON_SECRET = 'test-secret'
  })

  it('잘못된 secret이면 401 반환', async () => {
    const { GET } = await import('./route')
    const req = new Request('https://rbbmap.com/api/cron/sitemap-ping?cron_secret=wrong')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('올바른 secret이면 Ping 수행', async () => {
    const { GET } = await import('./route')
    const req = new Request('https://rbbmap.com/api/cron/sitemap-ping?cron_secret=test-secret')
    const res = await GET(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.msg).toContain('사이트맵')
  })
})
