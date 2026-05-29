import Link from "next/link";
import type { Region } from "@/lib/data/regions";

const FALLBACK_REGIONS: Region[] = [
  { id: "1", slug: "gangnam", name: "강남", short: "GN", thumb_class: "gangnam", tags: ["가라오케", "하이퍼블릭", "쩜오"], venues: 82, reviews: 641, badge: "HOT", coming: false, sort_order: 0 },
  { id: "2", slug: "suwon", name: "수원", short: "SW", thumb_class: "suwon", tags: ["인계동", "셔츠룸", "퍼블릭"], venues: 61, reviews: 512, badge: null, coming: false, sort_order: 1 },
  { id: "3", slug: "dongtan", name: "동탄", short: "DT", thumb_class: "dongtan", tags: ["가라오케", "퍼블릭"], venues: 34, reviews: 218, badge: "NEW", coming: false, sort_order: 2 },
  { id: "4", slug: "jeju", name: "제주", short: "JJ", thumb_class: "jeju", tags: ["가라오케", "바"], venues: 28, reviews: 173, badge: null, coming: false, sort_order: 3 },
  { id: "5", slug: "incheon", name: "인천", short: "IC", thumb_class: "incheon", tags: ["준비중"], venues: 0, reviews: 0, badge: null, coming: true, sort_order: 4 },
  { id: "6", slug: "busan", name: "부산", short: "BS", thumb_class: "busan", tags: ["준비중"], venues: 0, reviews: 0, badge: null, coming: true, sort_order: 5 },
];

interface RegionsSectionProps {
  regions?: Region[];
}

export default function RegionsSection({ regions }: RegionsSectionProps) {
  const list = regions?.length ? regions : FALLBACK_REGIONS;

  return (
    <section className="w-full bg-white py-10 md:py-14" id="regions">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 text-lg">
              🗺️
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">지역별 정보</h2>
              <p className="mt-0.5 text-xs text-gray-500 md:text-sm">원하는 지역을 선택해서 업소를 찾아보세요</p>
            </div>
          </div>
          <Link href="/regions" className="text-sm font-semibold text-insta-pink hover:text-insta-purple">
            전체 지역 →
          </Link>
        </div>

        <nav
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          aria-label="지역 선택"
        >
          {list.map((r) =>
            r.coming ? (
              <div
                key={r.slug}
                className="relative rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-left opacity-70"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">{r.short}</span>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-500">준비중</span>
                </div>
                <div className="text-base font-bold text-gray-500">{r.name}</div>
                <div className="mt-2 text-xs text-gray-400">서비스 준비 중</div>
              </div>
            ) : (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className="group relative rounded-xl border border-gray-100 bg-white p-4 text-left transition-all duration-300 hover:border-transparent hover:shadow-lg hover:shadow-pink-100/50"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-pink-500/0 to-purple-500/0 opacity-0 transition-opacity group-hover:opacity-5" />
                <div className="relative">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-400">{r.short}</span>
                    {r.badge === "HOT" && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">HOT</span>
                    )}
                    {r.badge === "NEW" && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600">NEW</span>
                    )}
                  </div>
                  <div className="text-base font-bold text-gray-900 transition-colors group-hover:text-insta-pink md:text-lg">
                    {r.name}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{r.tags.slice(0, 3).join(" · ")}</div>
                  <div className="mt-3 text-xs text-gray-500">
                    <strong className="text-gray-800">{r.venues || "—"}</strong> 업소 ·{" "}
                    <strong className="text-gray-800">{r.reviews}</strong> 리뷰
                  </div>
                </div>
              </Link>
            )
          )}
        </nav>
      </div>
    </section>
  );
}
