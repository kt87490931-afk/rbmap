import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <Link href="/" className="footer-logo">
            <div className="logo-icon" style={{ width: 24, height: 24, fontSize: 11 }}>빵</div>
            룸빵여지도
          </Link>
          <p className="footer-desc">전국 지역별 가라오케·룸싸롱·하이퍼블릭·셔츠룸 정보를 한눈에. Gemini AI가 6시간마다 리뷰를 업데이트합니다.</p>
        </div>
        <div className="footer-col">
          <h4>지역</h4>
          <ul>
            <li><Link href="/gangnam">강남</Link></li>
            <li><Link href="/suwon">수원 인계동</Link></li>
            <li><Link href="/dongtan">동탄</Link></li>
            <li><Link href="/jeju">제주</Link></li>
            <li><Link href="/regions">전체 지역</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>업종</h4>
          <ul>
            <li><Link href="/category/karaoke">가라오케</Link></li>
            <li><Link href="/category/highpublic">하이퍼블릭</Link></li>
            <li><Link href="/category/shirtroom">셔츠룸</Link></li>
            <li><Link href="/category/public">퍼블릭</Link></li>
            <li><Link href="/category/jjomoh">쩜오</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>서비스</h4>
          <ul>
            <li><Link href="/reviews">최신 리뷰</Link></li>
            <li><Link href="/ranking">인기 랭킹</Link></li>
            <li><Link href="/guide">이용 가이드</Link></li>
            <li><Link href="/contact">광고 문의</Link></li>
            <li><Link href="/sitemap.xml">사이트맵</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 룸빵여지도. All rights reserved. | 본 사이트의 정보는 참고용이며 실제와 다를 수 있습니다.</p>
        <div className="footer-links">
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
        </div>
      </div>
    </footer>
  );
}
