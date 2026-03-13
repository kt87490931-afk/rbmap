"use client";

import { useCallback, useEffect } from "react";

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
    tagline?: string;
    introLabel?: string;
    introHeadline?: string;
    introLead?: string;
    introQuote?: string;
    introBodyParagraphs?: string[];
    introTitle: string;
    introParagraphs: string[];
    priceLead?: string;
    priceNote?: string;
    mapEmbed?: string;
    infoCards: { label: string; val: string; sub: string }[];
  };
};

function setEl(id: string | null, content: string, useInnerHtml = false) {
  const el = id ? document.getElementById(id) : null;
  if (el) {
    if (useInnerHtml) el.innerHTML = content;
    else el.textContent = content;
  }
}

export function VenueEditModals({ data }: VenueEditModalsProps) {
  const closeModal = useCallback((id: string) => {
    const el = document.getElementById("modal-" + id);
    if (el) {
      el.classList.remove("open");
      document.body.style.overflow = "";
    }
  }, []);

  const handleSaveHero = useCallback(() => {
    const name = (document.getElementById("m-name") as HTMLInputElement)?.value ?? "";
    const tagline = (document.getElementById("m-tagline") as HTMLInputElement)?.value ?? "";
    const phone = (document.getElementById("m-phone") as HTMLInputElement)?.value ?? "";
    const hours = (document.getElementById("m-hours") as HTMLInputElement)?.value ?? "";
    const price = (document.getElementById("m-price") as HTMLInputElement)?.value ?? "";
    const lineup = (document.getElementById("m-lineup") as HTMLInputElement)?.value ?? "";
    const parking = (document.getElementById("m-parking") as HTMLInputElement)?.value ?? "";
    setEl("d-name", name);
    setEl("d-tagline", tagline);
    setEl("d-phone", phone);
    setEl("d-phone-sub", `${hours} · 전화·카카오 예약 가능`);
    const link = document.getElementById("d-phone-link") as HTMLAnchorElement;
    if (link) link.href = `tel:${phone.replace(/\D/g, "")}`;
    setEl("d-price", price);
    setEl("d-lineup", lineup);
    setEl("d-hours", hours);
    setEl("d-parking", parking);
    closeModal("hero");
  }, [closeModal]);

  const handleSaveIntro = useCallback(() => {
    const headlineRaw = (document.getElementById("m-intro-headline") as HTMLInputElement)?.value ?? "";
    const lead = (document.getElementById("m-intro-lead") as HTMLTextAreaElement)?.value ?? "";
    const quote = (document.getElementById("m-intro-quote") as HTMLTextAreaElement)?.value?.trim() ?? "";
    const bodyText = (document.getElementById("m-intro-body") as HTMLTextAreaElement)?.value ?? "";
    const bodyParagraphs = bodyText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const parts = headlineRaw.split("—");
    const headlineHtml = parts.length > 1 ? `${parts[0].trim()} — <em>${parts[1].trim()}</em>` : headlineRaw;
    setEl("intro-headline", headlineHtml, true);
    const leadEl = document.getElementById("intro-lead");
    if (leadEl) {
      leadEl.textContent = lead;
      (leadEl as HTMLElement).style.display = lead ? "block" : "none";
    } else if (lead) {
      const h2 = document.getElementById("intro-headline");
      if (h2) {
        const p = document.createElement("p");
        p.id = "intro-lead";
        p.className = "art-lead";
        p.textContent = lead;
        h2.after(p);
      }
    }
    const introBody = document.getElementById("intro-body");
    if (introBody) {
      introBody.querySelector(".art-quote")?.remove();
      introBody.querySelectorAll(".art-p").forEach((p) => p.remove());
      if (quote) {
        const div = document.createElement("div");
        div.className = "art-quote";
        const p = document.createElement("p");
        p.textContent = quote;
        div.appendChild(p);
        introBody.appendChild(div);
      }
      bodyParagraphs.forEach((txt) => {
        const p = document.createElement("p");
        p.className = "art-p";
        p.innerHTML = txt.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
        introBody.appendChild(p);
      });
    }
    closeModal("intro");
  }, [closeModal]);

  const handleSavePrice = useCallback(() => {
    const lead = (document.getElementById("m-price-lead") as HTMLTextAreaElement)?.value ?? "";
    const note = (document.getElementById("m-price-note") as HTMLTextAreaElement)?.value ?? "";
    const leadEl = document.getElementById("price-lead");
    if (leadEl) {
      leadEl.textContent = lead;
      (leadEl as HTMLElement).style.display = lead ? "block" : "none";
    }
    const noteEl = document.getElementById("price-note");
    if (noteEl) {
      noteEl.innerHTML = note.split("\n").join("<br />");
      (noteEl as HTMLElement).style.display = note ? "block" : "none";
    } else if (note) {
      const wrap = document.getElementById("price-table-wrap");
      if (wrap) {
        const p = document.createElement("p");
        p.id = "price-note";
        p.className = "price-note";
        p.innerHTML = note.split("\n").join("<br />");
        wrap.appendChild(p);
      }
    }
    closeModal("price");
  }, [closeModal]);

  const handleSaveMap = useCallback(() => {
    const url = (document.getElementById("m-map-url") as HTMLTextAreaElement)?.value?.trim() ?? "";
    const address = (document.getElementById("m-address") as HTMLInputElement)?.value ?? "";
    const addressSub = (document.getElementById("m-address-sub") as HTMLInputElement)?.value ?? "";
    setEl("d-address", address);
    const subEl = document.getElementById("d-address-sub");
    if (addressSub && subEl) subEl.textContent = addressSub;
    else if (addressSub && !subEl) {
      const bar = document.querySelector(".map-address-bar div");
      if (bar) {
        const div = document.createElement("div");
        div.id = "d-address-sub";
        div.className = "ma-sub";
        div.textContent = addressSub;
        bar.appendChild(div);
      }
    } else if (subEl) subEl.textContent = "";
    const wrap = document.querySelector(".map-wrap");
    if (wrap) {
      if (url) {
        wrap.innerHTML = `<iframe src="${url.replace(/"/g, "&quot;")}" title="지도" style="width:100%;height:100%;border:none"></iframe>`;
      } else {
        wrap.innerHTML = `<div class="map-placeholder"><span>🗺</span><p style="font-size: 12px; color: var(--muted); text-align: center">구글맵 연동 예정<br /><span style="font-size: 10px; color: var(--dim)">${address || "주소 입력"}</span></p></div>`;
      }
    }
    closeModal("map");
  }, [closeModal]);

  useEffect(() => {
    const openModal = (id: string) => {
      const el = document.getElementById("modal-" + id);
      if (el) {
        el.classList.add("open");
        document.body.style.overflow = "hidden";
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
  }, [closeModal]);

  if (!data) return null;
  const safe = {
    contact: data.contact ?? "",
    hours: data.hours ?? "",
    priceNote: data.priceNote ?? "",
  };
  const firstPrice = data?.infoCards?.find((c) => c?.val?.includes("만"))?.val ?? "55만원~";
  const lineup = data.infoCards?.find((c) => c.label?.includes("라인") || c.label?.includes("룸"))?.val ?? "50명+";
  const parking = data.infoCards?.find((c) => c.label?.includes("주차"))?.val ?? "발렛";
  const tagline = data.tagline ?? data.introTitle ?? "";
  const introHeadline = data.introHeadline ?? `${data.name} — 소개`;
  const introLead = data.introLead ?? (data.introParagraphs ?? [])[0] ?? "";
  const introQuote = data.introQuote ?? "";
  const introBody = (data.introBodyParagraphs ?? (data.introParagraphs ?? []).slice(1)).join("\n\n") || "입장부터 퇴장까지 1:1 전담 실장이 밀착 관리합니다.";
  const priceLead = data.priceLead ?? "달토는 입장 전 가격을 명확히 안내하며, 안내받은 금액 그대로 결제됩니다.";

  return (
    <>
      {/* 히어로 모달 */}
      <div className="modal-backdrop" id="modal-hero">
        <div className="modal" onClick={(e) => e.stopPropagation()}>
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
              <input type="text" id="m-tagline" defaultValue={tagline} placeholder="강남 가라오케의 기준 — 20년 업력이 만든 신뢰" />
            </div>
            <div className="mf-row">
              <label>전화번호</label>
              <input type="tel" id="m-phone" defaultValue={safe.contact} />
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
              <input type="text" id="m-hours" defaultValue={safe.hours} />
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
            <button type="button" className="mf-save" onClick={handleSaveHero}>
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 업소 소개 모달 */}
      <div className="modal-backdrop" id="modal-intro">
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h3>편집 업소 소개</h3>
            <button type="button" className="modal-close" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("intro")}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="mf-row">
              <label>소개 헤드라인 (h2) — em dash 뒷부분 골드 강조</label>
              <input type="text" id="m-intro-headline" defaultValue={introHeadline} placeholder="업소명 — 강남 가라오케의 새로운 기준" />
            </div>
            <div className="mf-row">
              <label>리드 문장 (#intro-lead)</label>
              <textarea id="m-intro-lead" rows={3} defaultValue={introLead} placeholder="핵심 요약 문장" />
            </div>
            <div className="mf-row">
              <label>인용 박스 (.art-quote)</label>
              <textarea id="m-intro-quote" rows={2} defaultValue={introQuote} placeholder="강조할 문장 (선택)" />
            </div>
            <div className="mf-row">
              <label>본문 단락들 (단락 구분: 빈 줄)</label>
              <textarea id="m-intro-body" rows={8} defaultValue={introBody} placeholder="AI 생성 텍스트를 붙여넣거나 직접 작성하세요." />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="mf-cancel" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("intro")}>
              취소
            </button>
            <button type="button" className="mf-save" onClick={handleSaveIntro}>
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 가격 모달 */}
      <div className="modal-backdrop" id="modal-price">
        <div className="modal" onClick={(e) => e.stopPropagation()}>
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
              <textarea id="m-price-note" rows={3} defaultValue={safe.priceNote} />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="mf-cancel" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("price")}>
              취소
            </button>
            <button type="button" className="mf-save" onClick={handleSavePrice}>
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 지도 모달 */}
      <div className="modal-backdrop" id="modal-map">
        <div className="modal" onClick={(e) => e.stopPropagation()}>
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
            <button type="button" className="mf-save" onClick={handleSaveMap}>
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 리뷰 모달 */}
      <div className="modal-backdrop" id="modal-reviews">
        <div className="modal" onClick={(e) => e.stopPropagation()}>
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
        <div className="modal" onClick={(e) => e.stopPropagation()}>
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
