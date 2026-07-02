import Link from 'next/link'

export function LoungeMobileCta() {
  return (
    <div className="mobile-fixed-cta">
      <Link href="/#contact">문의하기</Link>
      <Link href="/reviews" className="call">후기 보기</Link>
    </div>
  )
}
