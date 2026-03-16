import { describe, it, expect } from 'vitest'
import { DUPLICATE_WINDOW_MS } from './cron-generate-reviews'
import { canGenerateReview } from './review-schedule'

describe('cron-generate-reviews 중복 방지', () => {
  it('DUPLICATE_WINDOW_MS는 6시간(ms)이다', () => {
    expect(DUPLICATE_WINDOW_MS).toBe(6 * 60 * 60 * 1000)
  })

  it('최소 스케줄 6시간에 맞춰 6시간 윈도우로 동일 업체 중복 방지', () => {
    expect(DUPLICATE_WINDOW_MS).toBeGreaterThanOrEqual(20 * 60 * 1000)
  })
})

describe('review-schedule canGenerateReview (간격·일한도)', () => {
  it('마지막 리뷰 6시간 미만이면 6h_4 프리셋에서 생성 불가', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    expect(canGenerateReview(fiveHoursAgo, 0, '6h_4')).toBe(false)
  })

  it('마지막 리뷰 6시간 이상이고 오늘 4건 미만이면 생성 가능', () => {
    const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
    expect(canGenerateReview(sevenHoursAgo, 2, '6h_4')).toBe(true)
  })

  it('오늘 4건이면 6h_4에서 생성 불가', () => {
    const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
    expect(canGenerateReview(sevenHoursAgo, 4, '6h_4')).toBe(false)
  })
})
