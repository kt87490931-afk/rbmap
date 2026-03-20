'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { VenueEditButton } from './VenueEditButton'

type ReviewItem = {
  id: string
  href: string
  title: string
  stars: string
  starsNum: string
  body: string
  date: string
  charCount: string
}

type Props = {
  region: string
  venue: string
  venueName: string
  isAdmin?: boolean
}

export function VenueReviewsLazy({ region, venue, venueName, isAdmin }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/venue-reviews?region=${encodeURIComponent(region)}&venue=${encodeURIComponent(venue)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ReviewItem[]) => {
        if (!cancelled) {
          setReviews(Array.isArray(data) ? data : [])
        }
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [region, venue])

  return (
    <section className="art-section" id="reviews">
      {isAdmin && <VenueEditButton section="reviews" />}
      <span className="sec-label">REVIEWS · 이용 후기</span>
      <h2 className="art-h2">{venueName} <em>이용 후기</em></h2>
      <p className="art-lead">AI가 6시간마다 최신 후기를 수집·정리합니다.</p>
      {loading ? (
        <div className="fr-grid" style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>리뷰 로딩 중...</p>
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <p className="art-p" style={{ color: 'var(--dim)' }}>등록된 이용 후기가 없습니다.</p>
      ) : (
        <div className="fr-grid">
          {reviews.map((r) => (
            <Link key={r.id} href={r.href} className="fr-card">
              <div className="fr-card-head">
                <span className="fr-stars">{r.stars}</span>
                <span className="fr-date">{r.date}</span>
              </div>
              <div className="fr-title">{r.title}</div>
              <div className="fr-body">
                <p>{r.body}</p>
              </div>
              <div className="fr-more">전문 보기 →</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
