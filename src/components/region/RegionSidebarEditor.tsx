"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type PriceRow = { type: string; val: string; chg: string };
type Tip = { title: string; text: string; color: string };
type NearbyRegion = { slug: string; name: string; venues: number; reviews: number };

type RegionSidebarConfig = {
  priceRows?: PriceRow[];
  priceNote?: string;
  tips?: Tip[];
  nearbyRegions?: NearbyRegion[];
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border, #333)",
  background: "var(--card, #222)",
  color: "inherit",
  fontSize: 14,
};
const labelStyle: React.CSSProperties = { display: "block", marginBottom: 4, fontSize: 13, color: "var(--muted)" };
const blockStyle: React.CSSProperties = { marginBottom: 16 };

function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={blockStyle}>
      <label style={labelStyle}>{label}</label>
      <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}
function FormNumber({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div style={blockStyle}>
      <label style={labelStyle}>{label}</label>
      <input type="number" value={value ?? 0} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} min={min ?? 0} style={inputStyle} />
    </div>
  );
}

interface RegionSidebarEditorProps {
  isAdmin: boolean;
  region: string;
  regionName: string;
  initialConfig: RegionSidebarConfig;
}

export default function RegionSidebarEditor({ isAdmin, region, regionName, initialConfig }: RegionSidebarEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [config, setConfig] = useState<RegionSidebarConfig>(initialConfig);

  const load = useCallback(async () => {
    setFetching(true);
    try {
      const r = await fetch("/api/admin/region-sidebar");
      if (r.ok) {
        const data = (await r.json()) as Record<string, RegionSidebarConfig>;
        const existing = data[region];
        if (existing) {
          setConfig((c) => ({
            priceRows: existing.priceRows ?? c.priceRows ?? [],
            priceNote: existing.priceNote ?? c.priceNote ?? "※ 주 1회 업데이트 · 실제 가격은 업소마다 상이",
            tips: existing.tips ?? c.tips ?? [],
            nearbyRegions: existing.nearbyRegions ?? c.nearbyRegions ?? [],
          }));
        }
      }
    } finally {
      setFetching(false);
    }
  }, [region]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/region-sidebar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, config }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert(err.error || "저장 실패");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const set = <K extends keyof RegionSidebarConfig>(k: K, v: RegionSidebarConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const priceRows = config.priceRows ?? [];
  const tips = config.tips ?? [];
  const nearbyRegions = config.nearbyRegions ?? [];

  if (!isAdmin) return null;

  return (
    <>
      <button
        type="button"
        aria-label={`${regionName} 사이드바 설정`}
        onClick={() => setOpen(true)}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 36,
          height: 36,
          borderRadius: 8,
          border: "1px solid rgba(255,215,0,0.4)",
          background: "rgba(0,0,0,0.7)",
          color: "var(--gold, #f5d030)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          zIndex: 50,
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        ⚙
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="region-sidebar-modal-title"
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
        >
          <div
            style={{ background: "var(--bg,#1a1a1a)", borderRadius: 12, maxWidth: 680, width: "95%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 24 }}>
              <h2 id="region-sidebar-modal-title" style={{ marginBottom: 20 }}>
                {regionName} 사이드바 편집
              </h2>

              {fetching ? (
                <p style={{ color: "var(--muted)" }}>로딩 중...</p>
              ) : (
                <>
                  <div style={{ marginBottom: 20, padding: 12, background: "var(--card)", borderRadius: 8, fontSize: 13, color: "var(--muted)" }}>
                    평균 가격, 인근 지역, 이용 팁을 직접 수정합니다. 저장 후 페이지가 갱신됩니다.
                  </div>

                  <h3 style={{ fontSize: 14, marginBottom: 12, color: "var(--gold)" }}>💰 평균 가격 (1인)</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {priceRows.map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 40px", gap: 8, alignItems: "end" }}>
                        <FormInput label="업종" value={row.type} onChange={(v) => set("priceRows", priceRows.map((r, j) => (j === i ? { ...r, type: v } : r)))} />
                        <FormInput label="평균" value={row.val} onChange={(v) => set("priceRows", priceRows.map((r, j) => (j === i ? { ...r, val: v } : r)))} />
                        <FormInput
                          label="변동"
                          value={row.chg}
                          onChange={(v) => set("priceRows", priceRows.map((r, j) => (j === i ? { ...r, chg: v } : r)))}
                          placeholder="up / dn / fl"
                        />
                        <button type="button" onClick={() => set("priceRows", priceRows.filter((_, j) => j !== i))} style={{ padding: 8, background: "transparent", color: "var(--muted)", border: "none", cursor: "pointer" }}>
                          삭제
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => set("priceRows", [...priceRows, { type: "", val: "", chg: "fl" }])} className="btn-save" style={{ padding: "6px 12px", fontSize: 12, alignSelf: "flex-start" }}>
                      + 가격 행 추가
                    </button>
                  </div>
                  <FormInput label="가격 안내 문구 (예: ※ 주 1회 업데이트...)" value={config.priceNote ?? ""} onChange={(v) => set("priceNote", v)} />

                  <h3 style={{ fontSize: 14, marginTop: 24, marginBottom: 12, color: "var(--gold)" }}>🗺 인근 지역 바로가기</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {nearbyRegions.map((nr, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px 40px", gap: 8, alignItems: "end" }}>
                        <FormInput label="slug" value={nr.slug} onChange={(v) => set("nearbyRegions", nearbyRegions.map((r, j) => (j === i ? { ...r, slug: v } : r)))} placeholder="gangnam" />
                        <FormInput label="이름" value={nr.name} onChange={(v) => set("nearbyRegions", nearbyRegions.map((r, j) => (j === i ? { ...r, name: v } : r)))} placeholder="강남" />
                        <FormNumber label="업소" value={nr.venues} onChange={(v) => set("nearbyRegions", nearbyRegions.map((r, j) => (j === i ? { ...r, venues: v } : r)))} min={0} />
                        <FormNumber label="리뷰" value={nr.reviews} onChange={(v) => set("nearbyRegions", nearbyRegions.map((r, j) => (j === i ? { ...r, reviews: v } : r)))} min={0} />
                        <button type="button" onClick={() => set("nearbyRegions", nearbyRegions.filter((_, j) => j !== i))} style={{ padding: 8, background: "transparent", color: "var(--muted)", border: "none", cursor: "pointer" }}>
                          삭제
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => set("nearbyRegions", [...nearbyRegions, { slug: "", name: "", venues: 0, reviews: 0 }])} className="btn-save" style={{ padding: "6px 12px", fontSize: 12, alignSelf: "flex-start" }}>
                      + 인근 지역 추가
                    </button>
                  </div>

                  <h3 style={{ fontSize: 14, marginTop: 24, marginBottom: 12, color: "var(--gold)" }}>💡 이용 팁</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {tips.map((tip, i) => (
                      <div key={i} style={{ padding: 12, background: "var(--card)", borderRadius: 8, border: "1px solid var(--border)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 40px", gap: 8, marginBottom: 8 }}>
                          <FormInput label="제목" value={tip.title} onChange={(v) => set("tips", tips.map((t, j) => (j === i ? { ...t, title: v } : t)))} />
                          <FormInput label="색상 (예: var(--gold))" value={tip.color} onChange={(v) => set("tips", tips.map((t, j) => (j === i ? { ...t, color: v } : t)))} />
                          <div />
                          <button type="button" onClick={() => set("tips", tips.filter((_, j) => j !== i))} style={{ padding: 8, background: "transparent", color: "var(--muted)", border: "none", cursor: "pointer", alignSelf: "end" }}>
                            삭제
                          </button>
                        </div>
                        <FormInput label="설명" value={tip.text} onChange={(v) => set("tips", tips.map((t, j) => (j === i ? { ...t, text: v } : t)))} />
                      </div>
                    ))}
                    <button type="button" onClick={() => set("tips", [...tips, { title: "", text: "", color: "var(--gold)" }])} className="btn-save" style={{ padding: "6px 12px", fontSize: 12, alignSelf: "flex-start" }}>
                      + 팁 추가
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                    <button type="button" onClick={handleSave} className="btn-save" disabled={loading}>
                      {loading ? "저장 중..." : "저장"}
                    </button>
                    <button type="button" onClick={() => setOpen(false)} style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border)" }}>
                      취소
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
