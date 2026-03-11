"use client";

interface AboutData {
  intro_label?: string;
  intro_text?: string;
  cards?: { icon?: string; title?: string; desc?: string }[];
}

const DEFAULT_CARDS = [
  { icon: "🤖", title: "AI 기반 자동 업데이트", desc: "Gemini AI가 구글 플레이스 데이터를 분석해 6시간마다 리뷰와 업소 정보를 자동 생성합니다." },
  { icon: "📍", title: "전국 지역별 맞춤 정보", desc: "강남·수원 인계동·동탄·제주를 시작으로 전국 14개 지역으로 확장 중입니다." },
  { icon: "💰", title: "투명한 가격 정보 공개", desc: "지역별·업종별 1인 평균 주대를 주 1회 업데이트합니다." },
];

export default function AboutSection({ data }: { data?: AboutData | null }) {
  const cards = data?.cards?.length ? data.cards : DEFAULT_CARDS;
  return (
    <section className="seo-section section" aria-label="about 룸빵여지도">
      <div className="page-wrap">
        <div className="seo-intro">
          <p className="sec-label" style={{ marginBottom: 8 }}>{data?.intro_label ?? "ABOUT 룸빵여지도"}</p>
          <p className="seo-intro-text" dangerouslySetInnerHTML={{ __html: data?.intro_text ?? "<strong>룸빵여지도</strong>는 강남·수원·동탄·제주 등 전국 주요 지역의 <strong>가라오케·룸싸롱·하이퍼블릭·셔츠룸·퍼블릭</strong> 정보를 한눈에 비교할 수 있는 국내 최대 유흥 정보 허브입니다. Gemini AI가 Google Places 데이터를 기반으로 <strong>6시간마다 자동 업데이트</strong>하여 항상 가장 최신의 정보를 제공합니다." }} />
        </div>
        <div className="seo-cards">
          {cards.map((c, i) => (
            <div key={c.title ?? i} className="seo-card">
              <div className="seo-card-icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
