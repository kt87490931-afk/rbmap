import Link from "next/link";
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
  totalVenueCount?: number | null;
  regionCount?: number | null;
  totalReviewCount?: number | null;
}

const DEFAULT: HeroData = {
  eyebrow: "20분 자동 업데이트",
  h1_line1: "전국 룸빵 정보,",
  h1_line2: "여기서 다 찾자",
  desc_1: "검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다.",
  desc_2: "최신 정보로 실패 없는 밤을 약속합니다.",
  kpis: [
    { num: "—", label: "등록 지역" },
    { num: "—", label: "등록 업소" },
    { num: "—", label: "누적 리뷰" },
    { num: "20분", label: "업데이트" },
  ],
  btns: [
    { text: "🗺️ 지역 선택하기", href: "/regions" },
    { text: "최신 리뷰 →", href: "/reviews" },
  ],
};

const PIN_LAYOUT = [
  { top: "22%", left: "14%" },
  { top: "44%", right: "12%" },
  { top: "36%", left: "52%" },
  { top: "54%", left: "24%" },
  { top: "30%", left: "38%" },
  { bottom: "22%", right: "30%" },
  { top: "18%", right: "28%" },
  { top: "26%", left: "10%" },
];

export default function Hero({
  data,
  visitorCount,
  regions = [],
  partnerCounts,
  totalVenueCount,
  regionCount,
  totalReviewCount,
}: HeroProps) {
  const d = { ...DEFAULT, ...data };
  void partnerCounts;
  let kpis = d.kpis ?? DEFAULT.kpis ?? [];
  kpis = kpis.map((k) => {
    if (k.label === "등록 업소" || k.label === "제휴업소")
      return totalVenueCount != null && totalVenueCount >= 0 ? { ...k, num: String(totalVenueCount) } : k;
    if (k.label === "등록 지역")
      return regionCount != null && regionCount >= 0 ? { ...k, num: String(regionCount) } : k;
    if (k.label === "누적 리뷰")
      return totalReviewCount != null && totalReviewCount >= 0 ? { ...k, num: String(totalReviewCount) } : k;
    return k;
  });
  const btns = d.btns ?? DEFAULT.btns ?? [];
  const eyebrowText =
    visitorCount != null
      ? `오늘의접속자 : ${visitorCount.toLocaleString()}`
      : (d.eyebrow ?? DEFAULT.eyebrow);
  const activeRegions = regions.filter((r) => !r.coming).slice(0, 8);

  return (
    <section className="relative min-h-[560px] overflow-hidden bg-white md:min-h-[640px]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 flex flex-col justify-between py-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`h-${i}`} className="h-px w-full bg-gradient-to-r from-transparent via-pink-100/50 to-transparent" />
          ))}
        </div>
        <div className="absolute inset-0 flex flex-row justify-between px-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`v-${i}`} className="h-full w-px bg-gradient-to-b from-transparent via-purple-100/40 to-transparent" />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute -right-10 top-16 h-72 w-72 rounded-full bg-gradient-to-br from-pink-100/70 to-purple-100/70 blur-3xl md:h-96 md:w-96" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-gradient-to-tr from-purple-100/60 to-pink-100/60 blur-3xl md:h-80 md:w-80" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {activeRegions.map((r, i) => {
          const pos = PIN_LAYOUT[i % PIN_LAYOUT.length];
          return (
            <div
              key={r.slug}
              className="absolute flex animate-bounce flex-col items-center"
              style={{ ...pos, animationDuration: `${3 + (i % 3) * 0.4}s`, animationDelay: `${i * 0.3}s` }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-insta-pink to-insta-purple text-xs text-white shadow-lg shadow-pink-200/50">
                📍
              </div>
              <span className="mt-1 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
                {r.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-14 pt-14 text-center md:px-8 md:pt-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
          </span>
          <span className="text-sm font-medium text-pink-600">{eyebrowText}</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
          {d.h1_line1}
          <br />
          <span className="bg-gradient-to-r from-insta-pink to-insta-purple bg-clip-text text-transparent">
            {d.h1_line2}
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-500 md:text-lg">
          {d.desc_1}
          <br className="hidden md:block" />
          {d.desc_2}
        </p>

        <div className="mx-auto mb-10 max-w-2xl">
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/90 p-2 shadow-lg shadow-gray-100/50 backdrop-blur-md">
            <span className="pl-2 text-lg text-gray-400" aria-hidden>
              🔍
            </span>
            <span className="flex-1 text-left text-sm text-gray-400 md:text-base">
              지역, 업소명, 또는 업종을 검색해보세요
            </span>
            <Link
              href="/regions"
              className="whitespace-nowrap rounded-xl bg-gradient-to-r from-insta-pink to-insta-purple px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 md:px-6"
            >
              검색
            </Link>
          </div>
        </div>

        <div className="mb-10 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {kpis.map((k, i) => (
            <div key={i} className="flex items-center gap-6 md:gap-10">
              {i > 0 ? <div className="hidden h-10 w-px bg-gray-200 md:block" aria-hidden /> : null}
              <div className="text-center">
                <div
                  className={`text-2xl font-bold md:text-3xl ${
                    i >= 2
                      ? "bg-gradient-to-r from-insta-pink to-insta-purple bg-clip-text text-transparent"
                      : "text-gray-900"
                  }`}
                >
                  {k.num}
                </div>
                <div className="mt-1 text-xs text-gray-500 md:text-sm">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {btns.map((b, i) => (
            <Link
              key={i}
              href={b.href ?? (i === 0 ? "/regions" : "/reviews")}
              className={
                i === 0
                  ? "rounded-xl bg-gradient-to-r from-insta-pink to-insta-purple px-6 py-3 text-sm font-semibold text-white shadow-md shadow-pink-200/40 transition-opacity hover:opacity-90"
                  : "rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-pink-200 hover:text-insta-pink"
              }
            >
              {b.text}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
