"use client";

import React from "react";
import Link from "next/link";
import { useState } from "react";

interface SeoData {
  intro_label?: string;
  intro_text?: string;
  cards?: { icon?: string; title?: string; desc?: string }[];
  region_tabs?: { id?: string; label?: string }[];
  region_panels?: Record<string, { title?: string; cols?: { h4?: string; ps?: string[] }[] }>;
  type_cards?: { icon?: string; title?: string; desc?: string; href?: string }[];
  kw_links?: { href?: string; text?: string }[];
}

const DEFAULT_TABS = [
  { id: "tab-gangnam", label: "강남" },
  { id: "tab-suwon", label: "수원 인계동" },
  { id: "tab-dongtan", label: "동탄" },
  { id: "tab-jeju", label: "제주" },
];

const DEFAULT_CARDS = [
  { icon: "🤖", title: "AI 기반 자동 업데이트", desc: "AI가 구글 플레이스 데이터를 분석해 6시간마다 리뷰와 업소 정보를 자동 생성합니다." },
  { icon: "📍", title: "전국 지역별 맞춤 정보", desc: "강남·수원 인계동·동탄·제주를 시작으로 전국 14개 지역으로 확장 중입니다." },
  { icon: "💰", title: "투명한 가격 정보 공개", desc: "지역별·업종별 1인 평균 주대를 주 1회 업데이트합니다." },
];

function parseTitle(s: string): React.ReactNode {
  if (!s) return null;
  const parts = s.split(/_([^_]+)_/g);
  return parts.map((p, i) => (i % 2 === 1 ? <em key={i}>{p}</em> : p));
}

const DEFAULT_PANELS: Record<string, { title: string; cols: { h4: string; ps: string[] }[] }> = {
  "tab-gangnam": {
    title: "강남 _유흥 완전 가이드_ — 가라오케·하이퍼블릭·쩜오",
    cols: [
      {
        h4: "강남 가라오케란?",
        ps: [
          "강남 가라오케는 서울 강남구 역삼동·논현동·청담동 일대에 밀집한 대한민국 최상급 유흥 업소를 통칭합니다. 전국에서 가장 높은 라인업 수준과 서비스 퀄리티를 자랑하며, 국내 유흥 문화의 기준점으로 불립니다. 강남 가라오케의 평균 주대는 1인 기준 50만~70만 원대이며, 프리미엄 하이퍼블릭의 경우 80만 원 이상을 호가합니다.",
          "퍼블릭은 노래를 즐기며 파트너와 함께하는 일반적인 가라오케 형태입니다. 하이퍼블릭은 퍼블릭보다 밀착 서비스가 강화된 프리미엄 형태로 강남에서 가장 수요가 높습니다. 쩜오(0.5)는 하이퍼블릭과 일반 퍼블릭의 중간 단계로 가성비를 추구하는 방문객에게 적합합니다.",
        ],
      },
      {
        h4: "강남 이용 시 주의사항",
        ps: [
          "강남 가라오케는 예약 없이 방문할 경우 대기가 발생할 수 있습니다. 특히 금요일·토요일 저녁 8시 이후는 예약 필수입니다. 담당 실장을 통해 예약하면 룸 배정과 초이스 진행이 훨씬 원활합니다. 또한 강남에서는 정찰제 운영 업소와 흥정 가능한 업소가 혼재하므로, 방문 전 가격 확인이 중요합니다.",
          "평일 오후 9시~자정이 라인업이 가장 풍부하고 대기가 적습니다. 주말은 저녁 7시 이전 조기 방문을 추천합니다. 강남 달토·퍼펙트·인트로 하이퍼블릭이 룸빵여지도 이용자 기준 최고 평점을 기록 중입니다.",
        ],
      },
    ],
  },
  "tab-suwon": {
    title: "수원 인계동 _유흥 완전 가이드_ — 경기도 최대 유흥가",
    cols: [
      {
        h4: "수원 인계동이란?",
        ps: [
          "수원 인계동은 경기도 수원시 팔달구에 위치한 경기도 최대 규모의 유흥 밀집 지역입니다. 강남 수준의 서비스를 30~40% 저렴한 비용으로 이용할 수 있어 수원·안산·화성·오산 등 경기 남부권 전역에서 방문객이 찾아옵니다. 가라오케·하이퍼블릭·셔츠룸·퍼블릭 등 다양한 업종이 밀집해 있어 취향에 맞는 선택이 가능합니다.",
          "수원 인계동 셔츠룸은 파트너가 환복 이벤트를 진행하는 서비스로 인계동의 특화 업종 중 하나입니다. 처음 방문하는 분들도 실장의 친절한 안내로 쉽게 이용할 수 있으며, 평균 주대는 1인 기준 35만~40만 원대입니다.",
        ],
      },
      {
        h4: "인계동 접근성",
        ps: [
          "수원역에서 택시로 10분, 버스로 20분 거리에 위치합니다. 자차 이용 시 인계동 내 대형 유료 주차장이 다수 운영됩니다. 심야 시간에도 수원역까지 택시 이동이 편리하며, KTX 수원역 연계로 서울에서의 당일 방문도 무리가 없습니다.",
          "룸빵여지도 기준 아우라 가라오케(하이퍼블릭), 마징가 가라오케(퍼블릭), 메칸더 셔츠룸이 수원 인계동 최고 평점 업소입니다. 전체 61개 등록 업소 중 이용자 리뷰 평점 4.5 이상인 업소가 18개입니다.",
        ],
      },
    ],
  },
  "tab-dongtan": {
    title: "동탄 _유흥 완전 가이드_ — 신도시 유흥의 빠른 성장",
    cols: [
      {
        h4: "동탄 유흥가 특징",
        ps: [
          "동탄 신도시는 화성시 동탄면 일대에 조성된 대규모 신도시로, 2020년대 이후 유흥 씬이 빠르게 성장하고 있습니다. 수원·평택·오산 등 주변 도시에서의 접근이 용이하며, 신축 건물 위주로 시설이 깨끗하고 현대적입니다. 현재 룸빵여지도에 34개 업소가 등록되어 있으며 계속 증가 중입니다.",
          "동탄 가라오케의 평균 주대는 1인 25만~35만 원으로 강남 대비 절반 수준입니다. 신도시 특성상 경쟁이 치열해 서비스 퀄리티 대비 가격이 합리적인 편입니다. 처음 유흥업소를 방문하는 분들에게 진입 장벽이 낮아 추천하기 좋은 지역입니다.",
        ],
      },
      {
        h4: "동탄 이용 팁",
        ps: [
          "동탄은 자차 방문이 압도적으로 많습니다. 주요 업소 대부분이 넓은 전용 주차장 또는 발렛 서비스를 운영합니다. 심야 대중교통이 제한적이므로 대리운전을 미리 준비하는 것을 권장합니다. 동탄 2신도시 지역은 아직 개발 중인 곳이 많으므로 방문 전 정확한 위치 확인이 필요합니다.",
          "비너스 셔츠룸이 동탄 압도적 1위입니다. 오로라 가라오케, 스타 퍼블릭이 뒤를 잇습니다. 룸빵여지도는 동탄 지역 신규 업소를 매월 지속 추가 중입니다.",
        ],
      },
    ],
  },
  "tab-jeju": {
    title: "제주 _유흥 완전 가이드_ — 관광지 특성의 독특한 유흥 문화",
    cols: [
      {
        h4: "제주 유흥의 특징",
        ps: [
          "제주 가라오케·룸싸롱은 관광지 특성상 육지와는 다른 분위기를 가집니다. 제주 연동·노형동 일대에 주요 업소가 밀집해 있으며, 렌터카 없이도 이용 가능한 위치의 업소가 많습니다. 관광객 친화적 서비스를 제공하는 업소가 많아 처음 제주를 방문하는 분들도 편하게 이용할 수 있습니다.",
          "제주 가라오케의 평균 주대는 1인 25만~35만 원대로 서울 강남 대비 저렴합니다. 단, 관광 성수기(7~8월, 연휴)에는 라인업이 감소하고 가격이 상승하는 경향이 있습니다. 비성수기 방문이 가격과 서비스 모두에서 유리합니다.",
        ],
      },
      {
        h4: "제주 방문 시 주의사항",
        ps: [
          "제주는 섬 특성상 전국에서 원정 방문하는 파트너가 많습니다. 시즌에 따라 라인업 수준의 편차가 큰 편이므로, 방문 전 룸빵여지도의 최신 리뷰를 확인하는 것을 강력히 추천합니다. 일부 업소는 사전 예약 시 공항 픽업 서비스를 제공합니다.",
          "제니스 클럽이 제주 최고 평점 업소입니다. 오션뷰 가라오케는 제주 야경을 감상하며 이용할 수 있는 뷰 맛집으로 유명합니다. 룸빵여지도에 28개 업소가 등록되어 있으며 계속 확장 중입니다.",
        ],
      },
    ],
  },
};

const DEFAULT_TYPE_CARDS = [
  { icon: "🎤", title: "가라오케", desc: "노래방 형태의 룸에서 파트너와 함께 즐기는 가장 보편적인 업종입니다. 전국 168개 업소 등록.", href: "/category/karaoke" },
  { icon: "💎", title: "하이퍼블릭", desc: "퍼블릭보다 밀착 서비스가 강화된 프리미엄 형태입니다. 전국 72개 업소 등록.", href: "/category/highpublic" },
  { icon: "👔", title: "셔츠룸", desc: "파트너의 환복 이벤트가 포함된 서비스입니다. 전국 54개 업소 등록.", href: "/category/shirtroom" },
  { icon: "⭐", title: "쩜오 (0.5)", desc: "하이퍼블릭과 퍼블릭의 중간 단계 서비스입니다. 전국 31개 업소 등록.", href: "/category/jjomoh" },
];

const DEFAULT_KW_LINKS = [
  { href: "/gangnam/category/karaoke", text: "강남 가라오케" },
  { href: "/gangnam/category/highpublic", text: "강남 하이퍼블릭" },
  { href: "/gangnam/category/jjomoh", text: "강남 쩜오" },
  { href: "/suwon/category/karaoke", text: "수원 가라오케" },
  { href: "/suwon/category/highpublic", text: "수원 하이퍼블릭" },
  { href: "/suwon/category/shirtroom", text: "수원 셔츠룸" },
  { href: "/suwon/category/karaoke", text: "인계동 가라오케" },
  { href: "/suwon/category/highpublic", text: "인계동 하이퍼블릭" },
  { href: "/dongtan/category/karaoke", text: "동탄 가라오케" },
  { href: "/dongtan/category/shirtroom", text: "동탄 셔츠룸" },
  { href: "/dongtan/category/public", text: "동탄 퍼블릭" },
  { href: "/jeju/category/karaoke", text: "제주 가라오케" },
  { href: "/jeju/category/karaoke", text: "제주 룸싸롱" },
  { href: "/gangnam/venue/dalto", text: "강남 달토 가라오케" },
  { href: "/suwon/venue/aura", text: "수원 아우라 가라오케" },
  { href: "/suwon/venue/aura", text: "인계동 아우라" },
  { href: "/dongtan/venue/venus", text: "동탄 비너스 셔츠룸" },
  { href: "/jeju/venue/zenith", text: "제주 제니스 클럽" },
  { href: "/category/karaoke", text: "전국 가라오케 추천" },
  { href: "/category/highpublic", text: "전국 하이퍼블릭 추천" },
  { href: "/guide", text: "유흥 이용 가이드" },
  { href: "/ranking", text: "전국 업소 랭킹" },
  { href: "/reviews", text: "가라오케 후기" },
  { href: "/reviews", text: "룸싸롱 후기" },
];

export default function SeoSection({ data }: { data?: SeoData | null }) {
  const [activeTab, setActiveTab] = useState("tab-gangnam");
  const regionTabs = data?.region_tabs?.length ? data.region_tabs : DEFAULT_TABS;
  const cards = data?.cards?.length ? data.cards : DEFAULT_CARDS;
  const typeCards = data?.type_cards?.length ? data.type_cards : DEFAULT_TYPE_CARDS;
  const kwLinks = data?.kw_links?.length ? data.kw_links : DEFAULT_KW_LINKS;
  const regionPanels = { ...DEFAULT_PANELS, ...(data?.region_panels ?? {}) };

  return (
    <section className="seo-section section" aria-label="룸빵여지도 소개">
      <div className="page-wrap">
        <div className="seo-intro">
          <p className="sec-label" style={{ marginBottom: 8 }}>{data?.intro_label ?? "ABOUT 룸빵여지도"}</p>
          <p className="seo-intro-text" dangerouslySetInnerHTML={{ __html: data?.intro_text ?? "<strong>룸빵여지도</strong>는 강남·수원·동탄·제주 등 전국 주요 지역의 <strong>가라오케·룸싸롱·하이퍼블릭·셔츠룸·퍼블릭</strong> 정보를 한눈에 비교할 수 있는 국내 최대 유흥 정보 허브입니다. AI가 Google Places 데이터를 기반으로 <strong>6시간마다 자동 업데이트</strong>하여 항상 가장 최신의 정보를 제공합니다." }} />
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

        <div style={{ marginBottom: 48 }}>
          <p className="sec-label" style={{ marginBottom: 10 }}>REGION GUIDE</p>
          <h2 className="sec-title" style={{ marginBottom: 20 }}>지역별 <span>완전 가이드</span></h2>

          <div className="seo-region-tabs" role="tablist">
            {regionTabs.map((t) => (
              <button
                key={t.id}
                className={`seo-rtab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id ?? "tab-gangnam")}
                role="tab"
              >
                {t.label}
              </button>
            ))}
          </div>

          {regionTabs.map((t) => {
            const panel = regionPanels[t.id ?? ""];
            if (!panel) return null;
            const cols = panel.cols ?? [];
            return (
              <div
                key={t.id ?? ""}
                className={`seo-region-panel ${activeTab === t.id ? "active" : ""}`}
                id={t.id ?? ""}
                role="tabpanel"
              >
                <h3>{parseTitle(panel.title ?? "")}</h3>
                {cols.map((col, i) => (
                  <div key={i} className="seo-region-col">
                    <h4>{col.h4}</h4>
                    {(col.ps ?? []).map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div>
          <p className="sec-label" style={{ marginBottom: 6 }}>CATEGORY GUIDE</p>
          <h2 className="sec-title" style={{ marginBottom: 16 }}>업종별 <span>완전 이해</span></h2>
          <div className="seo-type-grid">
            {typeCards.map((tc, i) => (
              <div key={tc.title ?? i} className="seo-type-card">
                <h4>{tc.icon} {tc.title}</h4>
                <p>{tc.desc}</p>
                <Link href={tc.href ?? "#"}>{tc.title} 업소 보기 →</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="seo-kw-block">
          <h3>관련 검색어 및 지역별 정보</h3>
          <div className="seo-kw-links">
            {kwLinks.map((k, i) => (
              <Link key={i} href={k.href ?? "#"} className="seo-kw-link">{k.text}</Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
