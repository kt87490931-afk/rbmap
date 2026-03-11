"use client";

import Link from "next/link";

const TIMELINE = [
  { time: "06:00", dot: "on", title: "강남 달토 리뷰 업데이트", desc: "Gemini AI 자동 생성 · 가라오케" },
  { time: "00:00", dot: "on", title: "수원 아우라 심야 후기 게재", desc: "Gemini AI 자동 생성 · 하이퍼블릭" },
  { time: "18:00", dot: "", title: "동탄 신규 업소 3곳 등록", desc: "관리자 직접 등록 · 가라오케·셔츠룸" },
  { time: "12:00", dot: "", title: "제주 TOP5 리뷰 게재", desc: "Gemini AI 자동 생성 · 종합" },
  { time: "06:00", dot: "rd", title: "가격 정보 일괄 업데이트", desc: "전국 4개 지역 평균가 갱신" },
];

const MAP_CELLS = [
  { href: "/gangnam", name: "강남", sub: "서울", on: true, coming: false },
  { href: "/suwon", name: "수원", sub: "경기", on: false, coming: false },
  { href: "/dongtan", name: "동탄", sub: "경기", on: false, coming: false },
  { href: "/incheon", name: "인천", sub: "준비중", on: false, coming: true },
  { href: "/daejeon", name: "대전", sub: "준비중", on: false, coming: true },
  { href: "/daegu", name: "대구", sub: "준비중", on: false, coming: true },
  { href: "/busan", name: "부산", sub: "준비중", on: false, coming: true },
  { href: "/jeju", name: "제주", sub: "제주", on: false, coming: false },
  { href: "/regions", name: "전체", sub: "모든지역", on: false, coming: false },
];

const NOTICES = [
  { badge: "nb-u", text: "<strong>동탄</strong> 신규 업소 3곳 추가 완료", date: "03.11" },
  { badge: "nb-a", text: "<strong>광고 문의</strong> 월 단위 배너 모집 중", date: "03.09" },
  { badge: "nb-n", text: "<strong>인천·부산</strong> 4월 오픈 예정", date: "03.07" },
];

const FAQ_ITEMS = [
  { q: "리뷰는 어떻게 작성되나요?", a: "Gemini AI가 구글 플레이스 데이터를 기반으로 6시간마다 자동 생성합니다." },
  { q: "업소 등록은 어떻게 하나요?", a: "광고 문의 페이지를 통해 등록 신청이 가능합니다. 심사 후 등록됩니다." },
  { q: "가격 정보는 최신인가요?", a: "가격은 주 1회 업데이트되며, 실제 방문 시 변동이 있을 수 있습니다." },
];

export default function WidgetRowB() {
  const toggleFaq = (e: React.MouseEvent<HTMLDivElement>) => {
    (e.currentTarget.parentElement as HTMLElement).classList.toggle("open");
  };

  return (
    <div className="w-row w3" style={{ marginBottom: 44 }}>
      <div className="widget">
        <div className="wt"><span className="wt-icon wi-g">🕐</span>오늘의 업데이트 타임라인</div>
        <div className="timeline">
          {TIMELINE.map((t, i) => (
            <div key={i} className="tl-item">
              <span className="tl-time">{t.time}</span>
              <div className={`tl-dot ${t.dot}`} />
              <div className="tl-content">
                <div className="tl-title">{t.title}</div>
                <div className="tl-desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="widget">
        <div className="wt"><span className="wt-icon wi-b">🗺</span>지역 빠른 이동</div>
        <div className="korea-map">
          {MAP_CELLS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`map-cell ${m.on ? "on" : ""} ${m.coming ? "coming" : ""}`}
            >
              <span className="map-cell-name">{m.name}</span>
              <span className="map-cell-sub">{m.sub}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="widget">
        <div className="wt" style={{ marginBottom: 10 }}><span className="wt-icon wi-gr">📋</span>공지사항</div>
        <div className="notice-list" style={{ marginBottom: 16 }}>
          {NOTICES.map((n, i) => (
            <div key={i} className="notice-item">
              <span className={`nb ${n.badge}`}>{n.badge === "nb-u" ? "업데이트" : n.badge === "nb-a" ? "광고" : "공지"}</span>
              <span className="notice-text" dangerouslySetInnerHTML={{ __html: n.text }} />
              <span className="notice-date">{n.date}</span>
            </div>
          ))}
        </div>
        <div className="wt" style={{ marginBottom: 8 }}><span className="wt-icon wi-g">❓</span>자주 묻는 질문</div>
        <div>
          {FAQ_ITEMS.map((f, i) => (
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
