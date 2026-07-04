import { describe, expect, it } from 'vitest'
import { pickRandomIds } from './cron-publish-reviews'

describe('pickRandomIds', () => {
  it('returns empty for empty input', () => {
    expect(pickRandomIds([], 5)).toEqual([])
  })

  it('returns at most n items', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const picked = pickRandomIds(ids, 5)
    expect(picked).toHaveLength(5)
    expect(new Set(picked).size).toBe(5)
    for (const id of picked) expect(ids).toContain(id)
  })

  it('returns all when n exceeds length', () => {
    const ids = ['a', 'b', 'c']
    expect(pickRandomIds(ids, 10)).toHaveLength(3)
  })
})
