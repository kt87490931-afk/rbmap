"use client";

import { useEffect } from "react";

type VenueEditModalsProps = {
  data: {
    name: string;
    region: string;
    type: string;
    contact: string;
    location: string;
    locationDetail?: string;
    locationSub?: string;
    hours: string;
    introTitle: string;
    introParagraphs: string[];
    priceNote: string;
    mapEmbed?: string;
    infoCards: { label: string; val: string; sub: string }[];
  };
};

export function VenueEditModals({ data }: VenueEditModalsProps) {
  useEffect(() => {
    const openModal = (id: string) => {
      const el = document.getElementById("modal-" + id);
      if (el) {
        el.classList.add("open");
        document.body.style.overflow = "hidden";
      }
    };
    const closeModal = (id: string) => {
      const el = document.getElementById("modal-" + id);
      if (el) {
        el.classList.remove("open");
        document.body.style.overflow = "";
      }
    };
    (window as unknown as { openModal: (id: string) => void }).openModal = openModal;
    (window as unknown as { closeModal: (id: string) => void }).closeModal = closeModal;
    document.querySelectorAll(".modal-backdrop").forEach((bd) => {
      bd.addEventListener("click", (e) => {
        if (e.target === bd) {
          bd.classList.remove("open");
          document.body.style.overflow = "";
        }
      });
    });
    return () => {
      delete (window as unknown as { openModal?: (id: string) => void }).openModal;
      delete (window as unknown as { closeModal?: (id: string) => void }).closeModal;
    };
  }, []);

  const firstPrice = data.infoCards?.find((c) => c.val?.includes("만"))?.val ?? "55만원~";
  const lineup = data.infoCards?.find((c) => c.label?.includes("라인") || c.label?.includes("룸"))?.val ?? "50명+";
  const parking = data.infoCards?.find((c) => c.label?.includes("주차"))?.val ?? "발렛";
  const introLead = (data.introParagraphs ?? [])[0] ?? "";
  const introBody = (data.introParagraphs ?? []).slice(1).join("\n\n") || "입장부터 퇴장까지 1:1 전담 실장이 밀착 관리합니다.";
  const priceLead = "달토는 입장 전 가격을 명확히 안내하며, 안내받은 금액 그대로 결제됩니다.";

  return (
    <>
      {/* 히어로 모달 */}
      <div className="modal-backdrop" id="modal-hero">
        <div className="modal">
          <div className="modal-head">
            <h3>편집 히어로 배너</h3>
            <button type="button" className="modal-close" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("hero")}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="mf-row">
              <label>업소명</label>
              <input type="text" id="m-name" defaultValue={data.name} />
            </div>
            <div className="mf-row">
              <label>부제목 (tagline)</label>
              <input type="text" id="m-tagline" defaultValue={data.introTitle} />
            </div>
            <div className="mf-row">
              <label>전화번호</label>
              <input type="tel" id="m-phone" defaultValue={data.contact} />
            </div>
            <div className="mf-row">
              <label>1인 주대</label>
              <input type="text" id="m-price" defaultValue={firstPrice} />
            </div>
            <div className="mf-row">
              <label>라인업</label>
              <input type="text" id="m-lineup" defaultValue={lineup} />
            </div>
            <div className="mf-row">
              <label>영업시간</label>
              <input type="text" id="m-hours" defaultValue={data.hours} />
            </div>
            <div className="mf-row">
              <label>주차</label>
              <input type="text" id="m-parking" defaultValue={parking} />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="mf-cancel" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("hero")}>
              취소
            </button>
            <button type="button" className="mf-save" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("hero")}>
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 업소 소개 모달 */}
      <div className="modal-backdrop" id="modal-intro">
        <div className="modal">
          <div className="modal-head">
            <h3>편집 업소 소개</h3>
            <button type="button" className="modal-close" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("intro")}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="mf-row">
              <label>소개 헤드라인 (h2)</label>
              <input type="text" id="m-intro-headline" defaultValue={`${data.name} — 소개`} />
            </div>
            <div className="mf-row">
              <label>리드 문장</label>
              <textarea id="m-intro-lead" rows={3} defaultValue={introLead} />
            </div>
            <div className="mf-row">
              <label>본문 (단락 구분: 빈 줄)</label>
              <textarea id="m-intro-body" rows={8} defaultValue={introBody} placeholder="AI 생성 텍스트를 붙여넣거나 직접 작성하세요." />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="mf-cancel" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("intro")}>
              취소
            </button>
            <button type="button" className="mf-save" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("intro")}>
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 가격 모달 */}
      <div className="modal-backdrop" id="modal-price">
        <div className="modal">
          <div className="modal-head">
            <h3>편집 가격 정보</h3>
            <button type="button" className="modal-close" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("price")}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="mf-row">
              <label>리드 문장</label>
              <textarea id="m-price-lead" rows={2} defaultValue={priceLead} />
            </div>
            <div className="mf-row">
              <label>주의사항 (하단 노트)</label>
              <textarea id="m-price-note" rows={3} defaultValue={data.priceNote || ""} />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="mf-cancel" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("price")}>
              취소
            </button>
            <button type="button" className="mf-save" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("price")}>
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 지도 모달 */}
      <div className="modal-backdrop" id="modal-map">
        <div className="modal">
          <div className="modal-head">
            <h3>편집 위치·지도</h3>
            <button type="button" className="modal-close" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("map")}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="mf-row">
              <label>구글맵 Embed URL</label>
              <textarea id="m-map-url" rows={3} defaultValue={data.mapEmbed || ""} placeholder="https://www.google.com/maps/embed?pb=..." />
            </div>
            <div className="mf-row">
              <label>주소</label>
              <input type="text" id="m-address" defaultValue={data.locationDetail || data.location} />
            </div>
            <div className="mf-row">
              <label>오시는 길 (서브텍스트)</label>
              <input type="text" id="m-address-sub" defaultValue={data.locationSub || ""} />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="mf-cancel" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("map")}>
              취소
            </button>
            <button type="button" className="mf-save" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("map")}>
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 리뷰 모달 */}
      <div className="modal-backdrop" id="modal-reviews">
        <div className="modal">
          <div className="modal-head">
            <h3>편집 리뷰 섹션</h3>
            <button type="button" className="modal-close" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("reviews")}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 8, lineHeight: 1.7 }}>
              리뷰 카드는 Supabase DB에서 자동으로 가져옵니다. 개별 리뷰는 어드민 리뷰 작성 페이지에서 관리하세요.
            </p>
          </div>
          <div className="modal-foot">
            <button type="button" className="mf-cancel" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("reviews")}>
              취소
            </button>
            <button type="button" className="mf-save" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("reviews")}>
              확인
            </button>
          </div>
        </div>
      </div>

      {/* 유사 업소 모달 */}
      <div className="modal-backdrop" id="modal-similar">
        <div className="modal">
          <div className="modal-head">
            <h3>편집 유사 업소</h3>
            <button type="button" className="modal-close" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("similar")}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: 12, color: "var(--dim)", marginTop: 8, lineHeight: 1.7 }}>
              유사 업소 카드는 같은 지역·업종의 업소 중 자동으로 추천됩니다.
            </p>
          </div>
          <div className="modal-foot">
            <button type="button" className="mf-cancel" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("similar")}>
              취소
            </button>
            <button type="button" className="mf-save" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("similar")}>
              확인
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
