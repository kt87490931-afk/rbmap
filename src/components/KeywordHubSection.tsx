import Link from "next/link";

interface KeywordCol {
  region: string;
  links: { href: string; text: string }[];
}

const DEFAULT_COLS: KeywordCol[] = [
  {
    region: "강남",
    links: [
      { href: "/gangnam", text: "강남 가라오케" },
      { href: "/gangnam/highpublic", text: "강남 하이퍼블릭" },
      { href: "/gangnam/shirtroom", text: "강남 셔츠룸" },
      { href: "/gangnam/jjomoh", text: "강남 쩜오" },
    ],
  },
  {
    region: "수원 인계동",
    links: [
      { href: "/suwon", text: "수원 인계동 가라오케" },
      { href: "/suwon/highpublic", text: "수원 하이퍼블릭" },
      { href: "/suwon/shirtroom", text: "수원 셔츠룸" },
    ],
  },
  {
    region: "동탄",
    links: [
      { href: "/dongtan", text: "동탄 가라오케" },
      { href: "/dongtan/shirtroom", text: "동탄 셔츠룸" },
    ],
  },
  {
    region: "제주",
    links: [
      { href: "/jeju", text: "제주 가라오케" },
      { href: "/jeju/public", text: "제주 퍼블릭" },
    ],
  },
];

interface KeywordHubSectionProps {
  cols?: KeywordCol[];
}

export default function KeywordHubSection({ cols = DEFAULT_COLS }: KeywordHubSectionProps) {
  const list = cols.length > 0 ? cols : DEFAULT_COLS;
  return (
    <section className="keyword-hub section bg-deep" aria-label="지역별 검색 키워드">
      <div className="section-inner">
        <span className="section-label">SEO KEYWORD HUB</span>
        <h2 className="section-h2" style={{ marginBottom: 24 }}>지역별 <em>유흥 정보 검색</em></h2>
        <div className="kw-grid">
          {list.map((col, i) => (
            <div key={col.region ?? i} className="kw-col">
              <h3 className="kw-region">{col.region}</h3>
              <ul>
                {(col.links ?? []).map((link, j) => (
                  <li key={j}>
                    <Link href={link.href}>{link.text}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
