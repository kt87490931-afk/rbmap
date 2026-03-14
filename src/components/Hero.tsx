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
    { text: "🗺 지역 선택하기", href: "#regions" },
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
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <div className="live-dot" /> {eyebrowText}
          </div>
          <h1>
            {d.h1_line1}
            <br />
            <em>{d.h1_line2}</em>
          </h1>
          <p className="hero-desc">
            {d.desc_1}
            <br />
            {d.desc_2}
          </p>
          <div className="hero-kpi">
            {kpis.map((k, i) => (
              <div key={i} className="hero-kpi-item">
                <strong>{k.num}</strong>
                <span>{k.label}</span>
              </div>
            ))}
          </div>
          <div className="hero-btns">
            {btns.map((b, i) => (
              <Link key={i} href={b.href ?? "#"} className={i === 0 ? "btn-primary" : "btn-ghost"}>
                {b.text}
              </Link>
            ))}
          </div>
        </div>
        {showMap && (
          <div className="hero-right">
            <KoreaNetworkMap regions={regions} partnerCounts={partnerCounts} />
          </div>
        )}
      </div>
    </section>
  );
}
