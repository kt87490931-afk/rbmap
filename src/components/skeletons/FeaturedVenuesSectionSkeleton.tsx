/** 지역별 주요업소 섹션 스켈레톤 (Suspense fallback) */
export default function FeaturedVenuesSectionSkeleton() {
  return (
    <section className="section bg-deep" aria-hidden>
      <div className="section-inner">
        <div className="section-head-row">
          <div>
            <div className="skeleton-line" style={{ width: 140, height: 12, marginBottom: 8 }} />
            <div className="skeleton-title" style={{ width: 180, height: 32 }} />
          </div>
        </div>
        <div className="venue-grid venue-grid-featured" style={{ opacity: 0.6 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="venue-card" style={{ pointerEvents: 'none', minHeight: 200 }}>
              <div className="skeleton-line" style={{ width: 40, height: 12 }} />
              <div className="skeleton-line" style={{ width: '80%', height: 20, marginTop: 12 }} />
              <div className="skeleton-line" style={{ width: 60, height: 14, marginTop: 8 }} />
              <div className="skeleton-line" style={{ width: '100%', height: 14, marginTop: 16 }} />
              <div className="skeleton-line" style={{ width: '100%', height: 14, marginTop: 6 }} />
              <div className="skeleton-line" style={{ width: '90%', height: 14, marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
