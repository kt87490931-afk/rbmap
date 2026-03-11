import Link from "next/link";

const PRICE_ROWS = [
  { region: "강남", type: "가라오케", val: "55만", chg: "fl" },
  { region: "강남", type: "하이퍼블릭", val: "80만", chg: "up" },
  { region: "수원", type: "가라오케", val: "33만", chg: "fl" },
  { region: "수원", type: "셔츠룸", val: "38만", chg: "dn" },
  { region: "동탄", type: "가라오케", val: "30만", chg: "up" },
  { region: "제주", type: "가라오케", val: "28만", chg: "fl" },
];

const VENUE_RANKS = [
  { href: "/gangnam/venue/dalto", rank: 1, top: true, name: "달토 가라오케", sub: "강남 · 가라오케", score: "9.8" },
  { href: "/suwon/venue/aura", rank: 2, top: true, name: "아우라 가라오케", sub: "수원 인계동 · 하이퍼블릭", score: "9.6" },
  { href: "/gangnam/venue/perfect", rank: 3, top: true, name: "퍼펙트 가라오케", sub: "강남 · 가라오케", score: "9.4" },
  { href: "/dongtan/venue/venus", rank: 4, top: false, name: "비너스 셔츠룸", sub: "동탄 · 셔츠룸", score: "9.1" },
  { href: "/suwon/venue/mazinga", rank: 5, top: false, name: "마징가 가라오케", sub: "수원 인계동 · 퍼블릭", score: "8.9" },
  { href: "/jeju/venue/zenith", rank: 6, top: false, name: "제니스 클럽", sub: "제주 · 가라오케", score: "8.7" },
  { href: "/gangnam/venue/intro", rank: 7, top: false, name: "인트로 하이퍼블릭", sub: "강남 · 하이퍼블릭", score: "8.5" },
];

const CATEGORIES = [
  { href: "/category/karaoke", icon: "🎤", label: "가라오케", count: "168개" },
  { href: "/category/highpublic", icon: "💎", label: "하이퍼블릭", count: "72개" },
  { href: "/category/shirtroom", icon: "👔", label: "셔츠룸", count: "54개" },
  { href: "/category/public", icon: "🥂", label: "퍼블릭", count: "86개" },
  { href: "/category/jjomoh", icon: "⭐", label: "쩜오", count: "31개" },
  { href: "/category/hostbar", icon: "🎭", label: "호스트바", count: "18개" },
];

const KEYWORDS = [
  { href: "/search?q=강남가라오케", rank: "1", text: "강남가라오케", hot: true },
  { href: "/search?q=수원하이퍼블릭", rank: "2", text: "수원하이퍼블릭", hot: false },
  { href: "/search?q=동탄셔츠룸", rank: "3", text: "동탄셔츠룸", hot: false },
  { href: "/search?q=제주룸싸롱", rank: "4", text: "제주룸싸롱", hot: false },
  { href: "/search?q=인계동아우라", rank: "5", text: "인계동아우라", hot: false },
  { href: "/search?q=강남달토", rank: "↑", text: "강남달토", hot: true },
];

export default function WidgetRowA() {
  return (
    <div className="w-row w3" style={{ marginTop: 44 }}>
      <div className="widget">
        <div className="wt"><span className="wt-icon wi-g">💰</span>지역별 평균 가격 (1인)</div>
        <table className="ptable">
          <thead>
            <tr><th>지역</th><th>업종</th><th style={{ textAlign: "right" }}>평균</th><th style={{ textAlign: "right" }}>변동</th></tr>
          </thead>
          <tbody>
            {PRICE_ROWS.map((r, i) => (
              <tr key={i}>
                <td><span className="p-rgn">{r.region}</span></td>
                <td><span className="p-type">{r.type}</span></td>
                <td className="p-val">{r.val}</td>
                <td className={`p-chg ${r.chg}`}>{r.chg === "up" ? "↑" : r.chg === "dn" ? "↓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="widget">
        <div className="wt"><span className="wt-icon wi-r">🏆</span>이번 주 인기 업소 TOP 7</div>
        <div className="venue-list">
          {VENUE_RANKS.map((v) => (
            <Link key={v.href} href={v.href} className="venue-item">
              <span className={`v-rank ${v.top ? "top" : ""}`}>{v.rank}</span>
              <div className="v-info">
                <div className="v-name">{v.name}</div>
                <div className="v-sub">{v.sub}</div>
              </div>
              <div className="v-score"><strong>{v.score}</strong><span>/10</span></div>
            </Link>
          ))}
        </div>
      </div>

      <div className="widget">
        <div className="wt"><span className="wt-icon wi-b">📂</span>업종별 탐색</div>
        <div className="cat-grid" style={{ marginBottom: 16 }}>
          {CATEGORIES.map((c) => (
            <Link key={c.href} href={c.href} className="cat-item">
              <span className="cat-icon">{c.icon}</span>
              <div>
                <div className="cat-label">{c.label}</div>
                <div className="cat-count">{c.count}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="wt" style={{ marginBottom: 8 }}><span className="wt-icon wi-gr">🔥</span>실시간 트렌드 키워드</div>
        <div className="kw-cloud">
          {KEYWORDS.map((k) => (
            <Link key={k.href} href={k.href} className={`kw ${k.hot ? "kw-hot" : ""}`}>
              <span className="kw-rank">{k.rank}</span>{k.text}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
