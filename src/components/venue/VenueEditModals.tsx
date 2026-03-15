"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

type PriceRow = { name: string; desc: string; duration: string; price: string; badge?: "recommend" | "popular" };

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

type VenueEditModalsProps = {
  regionSlug: string;
  categorySlug: string;
  venueSlug: string;
  data: {
    name: string;
    region: string;
    type: string;
    contact: string;
    kakaoUrl?: string;
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
    priceRows?: PriceRow[];
    mapEmbed?: string;
    infoCards: { label: string; val: string; sub: string }[];
    seoCols?: { blocks: { type: "h3" | "p"; content: string }[] }[];
    seoKwLinks?: { href: string; text: string }[];
  };
};

function setEl(id: string | null, content: string, useInnerHtml = false) {
  const el = id ? document.getElementById(id) : null;
  if (el) {
    if (useInnerHtml) el.innerHTML = content;
    else el.textContent = content;
  }
}

async function saveEdit(
  regionSlug: string,
  categorySlug: string,
  venueSlug: string,
  section: "hero" | "price" | "intro" | "map" | "seo",
  payload: Record<string, unknown>
): Promise<boolean> {
  const res = await fetch("/api/admin/venues/edit", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      region_slug: regionSlug,
      category_slug: categorySlug,
      venue_slug: venueSlug,
      section,
      payload,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err?.error || `저장 실패 (${res.status})`);
    return false;
  }
  return true;
}

export function VenueEditModals({ regionSlug, categorySlug, venueSlug, data }: VenueEditModalsProps) {
  const router = useRouter();
  const closeModal = useCallback((id: string) => {
    const el = document.getElementById("modal-" + id);
    if (el) {
      el.classList.remove("open");
      document.body.style.overflow = "";
    }
  }, []);

  const setDataEdit = useCallback((key: string, content: string) => {
    document.querySelectorAll(`[data-edit="${key}"]`).forEach((el) => { el.textContent = content; });
  }, []);

  const handleSaveHero = useCallback(async () => {
    const name = (document.getElementById("m-name") as HTMLInputElement)?.value ?? "";
    const tagline = (document.getElementById("m-tagline") as HTMLInputElement)?.value ?? "";
    const phone = (document.getElementById("m-phone") as HTMLInputElement)?.value ?? "";
    const hours = (document.getElementById("m-hours") as HTMLInputElement)?.value ?? "";
    const price = (document.getElementById("m-price") as HTMLInputElement)?.value ?? "";
    const lineup = (document.getElementById("m-lineup") as HTMLInputElement)?.value ?? "";
    const parking = (document.getElementById("m-parking") as HTMLInputElement)?.value ?? "";
    const base = data.infoCards ?? [];
    const infoCards = [
      { ...(base[0] ?? { label: "1인 주대", sub: "" }), val: price },
      { ...(base[1] ?? { label: "라인업", sub: "" }), val: lineup },
      { ...(base[2] ?? { label: "영업시간", sub: "" }), val: hours },
      { ...(base[3] ?? { label: "주차", sub: "" }), val: parking },
      ...base.slice(4),
    ];
    const ok = await saveEdit(regionSlug, categorySlug, venueSlug, "hero", {
      name, tagline, contact: phone, hours, infoCards,
    });
    if (!ok) return;
    setEl("d-name", name);
    setEl("d-tagline", tagline);
    setEl("d-phone", phone);
    setEl("d-phone-sub", `${hours} · 전화·문자 예약 가능`);
    const link = document.getElementById("d-phone-link") as HTMLAnchorElement;
    if (link) link.href = `tel:${phone.replace(/\D/g, "")}`;
    setDataEdit("price", price);
    setDataEdit("lineup", lineup);
    setDataEdit("hours", hours);
    setDataEdit("parking", parking);
    closeModal("hero");
    router.refresh();
  }, [closeModal, setDataEdit, regionSlug, categorySlug, venueSlug, data.infoCards, router]);

  const handleSaveIntro = useCallback(async () => {
    const headlineRaw = (document.getElementById("m-intro-headline") as HTMLInputElement)?.value ?? "";
    const lead = (document.getElementById("m-intro-lead") as HTMLTextAreaElement)?.value ?? "";
    const quote = (document.getElementById("m-intro-quote") as HTMLTextAreaElement)?.value?.trim() ?? "";
    const bodyText = (document.getElementById("m-intro-body") as HTMLTextAreaElement)?.value ?? "";
    const bodyParagraphs = bodyText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const ok = await saveEdit(regionSlug, categorySlug, venueSlug, "intro", {
      headline: headlineRaw, lead, quote, bodyParagraphs,
    });
    if (!ok) return;
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
    router.refresh();
  }, [closeModal, regionSlug, categorySlug, venueSlug, router]);

  const handleSavePrice = useCallback(async () => {
    const lead = (document.getElementById("m-price-lead") as HTMLTextAreaElement)?.value ?? "";
    const note = (document.getElementById("m-price-note") as HTMLTextAreaElement)?.value ?? "";
    const rows: PriceRow[] = [];
    for (let i = 0; i < 4; i++) {
      const name = (document.getElementById(`m-price-row-${i}-name`) as HTMLInputElement)?.value?.trim();
      if (!name) continue;
      const desc = (document.getElementById(`m-price-row-${i}-desc`) as HTMLInputElement)?.value?.trim() ?? "";
      const duration = (document.getElementById(`m-price-row-${i}-duration`) as HTMLInputElement)?.value?.trim() ?? "";
      const price = (document.getElementById(`m-price-row-${i}-price`) as HTMLInputElement)?.value?.trim() ?? "";
      const badge = (document.getElementById(`m-price-row-${i}-badge`) as HTMLSelectElement)?.value as "" | "recommend" | "popular" | undefined;
      rows.push({ name, desc, duration, price, badge: badge || undefined });
    }
    const ok = await saveEdit(regionSlug, categorySlug, venueSlug, "price", { lead, note, rows });
    if (!ok) return;
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
    const tbody = document.getElementById("price-tbody");
    if (tbody) {
      tbody.innerHTML = rows.map((row) => {
        const badgeHtml = row.badge ? `<span class="pt-badge ${row.badge}">${row.badge === "recommend" ? "추천" : "인기"}</span>` : "";
        return `<tr><td><div class="pt-name">${escapeHtml(row.name)}</div>${row.desc ? `<div style="font-size:11px;color:var(--dim)">${escapeHtml(row.desc)}</div>` : ""}</td><td style="font-size:12px;color:var(--muted)">${escapeHtml(row.duration || "—")}</td><td style="text-align:right"><span class="pt-price">${escapeHtml(row.price)}</span></td><td style="text-align:right">${badgeHtml}</td></tr>`;
      }).join("");
    }
    closeModal("price");
    router.refresh();
  }, [closeModal, regionSlug, categorySlug, venueSlug, router]);

  const handleSaveSeo = useCallback(async () => {
    const guideRaw = (document.getElementById("m-seo-guide") as HTMLTextAreaElement)?.value ?? "";
    const kwRaw = (document.getElementById("m-seo-keywords") as HTMLTextAreaElement)?.value ?? "";
    const seoCols: { blocks: { type: "h3" | "p"; content: string }[] }[] = [];
    const colParts = guideRaw.split(/\n---+\n/).map((s) => s.trim()).filter(Boolean);
    for (const part of colParts) {
      const blocks: { type: "h3" | "p"; content: string }[] = [];
      const paras = part.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
      for (const para of paras) {
        if (para.startsWith("### ")) {
          blocks.push({ type: "h3", content: para.slice(4).trim() });
        } else if (para) {
          blocks.push({ type: "p", content: para });
        }
      }
      if (blocks.length > 0) seoCols.push({ blocks });
    }
    const seoKwLinks: { href: string; text: string }[] = [];
    for (const line of kwRaw.split("\n").map((l) => l.trim()).filter(Boolean)) {
      const pipe = line.indexOf("|");
      if (pipe >= 0) {
        seoKwLinks.push({ href: line.slice(0, pipe).trim() || "#", text: line.slice(pipe + 1).trim() || line });
      } else {
        seoKwLinks.push({ href: "#", text: line });
      }
    }
    const ok = await saveEdit(regionSlug, categorySlug, venueSlug, "seo", { seoCols, seoKwLinks });
    if (!ok) return;
    closeModal("seo");
    router.refresh();
  }, [closeModal, regionSlug, categorySlug, venueSlug, router]);

  const handleSaveMap = useCallback(async () => {
    const url = (document.getElementById("m-map-url") as HTMLTextAreaElement)?.value?.trim() ?? "";
    const address = (document.getElementById("m-address") as HTMLInputElement)?.value ?? "";
    const addressSub = (document.getElementById("m-address-sub") as HTMLInputElement)?.value ?? "";
    const ok = await saveEdit(regionSlug, categorySlug, venueSlug, "map", {
      embed: url || undefined, address, addressSub: addressSub || undefined,
    });
    if (!ok) return;
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
    router.refresh();
  }, [closeModal, regionSlug, categorySlug, venueSlug, router]);

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
    // 백드롭 클릭으로 닫지 않음 — 저장/취소 버튼으로만 닫기 (메인 톱니바퀴 모달과 동일)
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
  const priceLead = data.priceLead ?? `${data.name}는 입장 전 가격을 명확히 안내하며, 안내받은 금액 그대로 결제됩니다.`;
  const priceRows: PriceRow[] = (data.priceRows ?? []).length > 0 ? data.priceRows! : [
    { name: "기본 세트", desc: "양주 1병 + 안주 + 초이스", duration: "2인 이상·2시간", price: "55만원~", badge: "recommend" },
    { name: "프리미엄 세트", desc: "양주 2병 + 안주 풀세팅 + 초이스", duration: "2인 이상·3시간", price: "85만원~", badge: "popular" },
    { name: "VIP 패키지", desc: "프리미엄 양주 + 풀세팅 + 전담 실장", duration: "2인 이상·무제한", price: "130만원~" },
    { name: "추가 연장", desc: "시간 연장 시 추가 요금", duration: "1시간 단위", price: "협의" },
  ];

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
            <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid var(--border)" }} />
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>가격 테이블 행</div>
            {[0, 1, 2, 3].map((i) => {
              const row = priceRows[i] ?? { name: "", desc: "", duration: "", price: "" as string };
              return (
              <div key={i} style={{ marginBottom: 16, padding: 12, background: "var(--bg-2)", borderRadius: 8 }}>
                <div className="mf-row" style={{ marginBottom: 8 }}>
                  <label>구성명</label>
                  <input type="text" id={`m-price-row-${i}-name`} defaultValue={row.name} placeholder="예: 기본 세트" />
                </div>
                <div className="mf-row" style={{ marginBottom: 8 }}>
                  <label>내용</label>
                  <input type="text" id={`m-price-row-${i}-desc`} defaultValue={row.desc} placeholder="예: 양주 1병 + 안주 + 초이스" />
                </div>
                <div className="mf-row" style={{ marginBottom: 8 }}>
                  <label>조건 (내용 열)</label>
                  <input type="text" id={`m-price-row-${i}-duration`} defaultValue={row.duration} placeholder="예: 2인 이상·2시간" />
                </div>
                <div className="mf-row" style={{ marginBottom: 8 }}>
                  <label>가격 (1인)</label>
                  <input type="text" id={`m-price-row-${i}-price`} defaultValue={row.price} placeholder="예: 55만원~" />
                </div>
                <div className="mf-row">
                  <label>비고</label>
                  <select id={`m-price-row-${i}-badge`} defaultValue={(row as PriceRow).badge ?? ""}>
                    <option value="">없음</option>
                    <option value="recommend">추천</option>
                    <option value="popular">인기</option>
                  </select>
                </div>
              </div>
            ); })}
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

      {/* 가이드·키워드 모달 */}
      <div className="modal-backdrop" id="modal-seo">
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
          <div className="modal-head">
            <h3>편집 완벽 가이드 · 키워드</h3>
            <button type="button" className="modal-close" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("seo")}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="mf-row">
              <label>가이드 내용 (형식: ### 제목 다음 줄에 본문, 빈 줄로 단락 구분, --- 로 섹션 구분)</label>
              <textarea
                id="m-seo-guide"
                rows={12}
                defaultValue={((data.seoCols ?? []) as { blocks: { type: string; content: string }[] }[]).map((col) =>
                  col.blocks.map((b) => (b.type === "h3" ? `### ${b.content}` : b.content)).join("\n\n")
                ).join("\n---\n")}
                placeholder={`### ${data.name}란? — 업종 소개&#10;&#10;본문 내용...&#10;&#10;---&#10;&#10;### 이용 방법&#10;&#10;다음 섹션 본문...`}
              />
            </div>
            <div className="mf-row" style={{ marginTop: 16 }}>
              <label>키워드 링크 (한 줄에 하나, 형식: href|표시텍스트 또는 텍스트만)</label>
              <textarea
                id="m-seo-keywords"
                rows={6}
                defaultValue={((data.seoKwLinks ?? []) as { href: string; text: string }[]).map((k) => (k.href && k.href !== "#" ? `${k.href}|${k.text}` : k.text)).join("\n")}
                placeholder="경로|표시 텍스트 (한 줄에 하나). 예: /지역/업종/업소슬러그|업소명"
              />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="mf-cancel" onClick={() => (window as unknown as { closeModal: (id: string) => void }).closeModal?.("seo")}>
              취소
            </button>
            <button type="button" className="mf-save" onClick={handleSaveSeo}>
              저장
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
              유사 업소는 같은 지역의 제휴 업소를 랜덤으로 표시합니다.
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
