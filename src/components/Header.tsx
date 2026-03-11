import Link from "next/link";

export default function Header() {
  return (
    <header className="header-main">
      <Link href="/" className="logo">
        <div className="logo-icon">빵</div>
        <div>
          <div className="logo-text">룸빵여지도</div>
          <div className="logo-sub">ROOMBANG YEOJIDO</div>
        </div>
      </Link>
      <div className="header-search">
        <span className="hs-icon">🔍</span>
        <input type="text" placeholder="지역, 업소명, 업종 검색..." />
      </div>
      <nav className="nav-main">
        <Link href="/reviews" className="hide-sm">
          리뷰
        </Link>
        <Link href="/ranking" className="hide-sm">
          랭킹
        </Link>
        <Link href="/guide" className="hide-sm">
          가이드
        </Link>
        <Link href="/contact" className="nav-cta">
          광고문의
        </Link>
      </nav>
    </header>
  );
}
