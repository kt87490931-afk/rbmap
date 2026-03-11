import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-eyebrow">
        <div className="live-dot" /> Gemini AI · 6시간 자동 업데이트
      </div>
      <h1>
        전국 룸빵 정보,
        <br />
        <em>여기서 다 찾자</em>
      </h1>
      <p className="hero-desc">
        강남부터 제주까지 — 가라오케·룸싸롱·하이퍼블릭·셔츠룸
        <br />
        지역별 검증 정보와 실제 이용 후기를 한눈에
      </p>
      <div className="hero-kpi">
        <div className="hero-kpi-item">
          <strong>14</strong>
          <span>등록 지역</span>
        </div>
        <div className="hero-kpi-item">
          <strong>380+</strong>
          <span>등록 업소</span>
        </div>
        <div className="hero-kpi-item">
          <strong>3,200+</strong>
          <span>누적 리뷰</span>
        </div>
        <div className="hero-kpi-item">
          <strong>6H</strong>
          <span>업데이트</span>
        </div>
      </div>
      <div className="hero-btns">
        <Link href="#regions" className="btn-primary">
          🗺 지역 선택하기
        </Link>
        <Link href="/reviews" className="btn-ghost">
          최신 리뷰 →
        </Link>
      </div>
    </section>
  );
}
