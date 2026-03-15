"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { Region } from "@/lib/data/regions";

// SVG viewBox(0 0 340 460) 기준 연결선 정의 [fromSlug, toSlug, opacity, width]
const CONNECTIONS: [string, string, number, number][] = [
  ["gangnam", "suwon", 0.35, 1.0],
  ["gangnam", "incheon", 0.18, 0.8],
  ["gangnam", "gangneung", 0.15, 0.7],
  ["gangnam", "cheongju", 0.12, 0.7],
  ["suwon", "dongtan", 0.28, 1.0],
  ["suwon", "osan", 0.22, 0.8],
  ["dongtan", "osan", 0.2, 0.8],
  ["osan", "daejeon", 0.16, 0.8],
  ["cheongju", "daejeon", 0.14, 0.7],
  ["daejeon", "gwangju", 0.14, 0.7],
  ["daejeon", "daegu", 0.14, 0.7],
  ["daejeon", "jeonju", 0.13, 0.7],
  ["jeonju", "gwangju", 0.14, 0.7],
  ["daegu", "busan", 0.18, 0.8],
  ["daegu", "ulsan", 0.15, 0.7],
  ["busan", "ulsan", 0.14, 0.7],
  ["gwangju", "jeju", 0.18, 0.8],
  ["gangneung", "daegu", 0.1, 0.6],
];

// map_x, map_y 미설정 시 폴백 좌표 (slug별)
const FALLBACK_COORDS: Record<string, { x: number; y: number; dx: number; dy: number }> = {
  gangnam: { x: 192, y: 118, dx: 8, dy: -5 },
  suwon: { x: 148, y: 162, dx: -52, dy: -4 },
  dongtan: { x: 162, y: 200, dx: 8, dy: -4 },
  osan: { x: 152, y: 222, dx: -44, dy: -3 },
  garak: { x: 208, y: 128, dx: 8, dy: -4 },
  jeju: { x: 152, y: 420, dx: 8, dy: -4 },
  incheon: { x: 112, y: 108, dx: -46, dy: -4 },
  busan: { x: 248, y: 280, dx: 8, dy: -4 },
  daejeon: { x: 162, y: 268, dx: 8, dy: -4 },
  daegu: { x: 220, y: 285, dx: 8, dy: -4 },
  gwangju: { x: 128, y: 314, dx: -46, dy: -4 },
  gangneung: { x: 262, y: 108, dx: 8, dy: -4 },
  jeonju: { x: 140, y: 290, dx: -44, dy: -4 },
  cheongju: { x: 188, y: 250, dx: 8, dy: -4 },
  ulsan: { x: 240, y: 265, dx: 8, dy: -4 },
};

export interface MapRegion extends Region {
  status: "hot" | "active" | "soon";
  map_x: number;
  map_y: number;
  label_dx: number;
  label_dy: number;
  venues: number;
  reviews: number;
}

export interface KoreaNetworkMapProps {
  regions: Region[];
  partnerCounts?: Record<string, { venues?: number; reviews?: number }>;
}

function toMapRegion(
  r: Region,
  counts?: Record<string, { venues?: number; reviews?: number }>
): MapRegion | null {
  const fallback = FALLBACK_COORDS[r.slug];
  const map_x = r.map_x ?? fallback?.x ?? null;
  const map_y = r.map_y ?? fallback?.y ?? null;
  if (map_x == null || map_y == null) return null;

  const status: "hot" | "active" | "soon" = r.coming ? "soon" : r.badge === "HOT" ? "hot" : "active";
  const c = counts?.[r.slug];
  const venues = c?.venues ?? 0;
  const reviews = c?.reviews ?? r.reviews ?? 0;

  return {
    ...r,
    status,
    map_x,
    map_y,
    label_dx: fallback?.dx ?? 8,
    label_dy: fallback?.dy ?? -4,
    venues,
    reviews,
  };
}

const SVG_W = 340;
const SVG_H = 460;

export default function KoreaNetworkMap({ regions, partnerCounts }: KoreaNetworkMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    name: string;
    status: string;
    venues: number;
    reviews: number;
    tags: string;
  } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const mapRegions = useMemo(
    () =>
      regions
        .map((r) => toMapRegion(r, partnerCounts))
        .filter((r): r is MapRegion => r != null),
    [regions, partnerCounts]
  );

  const regionBySlug = useMemo(() => {
    const m: Record<string, MapRegion> = {};
    mapRegions.forEach((r) => {
      m[r.slug] = r;
    });
    return m;
  }, [mapRegions]);

  const showTooltip = useCallback(
    (e: React.MouseEvent, r: MapRegion) => {
      const wrap = (e.target as HTMLElement).closest(".korea-map-wrap");
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      let x = e.clientX - rect.left + 12;
      let y = e.clientY - rect.top - 48;
      if (x + 180 > rect.width) x -= 196;
      if (y < 0) y = 4;
      setPos({ x, y });
      setTooltip({
        name: r.name,
        status: r.status,
        venues: r.venues,
        reviews: r.reviews,
        tags: Array.isArray(r.tags) ? r.tags.join(" · ") : "",
      });
    },
    []
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);

  if (mapRegions.length === 0) return null;

  return (
    <div className="korea-map-wrap">
      {tooltip && (
        <div
          className="map-tooltip show"
          style={{ left: pos.x, top: pos.y }}
          role="tooltip"
        >
          <strong>{tooltip.name}</strong>
          <span>
            {tooltip.status === "soon"
              ? "서비스 준비중"
              : `${tooltip.venues}개 업소 · ${tooltip.reviews}개 리뷰${tooltip.tags ? ` · ${tooltip.tags}` : ""}`}
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="룸빵여지도 전국 서비스 지역 네트워크 지도"
        className="korea-map-svg"
      >
        <defs>
          <filter
            id="glow-node"
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
          >
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="glow-hot"
            x="-120%"
            y="-120%"
            width="340%"
            height="340%"
          >
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="mapBg" cx="50%" cy="48%" r="50%">
            <stop offset="0%" stopColor="rgba(200,168,75,0.06)" />
            <stop offset="100%" stopColor="rgba(200,168,75,0)" />
          </radialGradient>
        </defs>

        {/* 배경 */}
        <circle
          cx={SVG_W / 2}
          cy={SVG_H * 0.48}
          r={180}
          fill="url(#mapBg)"
        />

        {/* 한국 지도 외곽선 */}
        <g>
          <path
            fill="rgba(200,168,75,0.025)"
            stroke="rgba(200,168,75,0.14)"
            strokeWidth={1.2}
            strokeLinejoin="round"
            d="M148,26 L165,20 L188,24 L210,30 L230,40 L244,56 L252,73 L257,93 L260,113 L262,135 L257,156 L264,173 L270,193 L267,213 L260,230 L252,246 L257,263 L260,283 L254,300 L244,316 L230,328 L217,340 L202,350 L187,356 L171,360 L155,356 L141,348 L125,338 L111,323 L101,306 L95,288 L91,268 L93,248 L101,230 L105,210 L101,193 L93,176 L88,156 L85,136 L88,116 L93,96 L101,78 L111,62 L125,48 L138,36 Z"
          />
          <ellipse
            cx={152}
            cy={422}
            rx={30}
            ry={15}
            fill="rgba(200,168,75,0.025)"
            stroke="rgba(200,168,75,0.14)"
            strokeWidth={1.2}
          />
        </g>

        {/* 연결선 */}
        <g>
          {CONNECTIONS.map(([fromSlug, toSlug, opacity, width], i) => {
            const from = regionBySlug[fromSlug];
            const to = regionBySlug[toSlug];
            if (!from || !to) return null;
            const isActive = from.status !== "soon" && to.status !== "soon";
            const len = Math.hypot(to.map_x - from.map_x, to.map_y - from.map_y);
            return (
              <line
                key={`${fromSlug}-${toSlug}`}
                x1={from.map_x}
                y1={from.map_y}
                x2={to.map_x}
                y2={to.map_y}
                stroke={`rgba(200,168,75,${opacity})`}
                strokeWidth={width}
                strokeDasharray={isActive ? "4,3" : "3,5"}
                style={{
                  strokeDashoffset: len,
                  animation: `drawLine 0.8s ${0.1 + i * 0.04}s ease forwards`,
                }}
              />
            );
          })}
        </g>

        {/* 노드 */}
        <g>
          {mapRegions.map((r, i) => {
            const isHot = r.status === "hot";
            const isActive = r.status === "active";
            const nodeColor = isHot ? "#e6c96e" : isActive ? "#c8a84b" : "#252525";
            const glowColor = isHot ? "#e6c96e" : isActive ? "#c8a84b" : "transparent";
            const nodeR = isHot ? 5 : isActive ? 3.5 : 2.5;
            const glowR = isHot ? 18 : isActive ? 12 : 0;
            const filter = isHot ? "url(#glow-hot)" : isActive ? "url(#glow-node)" : undefined;
            const labelFill = isHot ? "#e6c96e" : isActive ? "#c8a84b" : "#2e2e2e";
            const subFill = isActive ? "#7a7a7a" : "#252525";

            return (
              <g
                key={r.id}
                className="map-node-group"
                onMouseEnter={(e) => showTooltip(e, r)}
                onMouseLeave={hideTooltip}
              >
                {glowR > 0 && (
                  <circle
                    cx={r.map_x}
                    cy={r.map_y}
                    r={glowR}
                    fill={glowColor}
                    opacity={0.22}
                    style={{
                      transformOrigin: `${r.map_x}px ${r.map_y}px`,
                      animation: isHot
                        ? `hotGlow 1.8s ${i * 0.12}s ease-in-out infinite`
                        : `nodeGlow 3s ${i * 0.15}s ease-in-out infinite`,
                    }}
                  />
                )}
                {r.status !== "soon" ? (
                  <circle
                    cx={r.map_x}
                    cy={r.map_y}
                    r={nodeR}
                    fill={nodeColor}
                    filter={filter}
                    style={{
                      cursor: "pointer",
                      transformOrigin: `${r.map_x}px ${r.map_y}px`,
                      animation: isHot
                        ? `hotPulse 1.8s ${i * 0.12}s ease-in-out infinite`
                        : isActive
                        ? `nodePulse 3s ${i * 0.15}s ease-in-out infinite`
                        : undefined,
                    }}
                    onClick={() => router.push(`/${r.slug}`)}
                  />
                ) : (
                  <circle
                    cx={r.map_x}
                    cy={r.map_y}
                    r={nodeR}
                    fill={nodeColor}
                    style={{ cursor: "default" }}
                  />
                )}
                <text
                  x={r.map_x + r.label_dx}
                  y={r.map_y + r.label_dy}
                  fontFamily="'Black Han Sans',sans-serif"
                  fontSize={isHot ? 12 : isActive ? 11 : 9}
                  fill={labelFill}
                  style={{ pointerEvents: "none" }}
                >
                  {r.name}
                </text>
                {r.venues > 0 && (
                  <text
                    x={r.map_x + r.label_dx}
                    y={r.map_y + r.label_dy + 10}
                    fontFamily="'Noto Sans KR',sans-serif"
                    fontSize={8}
                    fill={subFill}
                    style={{ pointerEvents: "none" }}
                  >
                    {r.venues}개 업소
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 범례 */}
        <g transform="translate(8,438)">
          <circle cx={6} cy={6} r={4} fill="#c8a84b" filter="url(#glow-node)" />
          <text x={14} y={10} fontFamily="Noto Sans KR,sans-serif" fontSize={8.5} fill="#7a7a7a">
            서비스 중
          </text>
          <circle cx={6} cy={20} r={2.5} fill="#252525" stroke="#333" strokeWidth={0.5} />
          <text x={14} y={24} fontFamily="Noto Sans KR,sans-serif" fontSize={8.5} fill="#333">
            준비중
          </text>
        </g>
      </svg>
    </div>
  );
}
