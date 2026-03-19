"use client";

import { useState } from "react";
import SectionFormEditor from "./admin/SectionFormEditor";

interface FaqItem {
  q: string;
  a: string;
}

const DEFAULT_FAQ: FaqItem[] = [
  { q: "리뷰는 어떻게 작성되나요?", a: "AI가 구글 플레이스 데이터를 기반으로 6시간마다 자동 생성합니다." },
  { q: "업소 등록은 어떻게 하나요?", a: "광고 문의 페이지를 통해 등록 신청이 가능합니다. 심사 후 등록됩니다." },
  { q: "가격 정보는 최신인가요?", a: "가격은 주 1회 업데이트되며, 실제 방문 시 변동이 있을 수 있습니다." },
];

interface FaqSectionProps {
  items?: FaqItem[];
  /** 제목 옆 톱니바퀴 표시 여부 (true이거나 생략 시 표시 — 클릭 시 FAQ 편집 모달, 저장은 관리자만 가능) */
  isAdmin?: boolean;
}

export default function FaqSection({ items = DEFAULT_FAQ, isAdmin = true }: FaqSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const list = items.length > 0 ? items : DEFAULT_FAQ;
  const toggle = (el: HTMLElement | null) => {
    if (el) el.classList.toggle("open");
  };

  return (
    <section className="faq-section section" aria-label="자주 묻는 질문">
      <div className="section-inner">
        <span className="section-label">FAQ</span>
        <h2 className="section-h2" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          자주 묻는 <em>질문</em>
          {
            <button
              type="button"
              aria-label="FAQ 설정"
              onClick={() => setModalOpen(true)}
              className="section-settings-trigger"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(0,0,0,0.4)",
                color: "#fff",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              ⚙
            </button>
          }
        </h2>
        {modalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ background: "var(--bg, #1a1a1a)", borderRadius: 12, maxWidth: 680, width: "95%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()}>
              <SectionFormEditor sectionKey="faq" sectionLabel="자주 묻는 질문 (FAQ)" onClose={() => setModalOpen(false)} />
            </div>
          </div>
        )}
        <div className="faq-list">
          {list.map((f, i) => (
            <div key={i} className="faq-item">
              <div
                className="faq-q"
                onClick={(e) => toggle((e.currentTarget as HTMLElement).parentElement)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && toggle((e.currentTarget as HTMLElement).parentElement)}
              >
                <span>{f.q}</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-a">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
