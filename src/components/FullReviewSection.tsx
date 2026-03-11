import Link from "next/link";
import type { Review } from "@/lib/data/reviews";

function regionToClass(region: string): string {
  const m: Record<string, string> = { 강남: "p-gangnam", 수원: "p-suwon", 동탄: "p-dongtan", 제주: "p-jeju" };
  return m[region] ?? "p-default";
}

function starsToNum(stars: string): string {
  const n = (stars.match(/★/g)?.length ?? 0);
  return `${n}.0 / 5.0`;
}

export default function FullReviewSection({ reviews }: { reviews: Review[] }) {
  const items = reviews.slice(0, 10);
  return (
    <section className="full-review-section section" aria-label="최신 리뷰 전문">
      <div className="page-wrap">
        <div className="sec-header">
          <div>
            <p className="sec-label">FULL REVIEWS</p>
            <h2 className="sec-title">최신 리뷰 전문 <span>10선</span></h2>
          </div>
          <Link href="/reviews" className="see-all">전체 리뷰 →</Link>
        </div>
        <div className="fr-grid">
          {items.map((r, idx) => {
            const body = (r.body_json && r.body_json.length > 0) ? r.body_json : (r.excerpt ? [r.excerpt] : []);
            const num = String(idx + 1).padStart(2, "0");
            return (
            <Link key={r.id} href={r.href} className="fr-card">
              <div className="fr-head">
                <div className="fr-head-left">
                  <span className="fr-num">{num}</span>
                  <span className={`fr-region-pill ${regionToClass(r.region)}`}>{r.region}</span>
                  <span className="fr-type">{r.venue ? "업소" : ""}</span>
                  <span className="fr-venue-tag">{r.venue}</span>
                </div>
                <span className="fr-date">{r.date}</span>
              </div>
              <div className="fr-title">{r.title}</div>
              <div className="fr-stars">
                <span className="fr-stars-val">{r.stars}</span>
                <span className="fr-stars-num">{starsToNum(r.stars)}</span>
              </div>
              <div className="fr-body">
                {body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="fr-footer">
                <span className="fr-char-count">{r.char_count ?? `약 ${r.excerpt?.length ?? 0}자`}</span>
                <span className="fr-read-more">전문 보기 →</span>
              </div>
            </Link>
          );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link href="/reviews" className="btn-ghost">전체 리뷰 목록 보기 →</Link>
        </div>
      </div>
    </section>
  );
}
