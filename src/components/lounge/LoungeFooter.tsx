import Link from 'next/link'

export function LoungeFooter() {
  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-block">
          <Link href="/" className="brand">
            룸빵<em>여지도</em>
          </Link>
          <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginTop: 12 }}>
            프라이빗 라운지 이용 후기와 정보를 제공합니다.
          </p>
        </div>
        <div className="footer-block">
          <h4>바로가기</h4>
          <ul>
            <li><Link href="/#about">소개</Link></li>
            <li><Link href="/#menu">이용요금</Link></li>
            <li><Link href="/reviews">후기</Link></li>
            <li><Link href="/#location">오시는 길</Link></li>
          </ul>
        </div>
        <div className="footer-block">
          <h4>안내</h4>
          <ul>
            <li><Link href="/#contact">문의</Link></li>
            <li><Link href="/reviews">전체 후기</Link></li>
          </ul>
        </div>
      </div>
      <div className="container footer-legal">
        <span>© {new Date().getFullYear()} 룸빵여지도. All rights reserved.</span>
      </div>
    </footer>
  )
}
