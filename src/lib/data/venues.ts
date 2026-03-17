/**
 * 업소 상세 페이지 데이터 레이어
 * URL 형식: /지역/종목/업소명 (SEO 최적화)
 * 예: /gangnam/karaoke/dalto
 */

import { getPartners } from "./partners";
import type { Partner } from "./partners";

/** Fisher-Yates 셔플 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 같은 지역의 제휴 업소 중 현재 업소 제외, 랜덤 3개를 similarVenues 형식으로 반환 */
function buildSimilarVenuesFromPartners(
  partners: Partner[],
  regionSlug: string,
  regionName: string,
  excludeVenueSlug: string,
  limit = 3
): VenueDetail["similarVenues"] {
  const typeColors: Record<string, { background?: string; border?: string; color?: string }> = {
    가라오케: { background: "rgba(192,57,43,.15)", border: "1px solid rgba(192,57,43,.25)", color: "#e05c50" },
    하이퍼블릭: { background: "rgba(155,89,182,.12)", border: "1px solid rgba(155,89,182,.25)", color: "#9b59b6" },
    셔츠룸: { background: "rgba(52,152,219,.12)", border: "1px solid rgba(52,152,219,.25)", color: "#3498db" },
    퍼블릭: { background: "rgba(46,204,113,.12)", border: "1px solid rgba(46,204,113,.25)", color: "#2ecc71" },
    쩜오: { background: "rgba(241,196,15,.15)", border: "1px solid rgba(241,196,15,.3)", color: "#f1c40f" },
  };
  const filtered = partners.filter((p) => {
    const pSlug = extractVenueSlugFromHref(p.href) || nameToSlug(p.name);
    if (pSlug === excludeVenueSlug) return false;
    const regionMatch = p.region?.includes(regionName) || regionName?.includes(p.region ?? "") || p.href?.includes(`/${regionSlug}/`);
    return regionMatch;
  });
  const picked = shuffle(filtered).slice(0, limit);
  return picked.map((p) => {
    const href = p.href?.startsWith("/") ? p.href : `/${regionSlug}/${TYPE_TO_SLUG[p.type] || "karaoke"}/${extractVenueSlugFromHref(p.href) || nameToSlug(p.name)}`;
    const desc = (p.desc ?? "").trim();
    const preview = desc.length > 120 ? desc.slice(0, 120) + "…" : desc || `${regionName} ${p.type} — ${p.name}`;
    const infoCards = (p as unknown as { info_cards?: { label?: string; val?: string }[] }).info_cards;
    const priceVal = infoCards?.[0]?.val ?? "문의";
    return {
      name: p.name,
      href,
      type: p.type,
      typeStyle: typeColors[p.type] ?? { background: "rgba(149,165,166,.12)", border: "1px solid rgba(149,165,166,.25)", color: "#95a5a6" },
      score: (() => { const s = (p.stars ?? "★★★★☆"); const n = (s.match(/★/g) ?? []).length; return n >= 4 ? "4.5" : n >= 3 ? "4.0" : "3.5"; })(),
      price: typeof priceVal === "string" && priceVal !== "문의" ? `1인 ${priceVal}` : `1인 ${priceVal}~`,
      preview,
      stars: p.stars ?? "★★★★☆",
    };
  });
}
import { supabaseAdmin } from "../supabase-server";
import { getReviewPostsByVenue, buildReviewUrl, formatStars } from "./review-posts";

/** 종목(업종) → URL slug 매핑 */
export const TYPE_TO_SLUG: Record<string, string> = {
  가라오케: "karaoke",
  노래방: "karaoke",
  룸싸롱: "room-salon",
  하이퍼블릭: "highpublic",
  쩜오: "jjomoh",
  퍼블릭: "public",
  셔츠룸: "shirtroom",
  바: "bar",
  기타: "karaoke",
};

/** URL slug → 종목(업종) 매핑 */
export const SLUG_TO_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_TO_SLUG).map(([k, v]) => [v, k])
);

export const REGION_SLUGS = ["gangnam", "suwon", "dongtan", "osan", "garak", "jeju"] as const;
export const REGION_SLUG_TO_NAME: Record<string, string> = {
  gangnam: "강남",
  suwon: "수원 인계동",
  dongtan: "동탄",
  osan: "오산",
  garak: "가락",
  jeju: "제주",
};

/** 지역명 → URL slug (제휴업체 폼 등에서 사용) */
export const REGION_NAME_TO_SLUG: Record<string, string> = {
  강남: "gangnam",
  "수원": "suwon",
  "수원 인계동": "suwon",
  동탄: "dongtan",
  오산: "osan",
  가락: "garak",
  제주: "jeju",
};

/** SEO 최적화 URL 생성: /지역/종목/업소명 */
export function buildVenueUrl(
  regionSlug: string,
  categorySlug: string,
  venueSlug: string
): string {
  return `/${regionSlug}/${categorySlug}/${venueSlug}`;
}

/** href에서 venue slug 추출 (기존 /region/venue/slug 형식 호환) */
function extractVenueSlugFromHref(href: string): string {
  const parts = href.replace(/\/$/, "").split("/");
  return parts[parts.length - 1] ?? "";
}

/** 업소명 → URL용 slug (한글 등 처리) */
function nameToSlug(name: string): string {
  const map: Record<string, string> = {
    "달토 가라오케": "dalto",
    "퍼펙트 가라오케": "perfect",
    "인트로 하이퍼블릭": "intro",
    "구구단 쩜오": "99",
    "다이아몬드 하이퍼블릭": "diamond",
    "스카이라운지 퍼블릭": "skylounge",
    "아우라 가라오케": "aura",
    "마징가 가라오케": "mazinga",
    "메칸더 셔츠룸": "mechander",
    "비너스 셔츠룸": "venus",
    "오로라 가라오케": "aurora",
    "스타 퍼블릭": "star",
    "제니스 클럽": "zenith",
    "오션뷰 가라오케": "oceanview",
  };
  const slugMap: Record<string, string> = {
    ...map,
    "동탄 최저가": "dongtan-choigga",
    "동탄최저가": "dongtan-choigga",
  };
  return slugMap[name] ?? name.replace(/\s+/g, "-").toLowerCase();
}

export interface VenueDetail {
  slug: string;
  name: string;
  region: string;
  regionSlug: string;
  type: string;
  categorySlug: string;
  url: string;
  ad: boolean;
  rating: string;
  stars: string;
  reviewCount: number;
  updateText: string;
  contact: string;
  /** 카카오톡 상담 링크 (open.kakao.com 또는 pf.kakao.com URL) */
  kakaoUrl?: string;
  location: string;
  locationDetail: string;
  locationSub?: string;
  hours: string;
  hoursStyle?: "open" | "closed";
  infoCards: { label: string; val: string; sub: string; gold?: boolean; green?: boolean }[];
  /** v2: 히어로 부제목 (hb-tagline) */
  tagline?: string;
  /** v2: 소개 섹션 라벨 (ABOUT · 업소 소개) */
  introLabel?: string;
  /** v2: 소개 섹션 h2 헤드라인 (em dash 기준 뒷부분 골드 강조) */
  introHeadline?: string;
  /** v2: 리드 문장 (art-lead) */
  introLead?: string;
  /** v2: 풀쿼트 강조 박스 (.art-quote) */
  introQuote?: string;
  /** v2: 본문 단락들 (.art-p) */
  introBodyParagraphs?: string[];
  /** v2: 가격 리드 문장 (#price-lead) */
  priceLead?: string;
  /** @deprecated v1 — v2에서는 tagline/introHeadline 사용. fallback용 유지 */
  introTitle: string;
  /** @deprecated v1 — v2에서는 introLead/introQuote/introBodyParagraphs 사용. fallback용 유지 */
  introParagraphs: string[];
  mapEmbed?: string;
  priceRows: { name: string; desc: string; duration: string; price: string; badge?: "recommend" | "popular" }[];
  priceNote: string;
  opList: { label: string; val: string; open?: boolean }[];
  stats: { val: string; label: string }[];
  nearbyVenues: { rank: number; name: string; href: string; sub: string; score: string }[];
  similarVenues: { name: string; href: string; type: string; typeStyle: React.CSSProperties; score: string; price: string; preview: string; stars: string }[];
  seoKwLinks: { href: string; text: string }[];
  seoCols: { blocks: { type: "h3" | "p"; content: string }[] }[];
  reviews: { id: string; href: string; title: string; stars: string; starsNum: string; body: string; date: string; charCount: string }[];
  reviewBars: { label: string; width: number; count: number }[];
  aspects: { label: string; val: string; width: number }[];
}

const FALLBACK_DETAIL: Record<string, Record<string, VenueDetail>> = {
  gangnam: {
    dalto: {
      slug: "dalto",
      name: "달토 가라오케",
      region: "강남",
      regionSlug: "gangnam",
      type: "가라오케",
      categorySlug: "karaoke",
      url: "/gangnam/karaoke/dalto",
      ad: true,
      rating: "4.9",
      stars: "★★★★★",
      reviewCount: 87,
      updateText: "방금 업데이트됨",
      contact: "02-000-0000",
      location: "강남구 역삼동 000-00, B1",
      locationDetail: "서울특별시 강남구 역삼동 000-00, 달토빌딩 B1",
      locationSub: "지하철 2호선 강남역 3번 출구 도보 5분 · 발렛 운영",
      hours: "24시간 영업중",
      hoursStyle: "open",
      infoCards: [
        { label: "💰 1인 주대", val: "55만원~", sub: "양주 세트 기준", gold: true },
        { label: "👥 라인업", val: "50명+", sub: "주말 기준" },
        { label: "🕐 영업시간", val: "24시간", sub: "연중무휴", green: true },
        { label: "🅿 주차", val: "발렛", sub: "전용 발렛 운영" },
      ],
      tagline: "강남 가라오케의 기준 — 20년 업력이 만든 신뢰",
      introLabel: "ABOUT · 업소 소개",
      introHeadline: "달토 가라오케 — 강남 가라오케의 새로운 기준",
      introLead: "강남 최상급 가라오케로 손꼽히는 달토입니다. **20년 이상의 업력**과 안정된 운영 시스템, 매달 새롭게 구성되는 신규 라인업이 강남 내 굳건한 1위 자리를 유지하게 해주는 핵심입니다.",
      introQuote: "주말 기준 50명 이상이 출근 중이며 외모 수준이 고르게 높은 편입니다. 파트너 선택 폭이 넓고 초이스 후 교체 요청에도 부담 없이 응해드립니다. 정찰제 운영으로 안내받은 금액 그대로 결제되며 불필요한 추가 비용이 없습니다.",
      introBodyParagraphs: [
        "입장부터 퇴장까지 **1:1 전담 실장**이 밀착 관리해드립니다. 처음 방문하시는 분도 실장의 상세한 안내 덕분에 어색함 없이 편안하게 이용하실 수 있습니다. 예약 고객에게는 룸 우선 배정과 초이스 우선권을 드립니다.",
        "주대 구성은 1인 기준 양주 세트 55만 원대부터 시작하며, 테이블 구성에 따라 조정 가능합니다. 강남 방문 시 반드시 경험해야 할 프리미엄 가라오케입니다.",
      ],
      priceLead: "달토는 입장 전 가격을 명확히 안내하며, 안내받은 금액 그대로 결제됩니다.",
      introTitle: "강남 가라오케의 기준",
      introParagraphs: [
        "강남 최상급 가라오케로 손꼽히는 달토입니다. **20년 이상의 업력**과 안정된 운영 시스템, 매달 새롭게 구성되는 신규 라인업이 강남 내 굳건한 1위 자리를 유지하게 해주는 핵심입니다.",
        "입장부터 퇴장까지 **1:1 전담 실장**이 밀착 관리해드립니다. 처음 방문하시는 분도 실장의 상세한 안내 덕분에 어색함 없이 편안하게 이용하실 수 있습니다. 예약 고객에게는 룸 우선 배정과 초이스 우선권을 드립니다.",
        "**주말 기준 50명 이상**이 출근 중이며 외모 수준이 고르게 높은 편입니다. 파트너 선택 폭이 넓고 초이스 후 교체 요청에도 부담 없이 응해드립니다. **정찰제 운영**으로 안내받은 금액 그대로 결제되며 불필요한 추가 비용이 없습니다.",
        "주대 구성은 1인 기준 양주 세트 55만 원대부터 시작하며, 테이블 구성에 따라 조정 가능합니다. 강남 방문 시 반드시 경험해야 할 프리미엄 가라오케입니다.",
      ],
      priceRows: [
        { name: "기본 세트", desc: "양주 1병 + 안주 + 초이스", duration: "2인 이상 · 2시간", price: "55만원~", badge: "recommend" },
        { name: "프리미엄 세트", desc: "양주 2병 + 안주 풀세팅 + 초이스", duration: "2인 이상 · 3시간", price: "85만원~", badge: "popular" },
        { name: "VIP 패키지", desc: "프리미엄 양주 + 풀세팅 + 전담 실장", duration: "2인 이상 · 무제한", price: "130만원~" },
        { name: "추가 연장", desc: "시간 연장 시 추가 요금", duration: "1시간 단위", price: "협의" },
      ],
      priceNote: "※ 위 가격은 1인 기준 참고가이며 실제 가격은 방문 인원, 선택 옵션, 시즌에 따라 달라질 수 있습니다.\n※ 정찰제 운영으로 안내받은 금액 외 추가 비용이 발생하지 않습니다. 방문 전 전화로 가격 확인을 권장합니다.",
      opList: [
        { label: "영업시간", val: "24시간 · 연중무휴", open: true },
        { label: "예약", val: "전화·카톡 가능" },
        { label: "주차", val: "발렛 운영 (무료)" },
        { label: "정찰제", val: "✓ 정찰제 운영", open: true },
        { label: "첫방문", val: "✓ 입문자 환영", open: true },
      ],
      stats: [
        { val: "14", label: "새 리뷰" },
        { val: "4.9", label: "이번 주 평점" },
        { val: "52", label: "조회수↑" },
        { val: "1위", label: "강남 랭킹" },
      ],
      nearbyVenues: [
        { rank: 1, name: "달토 가라오케", href: "/gangnam/karaoke/dalto", sub: "현재 페이지", score: "4.9" },
        { rank: 2, name: "퍼펙트 가라오케", href: "/gangnam/karaoke/perfect", sub: "리뷰 61개", score: "4.8" },
        { rank: 3, name: "스카이 가라오케", href: "/gangnam/karaoke/skylounge", sub: "리뷰 44개", score: "4.6" },
        { rank: 4, name: "스타 가라오케", href: "/gangnam/karaoke/star", sub: "리뷰 38개", score: "4.5" },
      ],
      similarVenues: [
        { name: "퍼펙트 가라오케", href: "/gangnam/karaoke/perfect", type: "가라오케", typeStyle: { background: "rgba(192,57,43,.15)", border: "1px solid rgba(192,57,43,.25)", color: "#e05c50" }, score: "4.8", price: "1인 52만원~", preview: "강남 퍼펙트는 전반적인 완성도가 높습니다. 예약 없이 방문해도 10분 내 안내받을 수 있는 효율적 운영이 강점.", stars: "★★★★★" },
        { name: "스카이 가라오케", href: "/gangnam/karaoke/skylounge", type: "가라오케", typeStyle: { background: "rgba(192,57,43,.15)", border: "1px solid rgba(192,57,43,.25)", color: "#e05c50" }, score: "4.6", price: "1인 48만원~", preview: "달토 대비 합리적인 가격대. 주말 40명+ 라인업, 청담동 프리미엄 위치 프리미엄 분위기.", stars: "★★★★☆" },
        { name: "인트로 하이퍼블릭", href: "/gangnam/highpublic/intro", type: "하이퍼블릭", typeStyle: { background: "rgba(155,89,182,.12)", border: "1px solid rgba(155,89,182,.25)", color: "#9b59b6" }, score: "4.5", price: "1인 78만원~", preview: "가라오케에서 한 단계 업그레이드를 원한다면 인트로. 강남 하이퍼블릭 중 가성비 1위.", stars: "★★★★☆" },
      ],
      seoKwLinks: [
        { href: "/gangnam/karaoke/dalto", text: "달토 가라오케" },
        { href: "/gangnam/karaoke/dalto/reviews", text: "달토 가라오케 후기" },
        { href: "/gangnam/karaoke/dalto", text: "달토 가라오케 가격" },
        { href: "/gangnam/karaoke/dalto", text: "달토 가라오케 위치" },
        { href: "/gangnam/karaoke/dalto", text: "강남 달토" },
        { href: "/gangnam/category/karaoke", text: "강남 가라오케 추천" },
        { href: "/gangnam/category/karaoke", text: "강남 가라오케 1위" },
        { href: "/gangnam", text: "강남 유흥 정보" },
      ],
      seoCols: [
        {
          blocks: [
            { type: "h3", content: "달토 가라오케란? — <em>강남 가라오케 1위</em>" },
            { type: "p", content: "<strong>달토 가라오케</strong>는 서울 강남구 역삼동에 위치한 강남 대표 프리미엄 가라오케입니다. 20년 이상의 운영 노하우를 바탕으로 안정적인 서비스와 높은 라인업 수준을 유지해 강남 내 굳건한 1위 자리를 지키고 있습니다." },
            { type: "p", content: "매달 신규 라인업을 구성하고 파트너 교육에 투자하는 것으로 알려져 있습니다. <strong>정찰제 운영</strong>으로 가격 투명성이 높아 처음 방문하는 분들도 안심하고 이용할 수 있습니다." },
          ],
        },
        {
          blocks: [
            { type: "h3", content: "달토 가라오케 이용 방법 — <em>처음 방문자 가이드</em>" },
            { type: "p", content: "방문 전 <strong>전화 또는 카카오톡으로 예약</strong>하는 것을 강력히 권장합니다. 특히 금·토요일 저녁은 예약 필수입니다. 예약 시 인원, 원하는 시간대, 예산을 미리 알려주면 맞춤 안내를 받을 수 있습니다." },
            { type: "p", content: "발렛 서비스를 운영하므로 자차 방문도 편리합니다. 지하철 이용 시 <strong>강남역 3번 출구에서 도보 5분</strong> 거리입니다. 주대는 사전에 확인한 금액 그대로 결제되며 추가 요금이 없습니다." },
          ],
        },
      ],
      reviews: [
        { id: "01", href: "/gangnam/karaoke/dalto/review/01", title: "달토 가라오케 3월 라인업 완전 분석 — 강남 최상급 솔직 후기", stars: "★★★★★", starsNum: "5.0 / 5.0", body: "강남 최상급 가라오케로 손꼽히는 달토를 3월 첫 주에 직접 방문했습니다. 예약은 전화로 진행했으며 담당 실장의 응대가 매우 친절하고 빠른 편이었습니다.", date: "2025.03.11 06:00", charCount: "약 340자" },
        { id: "02", href: "/gangnam/karaoke/dalto/review/02", title: "강남 달토 재방문 — 역시 믿고 가는 곳, 5번째 방문 후기", stars: "★★★★★", starsNum: "5.0 / 5.0", body: "1년 동안 다섯 번째 방문입니다. 올 때마다 실망 없이 나오는 유일한 가라오케입니다.", date: "2025.03.05 18:00", charCount: "약 290자" },
        { id: "03", href: "/gangnam/karaoke/dalto/review/03", title: "평일 방문 후기 — 주말보다 라인업 적지만 서비스는 그대로", stars: "★★★★☆", starsNum: "4.0 / 5.0", body: "평일 수요일 저녁에 방문했습니다. 주말 대비 출근 인원이 30명 정도로 줄어들어 선택 폭이 좁아진 편이었습니다.", date: "2025.02.28 12:00", charCount: "약 280자" },
        { id: "04", href: "/gangnam/karaoke/dalto/review/04", title: "달토 처음 방문 — 입문자도 편하게 이용 가능, 실장 케어 최고", stars: "★★★★★", starsNum: "5.0 / 5.0", body: "강남 가라오케 처음 방문이었는데 친구 추천으로 달토를 선택했습니다.", date: "2025.02.22 06:00", charCount: "약 310자" },
        { id: "05", href: "/gangnam/karaoke/dalto/review/05", title: "발렌타인 시즌 달토 방문 — 성수기에도 흔들리지 않는 퀄리티", stars: "★★★★★", starsNum: "4.8 / 5.0", body: "발렌타인 시즌 토요일, 성수기 방문이라 걱정했지만 사전 예약 덕분에 대기 없이 입장했습니다.", date: "2025.02.15 00:00", charCount: "약 300자" },
        { id: "06", href: "/gangnam/karaoke/dalto/review/06", title: "달토 vs 퍼펙트 비교 후기 — 두 곳 모두 다녀온 솔직 평가", stars: "★★★★★", starsNum: "4.9 / 5.0", body: "같은 달 달토와 퍼펙트 두 곳을 모두 방문했습니다. 결론부터 말하면 달토가 전반적으로 더 높은 수준이었습니다.", date: "2025.02.08 18:00", charCount: "약 290자" },
      ],
      reviewBars: [
        { label: "5★", width: 78, count: 68 },
        { label: "4★", width: 16, count: 14 },
        { label: "3★", width: 4, count: 3 },
        { label: "2★", width: 2, count: 2 },
        { label: "1★", width: 0, count: 0 },
      ],
      aspects: [
        { label: "라인업", val: "4.9", width: 98 },
        { label: "서비스", val: "4.8", width: 96 },
        { label: "청결도", val: "4.7", width: 94 },
        { label: "가성비", val: "4.5", width: 90 },
      ],
    },
    perfect: {} as VenueDetail,
    intro: {} as VenueDetail,
    "99": {} as VenueDetail,
    diamond: {} as VenueDetail,
    skylounge: {} as VenueDetail,
  },
};

function fillVenueFromBase(
  base: VenueDetail,
  overrides: Partial<VenueDetail>
): VenueDetail {
  return { ...base, ...overrides } as VenueDetail;
}

// 나머지 강남 업소 채우기
const dalto = FALLBACK_DETAIL.gangnam!.dalto!;
(FALLBACK_DETAIL.gangnam as Record<string, VenueDetail>).perfect = fillVenueFromBase(dalto, {
  slug: "perfect", name: "퍼펙트 가라오케", url: "/gangnam/karaoke/perfect", rating: "4.8", reviewCount: 61,
  contact: "02-000-0001", location: "강남구 논현동 000-0, B2", locationDetail: "서울특별시 강남구 논현동 000-0, 퍼펙트빌딩 2F",
  infoCards: [
    { label: "💰 1인 주대", val: "52만원~", sub: "양주 세트 기준", gold: true },
    { label: "👥 라인업", val: "50명+", sub: "주말 기준" },
    { label: "🕐 영업시간", val: "24시간", sub: "연중무휴", green: true },
    { label: "🅿 주차", val: "발렛", sub: "전용 발렛 운영" },
  ],
  tagline: "강남 가라오케 2위 — 전반적 완성도 높은 업소",
  introHeadline: "퍼펙트 가라오케 — 강남 가라오케 2위",
  introLead: "강남 퍼펙트는 이름처럼 전반적인 완성도가 높은 업소입니다. 달토 대비 소폭 저렴한 가격대와 안정적인 서비스로 인기가 높습니다.",
  introBodyParagraphs: [],
  introTitle: "강남 가라오케 2위",
  introParagraphs: ["강남 퍼펙트는 이름처럼 전반적인 완성도가 높은 업소입니다. 달토 대비 소폭 저렴한 가격대와 안정적인 서비스로 인기가 높습니다."],
  priceRows: [
    { name: "기본 세트", desc: "양주 1병 + 안주 + 초이스", duration: "2인 이상 · 2시간", price: "52만원~", badge: "recommend" },
    { name: "프리미엄 세트", desc: "양주 2병 + 안주 풀세팅", duration: "2인 이상 · 3시간", price: "78만원~", badge: "popular" },
  ],
  nearbyVenues: [
    { rank: 1, name: "달토 가라오케", href: "/gangnam/karaoke/dalto", sub: "리뷰 87개", score: "4.9" },
    { rank: 2, name: "퍼펙트 가라오케", href: "/gangnam/karaoke/perfect", sub: "현재 페이지", score: "4.8" },
    { rank: 3, name: "스카이 가라오케", href: "/gangnam/karaoke/skylounge", sub: "리뷰 44개", score: "4.6" },
    { rank: 4, name: "스타 가라오케", href: "/gangnam/karaoke/star", sub: "리뷰 38개", score: "4.5" },
  ],
  seoKwLinks: [
    { href: "/gangnam/karaoke/perfect", text: "퍼펙트 가라오케" },
    { href: "/gangnam/karaoke/perfect/reviews", text: "퍼펙트 가라오케 후기" },
    { href: "/gangnam/category/karaoke", text: "강남 가라오케 추천" },
    { href: "/gangnam", text: "강남 유흥 정보" },
  ],
});
(FALLBACK_DETAIL.gangnam as Record<string, VenueDetail>).intro = fillVenueFromBase(dalto, {
  slug: "intro", name: "인트로 하이퍼블릭", type: "하이퍼블릭", categorySlug: "highpublic", url: "/gangnam/highpublic/intro",
  rating: "4.5", reviewCount: 42, infoCards: [
    { label: "💰 1인 주대", val: "78만원~", sub: "기본", gold: true },
    { label: "👥 라인업", val: "40명+", sub: "주말 기준" },
    { label: "🕐 영업시간", val: "20시~", sub: "연중무휴", green: true },
    { label: "🅿 주차", val: "발렛", sub: "운영" },
  ],
  tagline: "강남 하이퍼블릭 가성비 1위",
  introHeadline: "인트로 하이퍼블릭 — 강남 하이퍼블릭 가성비 1위",
  introLead: "강남 인트로 하이퍼블릭은 신규 오픈 후 빠르게 자리 잡은 프리미엄 하이퍼블릭입니다.",
  introBodyParagraphs: [],
  introTitle: "강남 하이퍼블릭 가성비 1위", introParagraphs: ["강남 인트로 하이퍼블릭은 신규 오픈 후 빠르게 자리 잡은 프리미엄 하이퍼블릭입니다."],
  priceRows: [
    { name: "기본", desc: "초이스 + 서비스", duration: "2인 이상 · 2시간", price: "78만원~", badge: "recommend" },
  ],
  nearbyVenues: [
    { rank: 1, name: "인트로 하이퍼블릭", href: "/gangnam/highpublic/intro", sub: "현재 페이지", score: "4.5" },
    { rank: 2, name: "다이아몬드 하이퍼블릭", href: "/gangnam/highpublic/diamond", sub: "리뷰 34개", score: "4.7" },
    { rank: 3, name: "달토 가라오케", href: "/gangnam/karaoke/dalto", sub: "리뷰 87개", score: "4.9" },
  ],
  seoKwLinks: [
    { href: "/gangnam/highpublic/intro", text: "인트로 하이퍼블릭" },
    { href: "/gangnam/category/highpublic", text: "강남 하이퍼블릭 추천" },
    { href: "/gangnam", text: "강남 유흥 정보" },
  ],
});
(FALLBACK_DETAIL.gangnam as Record<string, VenueDetail>)["99"] = fillVenueFromBase(dalto, {
  slug: "99", name: "구구단 쩜오", type: "쩜오", categorySlug: "jjomoh", url: "/gangnam/jjomoh/99",
  rating: "4.4", reviewCount: 38, infoCards: [
    { label: "💰 1인 주대", val: "48만원~", sub: "기본", gold: true },
    { label: "👥 라인업", val: "35명+", sub: "주말" },
    { label: "🕐 영업시간", val: "21시~", sub: "연중무휴", green: true },
    { label: "🅿 주차", val: "가능", sub: "주차 가능" },
  ],
  tagline: "강남 쩜오 가성비 1위",
  introHeadline: "구구단 쩜오 — 강남 쩜오 가성비 1위",
  introLead: "구구단 쩜오는 하이퍼블릭 대비 합리적인 가격대의 강남 대표 쩜오입니다.",
  introBodyParagraphs: [],
  introTitle: "강남 쩜오 가성비 1위", introParagraphs: ["구구단 쩜오는 하이퍼블릭 대비 합리적인 가격대의 강남 대표 쩜오입니다."],
  priceRows: [{ name: "기본", desc: "초이스 + 서비스", duration: "2인 이상 · 2시간", price: "48만원~", badge: "recommend" }],
  seoKwLinks: [
    { href: "/gangnam/jjomoh/99", text: "구구단 쩜오" },
    { href: "/gangnam/category/jjomoh", text: "강남 쩜오 추천" },
  ],
});
(FALLBACK_DETAIL.gangnam as Record<string, VenueDetail>).diamond = fillVenueFromBase(dalto, {
  slug: "diamond", name: "다이아몬드 하이퍼블릭", type: "하이퍼블릭", categorySlug: "highpublic", url: "/gangnam/highpublic/diamond",
  rating: "4.7", reviewCount: 34, infoCards: [
    { label: "💰 1인 주대", val: "80만원~", sub: "기본", gold: true },
    { label: "👥 라인업", val: "45명+", sub: "주말" },
    { label: "🕐 영업시간", val: "19시~", sub: "연중무휴", green: true },
    { label: "🅿 주차", val: "발렛", sub: "운영" },
  ],
  tagline: "강남 하이퍼블릭 탑5",
  introHeadline: "다이아몬드 하이퍼블릭 — 강남 하이퍼블릭 탑5",
  introLead: "다이아몬드 하이퍼블릭은 강남 하이퍼블릭 탑5 안에 드는 프리미엄 업소입니다.",
  introBodyParagraphs: [],
  introTitle: "강남 하이퍼블릭 탑5", introParagraphs: ["다이아몬드 하이퍼블릭은 강남 하이퍼블릭 탑5 안에 드는 프리미엄 업소입니다."],
  priceRows: [{ name: "기본", desc: "초이스 + 서비스", duration: "2인 이상 · 2시간", price: "80만원~", badge: "recommend" }],
  seoKwLinks: [{ href: "/gangnam/highpublic/diamond", text: "다이아몬드 하이퍼블릭" }, { href: "/gangnam/category/highpublic", text: "강남 하이퍼블릭" }],
});
(FALLBACK_DETAIL.gangnam as Record<string, VenueDetail>).skylounge = fillVenueFromBase(dalto, {
  slug: "skylounge", name: "스카이라운지 퍼블릭", type: "퍼블릭", categorySlug: "public", url: "/gangnam/public/skylounge",
  rating: "4.4", reviewCount: 29, infoCards: [
    { label: "💰 1인 주대", val: "38만원~", sub: "기본", gold: true },
    { label: "👥 라인업", val: "30명+", sub: "주말" },
    { label: "🕐 영업시간", val: "18시~", sub: "연중무휴", green: true },
    { label: "🅿 주차", val: "가능", sub: "주차 가능" },
  ],
  tagline: "강남 퍼블릭 입문 추천",
  introHeadline: "스카이라운지 퍼블릭 — 강남 퍼블릭 입문 추천",
  introLead: "스카이라운지 퍼블릭은 강남에서 가성비를 찾는 분들에게 추천하는 퍼블릭입니다.",
  introBodyParagraphs: [],
  introTitle: "강남 퍼블릭 입문 추천", introParagraphs: ["스카이라운지 퍼블릭은 강남에서 가성비를 찾는 분들에게 추천하는 퍼블릭입니다."],
  priceRows: [{ name: "기본", desc: "노래방 + 초이스", duration: "2인 이상 · 2시간", price: "38만원~", badge: "recommend" }],
  seoKwLinks: [{ href: "/gangnam/public/skylounge", text: "스카이라운지 퍼블릭" }, { href: "/gangnam/category/public", text: "강남 퍼블릭" }],
});

(FALLBACK_DETAIL as Record<string, Record<string, VenueDetail>>).suwon = {
  aura: fillVenueFromBase(dalto, { slug: "aura", name: "아우라 가라오케", type: "하이퍼블릭", categorySlug: "highpublic", region: "수원 인계동", regionSlug: "suwon", url: "/suwon/highpublic/aura", rating: "4.6", reviewCount: 72, contact: "031-000-0000", location: "인계동", locationDetail: "수원시 팔달구 인계동", nearbyVenues: [], similarVenues: [], seoKwLinks: [{ href: "/suwon/highpublic/aura", text: "아우라 가라오케" }], seoCols: [] }),
  mazinga: fillVenueFromBase(dalto, { slug: "mazinga", name: "마징가 가라오케", type: "퍼블릭", categorySlug: "public", region: "수원 인계동", regionSlug: "suwon", url: "/suwon/public/mazinga", rating: "4.5", reviewCount: 58, contact: "031-000-0001", location: "인계동", nearbyVenues: [], similarVenues: [], seoKwLinks: [], seoCols: [] }),
  mechander: fillVenueFromBase(dalto, { slug: "mechander", name: "메칸더 셔츠룸", type: "셔츠룸", categorySlug: "shirtroom", region: "수원 인계동", regionSlug: "suwon", url: "/suwon/shirtroom/mechander", rating: "4.4", reviewCount: 45, contact: "031-000-0002", location: "인계동", nearbyVenues: [], similarVenues: [], seoKwLinks: [], seoCols: [] }),
};
(FALLBACK_DETAIL as Record<string, Record<string, VenueDetail>>).dongtan = {
  venus: fillVenueFromBase(dalto, { slug: "venus", name: "비너스 셔츠룸", type: "셔츠룸", categorySlug: "shirtroom", region: "동탄", regionSlug: "dongtan", url: "/dongtan/shirtroom/venus", rating: "4.5", reviewCount: 52, contact: "031-000-0003", location: "동탄면", nearbyVenues: [], similarVenues: [], seoKwLinks: [], seoCols: [] }),
  aurora: fillVenueFromBase(dalto, { slug: "aurora", name: "오로라 가라오케", type: "가라오케", categorySlug: "karaoke", region: "동탄", regionSlug: "dongtan", url: "/dongtan/karaoke/aurora", rating: "4.3", reviewCount: 38, contact: "031-000-0004", location: "동탄면", nearbyVenues: [], similarVenues: [], seoKwLinks: [], seoCols: [] }),
  star: fillVenueFromBase(dalto, { slug: "star", name: "스타 퍼블릭", type: "퍼블릭", categorySlug: "public", region: "동탄", regionSlug: "dongtan", url: "/dongtan/public/star", rating: "4.2", reviewCount: 29, contact: "031-000-0005", location: "동탄면", nearbyVenues: [], similarVenues: [], seoKwLinks: [], seoCols: [] }),
  "dongtan-choigga": fillVenueFromBase(dalto, { slug: "dongtan-choigga", name: "동탄최저가", type: "가라오케", categorySlug: "karaoke", region: "동탄", regionSlug: "dongtan", url: "/dongtan/karaoke/dongtan-choigga", rating: "4.0", reviewCount: 0, contact: "", location: "동탄", nearbyVenues: [], similarVenues: [], seoKwLinks: [], seoCols: [] }),
};
(FALLBACK_DETAIL as Record<string, Record<string, VenueDetail>>).jeju = {
  zenith: fillVenueFromBase(dalto, { slug: "zenith", name: "제니스 클럽", type: "가라오케", categorySlug: "karaoke", region: "제주", regionSlug: "jeju", url: "/jeju/karaoke/zenith", rating: "4.4", reviewCount: 41, contact: "064-000-0000", location: "연동", nearbyVenues: [], similarVenues: [], seoKwLinks: [], seoCols: [] }),
  oceanview: fillVenueFromBase(dalto, { slug: "oceanview", name: "오션뷰 가라오케", type: "가라오케", categorySlug: "karaoke", region: "제주", regionSlug: "jeju", url: "/jeju/karaoke/oceanview", rating: "4.2", reviewCount: 28, contact: "064-000-0001", location: "노형동", nearbyVenues: [], similarVenues: [], seoKwLinks: [], seoCols: [] }),
};

export async function getVenueDetail(
  regionSlug: string,
  categorySlug: string,
  venueSlug: string
): Promise<VenueDetail | null> {
  const typeName = SLUG_TO_TYPE[categorySlug];
  const regionName = REGION_SLUG_TO_NAME[regionSlug];

  if (!(REGION_SLUGS as readonly string[]).includes(regionSlug) || !typeName || !regionName) {
    return null;
  }

  // 1) Partners에서 매칭 시도 (DB 제휴업체가 우선) — 실패 시 fallback으로
  let partners: Awaited<ReturnType<typeof getPartners>> = [];
  try {
    partners = await getPartners();
  } catch {
    partners = [];
  }
  // 유형 매칭 유연화: 노래방↔가라오케 등 동일 종목 slug
  const typeSlug = TYPE_TO_SLUG[typeName];
  const match = partners.find((p) => {
    const pRegionMatch = p.region?.includes(regionName) || regionName?.includes(p.region ?? "");
    const pTypeSlug = TYPE_TO_SLUG[p.type];
    const pTypeMatch = p.type === typeName || (pTypeSlug && typeSlug && pTypeSlug === typeSlug);
    const pVenueSlug = extractVenueSlugFromHref(p.href) || nameToSlug(p.name);
    const pSlugMatch = pVenueSlug === venueSlug;
    return pRegionMatch && pTypeMatch && pSlugMatch;
  });

  if (match) {
    let venue = partnerToVenueDetail(match, regionSlug, categorySlug, venueSlug);
    // 제휴업체도 venue_intros에 v2가 있으면 적용 (정확한 맵핑)
    try {
      const { data: introRow } = await supabaseAdmin
        .from("venue_intros")
        .select("intro_ai_json, is_applied")
        .eq("partner_id", match.id)
        .not("intro_ai_json", "is", null)
        .order("is_applied", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const introJson = introRow?.intro_ai_json as { v2?: { tagline?: string; intro?: { label?: string; headline?: string; lead?: string; quote?: string; body_paragraphs?: string[] } } } | null;
      if (introJson?.v2?.intro) {
        const v2 = introJson.v2;
        const v2Intro = v2!.intro!;
        venue = {
          ...venue,
          tagline: v2.tagline ?? venue.tagline,
          introLabel: v2Intro.label ?? "ABOUT · 업소 소개",
          introHeadline: v2Intro.headline ?? `${match.name} 소개`,
          introLead: v2Intro.lead ?? "",
          introQuote: v2Intro.quote ?? undefined,
          introBodyParagraphs: v2Intro.body_paragraphs ?? [],
          introTitle: v2Intro.headline ?? `${match.name} 소개`,
          introParagraphs: [v2Intro.lead ?? "", ...(v2Intro.body_paragraphs ?? [])].filter(Boolean),
        };
      }
    } catch {
      /* ignore */
    }
    venue = await enrichVenueWithReviewPosts(venue, regionSlug, categorySlug, venueSlug);
    const similarFromPartners = buildSimilarVenuesFromPartners(partners, regionSlug, regionName, venueSlug, 3);
    venue = { ...venue, similarVenues: similarFromPartners.length > 0 ? similarFromPartners : venue.similarVenues };
    return await applyVenueEdits(venue, regionSlug, categorySlug, venueSlug);
  }

  // 2) Fallback 데이터로 대체 (partners에 없을 때)
  const regionFallback = FALLBACK_DETAIL[regionSlug];
  let fallbackVenue = regionFallback?.[venueSlug];
  if (fallbackVenue) {
    // AI 소개글 보강: partners에서 동일 업체 desc가 있으면 intro 덮어쓰기
    const pSlug = (p: Partner) => extractVenueSlugFromHref(p.href) || nameToSlug(p.name);
    const introPartner = partners.find((p) => {
      const regionOk = p.region?.includes(regionName) || regionName?.includes(p.region ?? "");
      const slugOk = pSlug(p) === venueSlug;
      const nameNorm = (s: string) => (s ?? "").replace(/\s+/g, "");
      const nameOk = nameNorm(p.name) === nameNorm(fallbackVenue!.name);
      return (regionOk && (slugOk || nameOk)) && (p.desc ?? "").trim().length > 0;
    });
    let aiIntro: string | undefined;
    try {
        const { data: intros } = await supabaseAdmin
          .from("venue_intros")
          .select("form_json, intro_ai_json, is_applied, created_at")
          .order("created_at", { ascending: false })
          .limit(50);
        const nameNorm = (s: string) => (s ?? "").replace(/\s+/g, "");
        const targetName = nameNorm(fallbackVenue.name);
        const matching = (intros ?? []).filter((r) => {
          const form = r.form_json as { name?: string; region?: string } | null;
          if (!form?.name) return false;
          const rName = nameNorm(String(form.name));
          const rRegion = String(form.region ?? "");
          const regionOk = rRegion.includes(regionName) || regionName.includes(rRegion) || rRegion === regionSlug;
          return (rName === targetName || nameToSlug(form.name) === venueSlug) && regionOk;
        });
        const row = matching.sort((a, b) => {
          const aApplied = (a as { is_applied?: boolean }).is_applied ? 1 : 0;
          const bApplied = (b as { is_applied?: boolean }).is_applied ? 1 : 0;
          if (bApplied !== aApplied) return bApplied - aApplied;
          return new Date((b as { created_at?: string }).created_at ?? 0).getTime() - new Date((a as { created_at?: string }).created_at ?? 0).getTime();
        })[0];
        const introJson = row?.intro_ai_json as { content?: string; v2?: { tagline?: string; intro?: { label?: string; headline?: string; lead?: string; quote?: string; body_paragraphs?: string[] } } } | null;
        const content = introJson?.content?.trim();
        const v2 = introJson?.v2;
        if (content) aiIntro = content;
        if (v2?.intro) {
          const v2Intro = v2.intro;
          const name = introPartner?.name ?? fallbackVenue.name;
          fallbackVenue = {
            ...fallbackVenue,
            tagline: v2.tagline ?? fallbackVenue.tagline,
            introLabel: v2Intro!.label ?? "ABOUT · 업소 소개",
            introHeadline: v2Intro!.headline ?? `${name} 소개`,
            introLead: v2Intro!.lead ?? "",
            introQuote: v2Intro!.quote ?? undefined,
            introBodyParagraphs: v2Intro!.body_paragraphs ?? [],
            introTitle: v2Intro!.headline ?? `${name} 소개`,
            introParagraphs: [v2Intro!.lead ?? "", ...(v2Intro!.body_paragraphs ?? [])].filter(Boolean),
          };
        }
      } catch {
        /* ignore */
      }
    if (!aiIntro) aiIntro = introPartner?.desc?.trim();
    if (aiIntro) {
      const paras = descToIntroParagraphs(aiIntro);
      const name = introPartner?.name ?? fallbackVenue.name;
      const regionName = REGION_SLUG_TO_NAME[regionSlug] ?? regionSlug;
      const typeName = SLUG_TO_TYPE[categorySlug] ?? "";
      const v2 = plainToV2Intro(name, regionName, typeName, paras.length > 0 ? paras : [aiIntro]);
      fallbackVenue = {
        ...fallbackVenue,
        ...v2,
        introTitle: `${name} 소개`,
        introParagraphs: paras.length > 0 ? paras : [aiIntro],
      };
    }
    fallbackVenue = await enrichVenueWithReviewPosts(fallbackVenue, regionSlug, categorySlug, venueSlug);
    const similarFromPartners = buildSimilarVenuesFromPartners(partners, regionSlug, regionName, venueSlug, 3);
    fallbackVenue = { ...fallbackVenue, similarVenues: similarFromPartners.length > 0 ? similarFromPartners : fallbackVenue.similarVenues };
    return await applyVenueEdits(fallbackVenue, regionSlug, categorySlug, venueSlug);
  }

  return null;
}

/** review_posts에서 해당 업체 리뷰 조회 후 venue.reviews/reviewCount 덮어쓰기 */
async function enrichVenueWithReviewPosts(
  venue: VenueDetail,
  regionSlug: string,
  categorySlug: string,
  venueSlug: string
): Promise<VenueDetail> {
  try {
    const posts = await getReviewPostsByVenue(regionSlug, venueSlug, undefined, 1000);
    if (posts.length === 0) return venue;
    const reviews = posts.map((p) => {
      const body = (p.sec_overview || p.sec_summary || "").trim();
      const totalChars = (p.sec_overview || '').length + (p.sec_lineup || '').length + (p.sec_price || '').length + (p.sec_facility || '').length + ((p.sec_summary && p.sec_summary !== p.sec_overview) ? (p.sec_summary || '').length : 0);
      return {
        id: p.id,
        href: buildReviewUrl(regionSlug, p.type, venueSlug, p.slug),
        title: p.title,
        stars: formatStars(p.star),
        starsNum: String(p.star),
        body: body.slice(0, 500) + (body.length > 500 ? "..." : ""),
        date: p.published_at
          ? new Date(p.published_at).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "")
          : "",
        charCount: `약 ${Math.round(totalChars / 100) * 100 || 300}자`,
      };
    });
    return {
      ...venue,
      reviewCount: posts.length,
      reviews,
    };
  } catch {
    return venue;
  }
}

/** venue_edits 테이블의 편집 데이터를 venue에 병합 */
async function applyVenueEdits(
  venue: VenueDetail,
  regionSlug: string,
  categorySlug: string,
  venueSlug: string
): Promise<VenueDetail> {
  try {
    const { data: row, error } = await supabaseAdmin
      .from("venue_edits")
      .select("edits_json")
      .eq("region_slug", regionSlug)
      .eq("category_slug", categorySlug)
      .eq("venue_slug", venueSlug)
      .maybeSingle();

    if (error && process.env.NODE_ENV === "development") {
      console.error("[venue_edits] select error:", error.message);
    }

    const edits = (row?.edits_json ?? {}) as Record<string, Record<string, unknown>>;
    if (Object.keys(edits).length === 0) return venue;

    let out = { ...venue };

    const hero = edits.hero;
    if (hero && typeof hero === "object") {
      if (typeof hero.name === "string") out.name = hero.name;
      if (typeof hero.tagline === "string") out.tagline = hero.tagline;
      if (typeof hero.contact === "string") out.contact = hero.contact;
      if (typeof hero.kakaoUrl === "string") out.kakaoUrl = hero.kakaoUrl;
      if (typeof hero.hours === "string") out.hours = hero.hours;
      if (typeof hero.locationDetail === "string") out.locationDetail = hero.locationDetail;
      if (typeof hero.locationSub === "string") out.locationSub = hero.locationSub;
      if (Array.isArray(hero.infoCards) && hero.infoCards.length > 0) {
        out.infoCards = hero.infoCards as VenueDetail["infoCards"];
      }
    }

    const price = edits.price;
    if (price && typeof price === "object") {
      if (typeof price.lead === "string") out.priceLead = price.lead;
      if (typeof price.note === "string") out.priceNote = price.note;
      if (Array.isArray(price.rows) && price.rows.length > 0) {
        out.priceRows = price.rows as VenueDetail["priceRows"];
      }
    }

    const intro = edits.intro;
    if (intro && typeof intro === "object") {
      if (typeof intro.headline === "string") out.introHeadline = intro.headline;
      if (typeof intro.lead === "string") out.introLead = intro.lead;
      if (typeof intro.quote === "string") out.introQuote = intro.quote;
      if (Array.isArray(intro.bodyParagraphs)) out.introBodyParagraphs = intro.bodyParagraphs as string[];
    }

    const map = edits.map;
    if (map && typeof map === "object") {
      if (typeof map.embed === "string") out.mapEmbed = map.embed;
      if (typeof map.address === "string") out.locationDetail = map.address;
      if (typeof map.addressSub === "string") out.locationSub = map.addressSub;
    }

    const seo = edits.seo;
    if (seo && typeof seo === "object") {
      if (Array.isArray(seo.seoCols)) out.seoCols = seo.seoCols as VenueDetail["seoCols"];
      if (Array.isArray(seo.seoKwLinks)) out.seoKwLinks = seo.seoKwLinks as VenueDetail["seoKwLinks"];
    }

    return out;
  } catch {
    return venue;
  }
}

/** AI 소개 텍스트를 페이지 introParagraphs 형식으로 변환 (빈 줄로 단락 구분) */
function descToIntroParagraphs(desc: string | undefined): string[] {
  if (!desc?.trim()) return [];
  const paras = desc.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return paras.length > 0 ? paras : [desc.trim()];
}

/** v1 paragraphs → v2 intro 필드 변환 (구조화 JSON 없을 때 fallback) */
function plainToV2Intro(
  name: string,
  regionName: string,
  typeName: string,
  paras: string[]
): Pick<VenueDetail, "tagline" | "introHeadline" | "introLead" | "introQuote" | "introBodyParagraphs"> {
  const lead = paras[0] ?? "";
  const rest = paras.slice(1);
  // 2번째 단락이 30자 이상이고 인용 느낌이면 quote로 처리 (휴리스틱)
  const maybeQuote = rest[0];
  const useQuote = maybeQuote && maybeQuote.length >= 30 && (maybeQuote.includes("~") || maybeQuote.includes("·") || maybeQuote.includes("기준"));
  const quote = useQuote ? maybeQuote : undefined;
  const body = useQuote ? rest.slice(1) : rest;
  return {
    tagline: `${regionName} ${typeName} — ${name} 상세 정보`,
    introHeadline: `${name} — ${regionName} ${typeName} 소개`,
    introLead: lead,
    introQuote: quote,
    introBodyParagraphs: body,
  };
}

function partnerToVenueDetail(
  p: Partner,
  regionSlug: string,
  categorySlug: string,
  venueSlug: string
): VenueDetail {
  const defaultDetail = FALLBACK_DETAIL.gangnam?.dalto;
  const base = defaultDetail ?? ({} as VenueDetail);
  const paras = descToIntroParagraphs(p.desc);
  const regionName = REGION_SLUG_TO_NAME[regionSlug] ?? p.region ?? regionSlug;
  const typeName = SLUG_TO_TYPE[categorySlug] ?? p.type ?? "";
  const v2 = paras.length > 0 ? plainToV2Intro(p.name, regionName, typeName, paras) : {};
  const venueUrl = buildVenueUrl(regionSlug, categorySlug, venueSlug);

  // 제휴업체는 업소명 기준 문구 사용. 샘플(달토) 가이드/리뷰 미사용 — DB·venue_edits에서만 표시
  const priceLeadDefault = `${p.name}는 입장 전 가격을 명확히 안내하며, 안내받은 금액 그대로 결제됩니다.`;
  const seoKwLinksForVenue: VenueDetail["seoKwLinks"] = [
    { href: venueUrl, text: p.name },
    { href: `${venueUrl}/reviews`, text: `${p.name} 후기` },
    { href: venueUrl, text: `${p.name} 가격` },
    { href: venueUrl, text: `${p.name} 위치` },
    { href: `/${regionSlug}`, text: `${regionName} 유흥 정보` },
  ];

  return {
    ...base,
    ...v2,
    slug: venueSlug,
    name: p.name,
    region: p.region,
    regionSlug,
    type: p.type,
    categorySlug,
    url: venueUrl,
    ad: true,
    rating: "4.5",
    stars: p.stars ?? "★★★★☆",
    reviewCount: 0,
    updateText: "최근 업데이트됨",
    contact: p.contact?.replace(/^📞\s*/, "") ?? "",
    location: p.location || "주소 입력 예정",
    locationDetail: p.location || "",
    locationSub: base.locationSub,
    hours: "영업시간 문의",
    infoCards: base.infoCards ?? [],
    introTitle: `${p.name} 소개`,
    introParagraphs: paras.length > 0 ? paras : [p.desc?.trim() || "업소 소개를 입력해 주세요."],
    priceLead: priceLeadDefault,
    priceRows: base.priceRows ?? [],
    priceNote: base.priceNote ?? "",
    opList: base.opList ?? [],
    stats: base.stats ?? [],
    nearbyVenues: base.nearbyVenues ?? [],
    similarVenues: base.similarVenues ?? [],
    seoKwLinks: seoKwLinksForVenue,
    seoCols: [],
    reviews: [],
    reviewBars: base.reviewBars ?? [],
    aspects: base.aspects ?? [],
  };
}
