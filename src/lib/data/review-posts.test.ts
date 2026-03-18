import { describe, it, expect } from 'vitest'
import { buildReviewUrl } from './review-posts'

describe('buildReviewUrl', () => {
  it('지역/종목/업소/슬러그로 URL 생성', () => {
    expect(buildReviewUrl('dongtan', 'karaoke', 'dongtan-choigga', '동탄룸싸롱-mmq9xfny')).toBe(
      '/dongtan/karaoke/dongtan-choigga/동탄룸싸롱-mmq9xfny'
    )
  })

  it('강남 가라오케 URL', () => {
    expect(buildReviewUrl('gangnam', 'karaoke', 'dalto', 'review-123')).toBe(
      '/gangnam/karaoke/dalto/review-123'
    )
  })
})
