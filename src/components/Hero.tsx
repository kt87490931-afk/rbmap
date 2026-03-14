import Link from "next/link";
import KoreaNetworkMap from "./KoreaNetworkMap";
import type { Region } from "@/lib/data/regions";

interface HeroData {
  eyebrow?: string;
  h1_line1?: string;
  h1_line2?: string;
  desc_1?: string;
  desc_2?: string;
  kpis?: { num?: string; label?: string }[];
  btns?: { text?: string; href?: string }[];
}

export interface HeroProps {
  data?: HeroData | null;
  visitorCount?: number | null;
  regions?: Region[];
  partnerCounts?: Record<string, { venues?: number; reviews?: number }>;
}

const DEFAULT: HeroData = {
  eyebrow: "Gemini AI · 6시간 자동 업데이트",
  h1_line1: "전국 룸빵 정보,",
  h1_line2: "여기서 다 찾자",
  desc_1: "강남부터 제주까지 — 가라오케·룸싸롱·하이퍼블릭·셔츠룸",
  desc_2: "지역별 검증 정보와 실제 이용 후기를 한눈에",
  kpis: [
    { num: "14", label: "등록 지역" },
    { num: "380+", label: "등록 업소" },
    { num: "3,200+", label: "누적 리뷰" },
    { num: "6H", label: "업데이트" },
  ],
  btns: [
    { text: "🗺️ 지역 선택하기", href: "/regions" },
    { text: "최신 리뷰 →", href: "/reviews" },
  ],
};

export default function Hero({ data, visitorCount, regions = [], partnerCounts }: HeroProps) {
  const d = { ...DEFAULT, ...data };
  const kpis = d.kpis ?? DEFAULT.kpis ?? [];
  const btns = d.btns ?? DEFAULT.btns ?? [];
  const eyebrowText =
    visitorCount != null
      ? `오늘의접속자 : ${visitorCount.toLocaleString()}`
      : (d.eyebrow ?? DEFAULT.eyebrow);
  const showMap = regions.length > 0;

  return (
    <section className={`hero ${showMap ? "hero-with-map" : ""}`}>
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c8a84b" stopOpacity={0.14} />
              <stop offset="55%" stopColor="#c8a84b" stopOpacity={0.03} />
              <stop offset="100%" stopColor="#c8a84b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e6c96e" stopOpacity={0.08} />
              <stop offset="40%" stopColor="#e6c96e" stopOpacity={0.02} />
              <stop offset="100%" stopColor="#e6c96e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points="0,0 600,0 820,600 0,600" fill="url(#wg1)" />
          <polygon points="60,0 520,0 650,600 30,600" fill="url(#wg2)" />
          <line x1="0" y1="0" x2="1100" y2="600" stroke="#e6c96e" strokeWidth={1} strokeOpacity={0.08} />
          <line x1="50" y1="0" x2="1000" y2="600" stroke="#c8a84b" strokeWidth={0.5} strokeOpacity={0.05} />
        </svg>
      </div>
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-badge fade-up">
            <span className="hero-badge-dot" />
            {eyebrowText}
          </div>
          <h1 className="hero-h1 fade-up delay-1">
            {d.h1_line1}
            <span className="gold-line">{d.h1_line2}</span>
          </h1>
          <p className="hero-sub fade-up delay-2">
            {d.desc_1}
            <br />
            {d.desc_2}
          </p>
          <div className="hero-stats fade-up delay-2">
            {kpis.map((k, i) => (
              <div key={i} className="stat-item">
                <div className="stat-num">{k.num}</div>
                <div className="stat-label">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="hero-cta fade-up delay-3">
            {btns.map((b, i) => (
              <Link
                key={i}
                href={b.href ?? (i === 0 ? "/regions" : "/reviews")}
                className={i === 0 ? "btn-primary" : "btn-secondary"}
              >
                {b.text}
              </Link>
            ))}
          </div>
        </div>
        {showMap && (
          <div className="hero-right fade-up delay-2">
            <KoreaNetworkMap regions={regions} partnerCounts={partnerCounts} />
          </div>
        )}
      </div>
    </section>
  );
}
