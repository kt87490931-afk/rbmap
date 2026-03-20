/** 6시간 마다 업데이트 인기 리뷰 섹션 스켈레톤 (Suspense fallback) */
export default function ReviewMagazineSectionSkeleton() {
  return (
    <section className="section bg-deep" aria-hidden>
      <div className="section-inner">
        <div className="section-head-row">
          <div>
            <div className="skeleton-line" style={{ width: 120, height: 12, marginBottom: 8 }} />
            <div className="skeleton-title" style={{ width: 260, height: 32 }} />
          </div>
        </div>
        <div className="venue-grid venue-grid-review" style={{ opacity: 0.6 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="venue-card" style={{ pointerEvents: 'none', minHeight: 180 }}>
              <div className="skeleton-line" style={{ width: 40, height: 12 }} />
              <div className="skeleton-line" style={{ width: '90%', height: 18, marginTop: 12 }} />
              <div className="skeleton-line" style={{ width: 80, height: 14, marginTop: 8 }} />
              <div className="skeleton-line" style={{ width: '100%', height: 14, marginTop: 12 }} />
              <div className="skeleton-line" style={{ width: '100%', height: 14, marginTop: 6 }} />
              <div className="skeleton-line" style={{ width: '85%', height: 14, marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
