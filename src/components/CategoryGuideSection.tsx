import Link from "next/link";

interface CategoryItem {
  slug: string;
  icon: string;
  label: string;
  desc: string;
  count: string;
}

interface CategoryGuideSectionProps {
  data?: { items?: CategoryItem[] };
  items?: CategoryItem[];
}

const DEFAULT_ITEMS: CategoryItem[] = [
  { slug: "karaoke", icon: "🎤", label: "가라오케", desc: "노래방 형태의 룸에서 파트너와 함께 즐기는 가장 보편적인 업종", count: "168개 업소" },
  { slug: "highpublic", icon: "💎", label: "하이퍼블릭", desc: "퍼블릭보다 밀착 서비스가 강화된 프리미엄 형태의 업종", count: "72개 업소" },
  { slug: "shirtroom", icon: "👔", label: "셔츠룸", desc: "파트너의 한복 이벤트가 포함된 서비스 형태", count: "54개 업소" },
  { slug: "jjomoh", icon: "⭐", label: "쩜오 (0.5)", desc: "하이퍼블릭과 퍼블릭의 중간 단계 서비스", count: "31개 업소" },
  { slug: "public", icon: "🥂", label: "퍼블릭", desc: "대중적으로 즐기기 좋은 가장 접근하기 쉬운 형태", count: "86개 업소" },
  { slug: "hostbar", icon: "🏆", label: "호스트바", desc: "남성 파트너와 함께하는 여성 고객 대상 서비스", count: "18개 업소" },
];

export default function CategoryGuideSection({ data, items }: CategoryGuideSectionProps) {
  const list = (items ?? data?.items ?? DEFAULT_ITEMS).length > 0 ? (items ?? data?.items ?? DEFAULT_ITEMS) : DEFAULT_ITEMS;
  return (
    <section className="section bg-deep" aria-label="업종별 완전 이해">
      <div className="section-inner">
        <div className="section-head-row">
          <div>
            <span className="section-label">CATEGORY GUIDE</span>
            <h2 className="section-h2">업종별 <em>완전 이해</em></h2>
          </div>
        </div>
        <nav className="category-grid" aria-label="업종 선택">
          {list.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="cat-card">
              <div className="cat-icon">{c.icon}</div>
              <div className="cat-name">{c.label}</div>
              <div className="cat-desc">{c.desc}</div>
              <div className="cat-count">{c.count}</div>
              <div className="cat-link">{c.label} 업소 보기 →</div>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
