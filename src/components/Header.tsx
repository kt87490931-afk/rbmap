import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
  cta?: boolean;
}

interface HeaderData {
  logo_icon?: string;
  logo_text?: string;
  logo_sub?: string;
  search_placeholder?: string;
  nav?: NavItem[];
}

const DEFAULT: HeaderData = {
  logo_icon: "빵",
  logo_text: "룸빵여지도",
  logo_sub: "ROOMBANG YEOJIDO",
  search_placeholder: "지역, 업소명, 업종 검색...",
  nav: [
    { label: "리뷰", href: "/reviews" },
    { label: "랭킹", href: "/ranking" },
    { label: "가이드", href: "/guide" },
    { label: "광고문의", href: "/contact", cta: true },
  ],
};

export default function Header({ data }: { data?: HeaderData | null }) {
  const d = { ...DEFAULT, ...data };
  const nav = d.nav ?? DEFAULT.nav ?? [];
  return (
    <header className="header-main">
      <Link href="/" className="logo">
        <div className="logo-icon">{d.logo_icon}</div>
        <div>
          <div className="logo-text">{d.logo_text}</div>
          <div className="logo-sub">{d.logo_sub}</div>
        </div>
      </Link>
      <div className="header-search">
        <span className="hs-icon">🔍</span>
        <input type="text" placeholder={d.search_placeholder} />
      </div>
      <nav className="nav-main">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={item.cta ? "nav-cta" : "hide-sm"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
