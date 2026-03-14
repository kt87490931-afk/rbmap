"use client";

import Link from "next/link";

interface WidgetsBData {
  timeline?: { time?: string; dot?: string; title?: string; desc?: string }[];
  map_cells?: { href?: string; name?: string; sub?: string; on?: boolean; coming?: boolean }[];
  faq?: { q?: string; a?: string }[];
}

const DEFAULT_FAQ = [
  { q: "리뷰는 어떻게 작성되나요?", a: "AI가 구글 플레이스 데이터를 기반으로 6시간마다 자동 생성합니다." },
  { q: "업소 등록은 어떻게 하나요?", a: "광고 문의 페이지를 통해 등록 신청이 가능합니다. 심사 후 등록됩니다." },
  { q: "가격 정보는 최신인가요?", a: "가격은 주 1회 업데이트되며, 실제 방문 시 변동이 있을 수 있습니다." },
];

export default function WidgetRowB({ data }: { data?: WidgetsBData | null }) {
  const timeline = data?.timeline ?? [];
  const mapCells = data?.map_cells ?? [];
  const faqItems = data?.faq ?? DEFAULT_FAQ;
  const toggleFaq = (e: React.MouseEvent<HTMLDivElement>) => {
    (e.currentTarget.parentElement as HTMLElement).classList.toggle("open");
  };

  return (
    <div className="w-row w3" style={{ marginBottom: 44 }}>
      <div className="widget">
        <div className="wt"><span className="wt-icon wi-g">🕐</span>오늘의 업데이트 타임라인</div>
        <div className="timeline">
          {timeline.length > 0 ? (
            timeline.map((t, i) => (
              <div key={i} className="tl-item">
                <span className="tl-time">{t.time}</span>
                <div className={`tl-dot ${t.dot ?? ""}`} />
                <div className="tl-content">
                  <div className="tl-title">{t.title}</div>
                  <div className="tl-desc">{t.desc}</div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 13, color: "var(--muted)", padding: 16 }}>최근 업데이트가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="widget">
        <div className="wt"><span className="wt-icon wi-b">🗺</span>지역 빠른 이동</div>
        <div className="korea-map">
          {mapCells.length > 0 ? (
            mapCells.map((m, i) => (
              <Link
                key={m.href ?? i}
                href={m.href ?? "#"}
                className={`map-cell ${m.on ? "on" : ""} ${m.coming ? "coming" : ""}`}
              >
                <span className="map-cell-name">{m.name}</span>
                <span className="map-cell-sub">{m.sub}</span>
              </Link>
            ))
          ) : (
            <Link href="/regions" className="map-cell">
              <span className="map-cell-name">전체</span>
              <span className="map-cell-sub">지역</span>
            </Link>
          )}
        </div>
      </div>

      <div className="widget">
        <div className="wt" style={{ marginBottom: 8 }}><span className="wt-icon wi-g">❓</span>자주 묻는 질문</div>
        <div>
          {faqItems.map((f, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q" onClick={toggleFaq}>
                <span>{f.q}</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-a">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
