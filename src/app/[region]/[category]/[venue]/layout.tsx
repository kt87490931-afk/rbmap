import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rbbmap.com'

/**
 * 업소·리뷰 구간 공통 레이아웃.
 * 이 구간의 기본 메타를 제공해, [slug] 페이지의 generateMetadata가 이를 덮어쓸 수 있게 함.
 * (깊은 동적 라우트에서 자식 메타가 적용되도록 유도)
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '업소 리뷰 | 룸빵여지도',
    description: '룸빵여지도 업소 이용 후기. 매일 업데이트되는 리뷰를 확인하세요.',
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      siteName: '룸빵여지도',
      url: SITE_URL,
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default function VenueSegmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
