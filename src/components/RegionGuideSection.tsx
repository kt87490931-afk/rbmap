"use client";

import React, { useState } from "react";

interface RegionGuideData {
  region_tabs?: { id?: string; label?: string }[];
  region_panels?: Record<string, { title?: string; cols?: { h4?: string; ps?: string[] }[] }>;
}

const DEFAULT_TABS = [
  { id: "tab-gangnam", label: "강남" },
  { id: "tab-suwon", label: "수원 인계동" },
  { id: "tab-dongtan", label: "동탄" },
  { id: "tab-jeju", label: "제주" },
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
      { h4: "강남 가라오케란?", ps: ["강남 가라오케는 서울 강남구 역삼동·논현동·청담동 일대에 밀집한 대한민국 최상급 유흥 업소를 통칭합니다. 전국에서 가장 높은 라인업 수준과 서비스 퀄리티를 자랑합니다.", "퍼블릭은 노래를 즐기며 파트너와 함께하는 일반적인 가라오케 형태입니다. 하이퍼블릭은 밀착 서비스가 강화된 프리미엄 형태입니다."] },
      { h4: "강남 이용 시 주의사항", ps: ["예약 없이 방문할 경우 대기가 발생할 수 있습니다. 금요일·토요일 저녁 8시 이후는 예약 필수입니다."] },
    ],
  },
  "tab-suwon": {
    title: "수원 인계동 _유흥 완전 가이드_ — 경기도 최대 유흥가",
    cols: [
      { h4: "수원 인계동이란?", ps: ["수원 인계동은 경기도 최대 규모의 유흥 밀집 지역입니다. 강남 수준의 서비스를 30~40% 저렴한 비용으로 이용할 수 있습니다."] },
      { h4: "인계동 접근성", ps: ["수원역에서 택시로 10분, 버스로 20분 거리입니다."] },
    ],
  },
  "tab-dongtan": {
    title: "동탄 _유흥 완전 가이드_ — 신도시 유흥의 빠른 성장",
    cols: [
      { h4: "동탄 유흥가 특징", ps: ["동탄 신도시는 화성시 동탄면 일대에 조성된 대규모 신도시로, 유흥 씬이 빠르게 성장하고 있습니다."] },
      { h4: "동탄 이용 팁", ps: ["자차 방문이 압도적으로 많습니다. 주요 업소 대부분이 넓은 전용 주차장을 운영합니다."] },
    ],
  },
  "tab-jeju": {
    title: "제주 _유흥 완전 가이드_ — 관광지 특성의 독특한 유흥 문화",
    cols: [
      { h4: "제주 유흥의 특징", ps: ["제주 가라오케·룸싸롱은 관광지 특성상 육지와는 다른 분위기를 가집니다."] },
      { h4: "제주 방문 시 주의사항", ps: ["시즌에 따라 라인업 수준의 편차가 큽니다. 방문 전 최신 리뷰 확인을 추천합니다."] },
    ],
  },
};

export default function RegionGuideSection({ data }: { data?: RegionGuideData | null }) {
  const [activeTab, setActiveTab] = useState("tab-gangnam");
  const regionTabs = data?.region_tabs?.length ? data.region_tabs : DEFAULT_TABS;
  const regionPanels = { ...DEFAULT_PANELS, ...(data?.region_panels ?? {}) };

  return (
    <section className="seo-section section" aria-label="지역별 완전 가이드">
      <div className="page-wrap">
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
      </div>
    </section>
  );
}
