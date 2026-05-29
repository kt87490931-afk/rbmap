import Link from "next/link";

interface FooterCol {
  title?: string;
  items?: { label?: string; href?: string }[];
}

interface FooterData {
  desc?: string;
  copyright?: string;
  links?: { label?: string; href?: string }[];
  cols?: FooterCol[];
}

const DEFAULT: FooterData = {
  desc: "믿을 수 있는 업소를 한눈에! 룸빵여지도에서 전국 유흥 정보를 확인하세요. 검증된 업소와 실제 이용 후기가 당신의 선택을 돕습니다. 20분마다 자동으로 업데이트되는 최신 정보로 실패 없는 밤을 약속합니다.",
  copyright: "© 2025 룸빵여지도. All rights reserved. | 본 사이트의 정보는 참고용이며 실제와 다를 수 있습니다.",
  links: [
    { label: "개인정보처리방침", href: "/privacy" },
    { label: "이용약관", href: "/terms" },
  ],
  cols: [
    {
      title: "지역",
      items: [
        { label: "강남", href: "/gangnam" },
        { label: "수원 인계동", href: "/suwon" },
        { label: "동탄", href: "/dongtan" },
        { label: "제주", href: "/jeju" },
        { label: "전체 지역", href: "/regions" },
      ],
    },
    {
      title: "업종",
      items: [
        { label: "가라오케", href: "/category/karaoke" },
        { label: "하이퍼블릭", href: "/category/highpublic" },
        { label: "셔츠룸", href: "/category/shirtroom" },
        { label: "퍼블릭", href: "/category/public" },
        { label: "쩜오", href: "/category/jjomoh" },
      ],
    },
    {
      title: "서비스",
      items: [
        { label: "최신 리뷰", href: "/reviews" },
        { label: "인기 랭킹", href: "/ranking" },
        { label: "이용 가이드", href: "/guide" },
        { label: "광고 문의", href: "/contact" },
        { label: "사이트맵", href: "/sitemap.xml" },
      ],
    },
  ],
};

export default function Footer({ data }: { data?: FooterData | null }) {
  const d = { ...DEFAULT, ...data };
  const cols = d.cols ?? DEFAULT.cols ?? [];
  const links = d.links ?? DEFAULT.links ?? [];

  return (
    <footer className="border-t border-gray-100 bg-gray-50 text-gray-700">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 md:gap-10">
          <div className="lg:col-span-1">
            <Link href="/" className="mb-3 inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-insta-pink to-insta-purple text-sm text-white">
                빵
              </div>
              <span className="text-lg font-bold text-gray-900">룸빵여지도</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500">{d.desc}</p>
          </div>

          {cols.map((col, i) => (
            <div key={col.title ?? i}>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{col.title}</h3>
              <ul className="space-y-2">
                {(col.items ?? []).map((item, j) => (
                  <li key={j}>
                    <Link
                      href={item.href ?? "#"}
                      className="text-sm text-gray-500 transition-colors hover:text-insta-pink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 text-center md:flex-row md:text-left">
          <p className="text-xs text-gray-400">{d.copyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {links.map((l, i) => (
              <Link
                key={i}
                href={l.href ?? "#"}
                className="text-xs text-gray-500 transition-colors hover:text-insta-pink"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
