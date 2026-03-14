interface AboutData {
  intro_label?: string;
  intro_text?: string;
  cards?: { icon?: string; title?: string; desc?: string }[];
}

const DEFAULT_CARDS = [
  { icon: "🤖", title: "실시간 업데이트", desc: "AI가 실시간 Google Places 데이터를 분석해 6시간마다 리뷰와 업소 정보를 자동 생성합니다." },
  { icon: "📍", title: "전국 지역별 맞춤 정보", desc: "강남·수원 인계동·동탄·제주를 시작으로 전국 14개 지역으로 확장 중입니다." },
  { icon: "💰", title: "투명한 가격 정보", desc: "지역별·업종별 1인 평균 주대를 주 1회 업데이트하여 실제 방문 전 예산 계획에 도움을 드립니다." },
];

export default function AboutSection({ data }: { data?: AboutData | null }) {
  const cards = data?.cards?.length ? data.cards : DEFAULT_CARDS;
  return (
    <section className="section bg-deep" aria-label="about 룸빵여지도">
      <div className="section-inner">
        <span className="section-label">{data?.intro_label ?? "ABOUT 룸빵여지도"}</span>
        <div className="section-head-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <h2 className="section-h2">믿을 수 있는 업소를 <em>한눈에</em></h2>
          <p className="section-desc">
            룸빵여지도는 강남·수원·동탄·제주 등 전국 주요 지역의 가라오케·룸싸롱·하이퍼블릭·셔츠룸·퍼블릭 정보를 한눈에 비교할 수 있는 국내 최대 유흥 정보 허브입니다. AI가 Google Places 데이터를 기반으로 6시간마다 자동 업데이트합니다.
          </p>
        </div>
        <div className="about-feat-grid">
          {cards.map((c, i) => (
            <div key={c.title ?? i} className="about-feat-item">
              <div className="about-feat-icon">{c.icon}</div>
              <div className="about-feat-title">{c.title}</div>
              <div className="about-feat-desc">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
