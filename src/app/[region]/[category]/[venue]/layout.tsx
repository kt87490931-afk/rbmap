/**
 * 업소·리뷰 구간 공통 레이아웃.
 * 메타는 내보내지 않음 — [venue]/page.tsx(업소 상세)와 [venue]/[slug]/page.tsx(리뷰 상세)가
 * 각자 generateMetadata로 고유 메타를 넣어, 공유/검색 시 올바른 title·og가 나가도록 함.
 */
export default function VenueSegmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
