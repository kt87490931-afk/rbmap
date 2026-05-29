import Link from "next/link";
import { ContactTapToCall } from "@/components/venue/ContactTapToCall";

export interface VenueCard {
  href: string;
  region: string;
  name: string;
  star: string;
  type: string;
  contact?: string;
  price?: string;
  desc?: string;
}

interface FeaturedVenuesSectionProps {
  venues?: VenueCard[];
}

const DEFAULT_VENUES: VenueCard[] = [
  { href: "/gangnam/karaoke/dalto", region: "강남", name: "달토 가라오케", star: "★4.9", type: "가라오케", contact: undefined, price: "1인 약 25만원~", desc: "강남 최상급 라인업. 3월 신규 멤버 입점." },
  { href: "/suwon/highpublic/aura", region: "수원 인계동", name: "아우라 하이퍼블릭", star: "★4.9", type: "하이퍼블릭", contact: undefined, price: "1인 약 22만원~", desc: "수원 인계동 대표 프리미엄 하이퍼블릭." },
  { href: "/dongtan/shirtroom/venus", region: "동탄", name: "비너스 셔츠룸", star: "★4.8", type: "셔츠룸", contact: undefined, price: "1인 약 20만원~", desc: "동탄 신도시 대표 셔츠룸 업소." },
  { href: "/jeju/karaoke/zenith", region: "제주", name: "제니스 클럽", star: "★4.8", type: "가라오케", contact: undefined, price: "1인 약 28만원~", desc: "제주 관광객도 안심하는 검증 업소." },
];

export default function FeaturedVenuesSection({ venues }: FeaturedVenuesSectionProps) {
  const list = venues?.length ? venues : DEFAULT_VENUES;

  return (
    <section className="w-full bg-white py-10 md:py-14" aria-label="추천 업소">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 text-lg">
              🔥
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 md:text-xl">지역별 주요 업소</h2>
              <p className="mt-0.5 text-xs text-gray-500 md:text-sm">각 지역에서 인기 있는 추천 업소</p>
            </div>
          </div>
          <Link href="/regions" className="text-sm font-semibold text-insta-pink hover:text-insta-purple">
            전체 업소 보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-5">
          {list.map((v, i) => (
            <Link
              key={v.href ?? i}
              href={v.href}
              className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:border-pink-100 hover:shadow-lg hover:shadow-pink-100/30"
            >
              <div className="relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br from-pink-100 via-purple-50 to-pink-50 md:h-32">
                <span className="text-4xl opacity-40">🎤</span>
                <div className="absolute left-2 top-2">
                  <span className="inline-flex items-center rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
                    {v.region}
                  </span>
                </div>
                <div className="absolute right-2 top-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
                    ⭐ {v.star}
                  </span>
                </div>
              </div>
              <div className="p-3 md:p-4">
                <div className="mb-1 text-xs font-medium text-insta-pink">{v.type}</div>
                <h3 className="mb-1 truncate text-sm font-semibold text-gray-900 md:text-base group-hover:text-insta-pink">
                  {v.name}
                </h3>
                {v.contact && <ContactTapToCall contact={v.contact} className="mb-2 block text-xs text-gray-600" />}
                {v.price && <div className="mb-2 text-xs text-gray-500">{v.price}</div>}
                {v.desc && <p className="mb-3 line-clamp-2 text-xs text-gray-500 leading-relaxed">{v.desc}</p>}
                <span className="inline-flex rounded-full bg-gradient-to-r from-insta-pink to-insta-purple px-3 py-1.5 text-xs font-medium text-white">
                  상세보기 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
