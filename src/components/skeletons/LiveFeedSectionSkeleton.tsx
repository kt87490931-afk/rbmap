/** 실시간 최신 업데이트 섹션 스켈레톤 (Suspense fallback) */
export default function LiveFeedSectionSkeleton() {
  return (
    <section className="section" aria-hidden>
      <div className="section-inner">
        <div className="section-head-row">
          <div>
            <div className="live-header">
              <span className="live-badge"><span className="live-dot" />LIVE</span>
              <div className="skeleton-title" style={{ width: 200, height: 28, marginBottom: 0 }} />
            </div>
          </div>
        </div>
        <div className="feed-list" style={{ opacity: 0.6 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="feed-item" style={{ pointerEvents: 'none' }}>
              <div className="skeleton-pill" style={{ width: 48, height: 20, borderRadius: 4 }} />
              <div className="skeleton-line" style={{ flex: 1, height: 18, maxWidth: '70%' }} />
              <div className="skeleton-line" style={{ width: 36, height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
