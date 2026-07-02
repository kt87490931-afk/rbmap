'use client'

import Link from 'next/link'
import { LoungeHeader } from '@/components/lounge/LoungeHeader'
import { LoungeFooter } from '@/components/lounge/LoungeFooter'
import { LoungeMobileCta } from '@/components/lounge/LoungeMobileCta'
import { LoungeHomeSections } from '@/components/lounge/LoungeHomeSections'
import type { ReviewPost } from '@/lib/data/review-posts'

type Props = {
  latestReviews: (ReviewPost & { flatSlug: string })[]
  totalCount: number
  avgStar: string
  webSiteSchema: Record<string, unknown>
}

export function LoungeHomePage({ latestReviews, totalCount, avgStar, webSiteSchema }: Props) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <a href="#main" className="skip-link">본문 바로가기</a>
      <LoungeHeader />
      <LoungeHomeSections latestReviews={latestReviews} totalCount={totalCount} avgStar={avgStar} />
      <LoungeFooter />
      <LoungeMobileCta />
    </>
  )
}
