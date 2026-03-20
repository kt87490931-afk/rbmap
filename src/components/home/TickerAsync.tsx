import { Suspense } from "react";
import Ticker from "@/components/Ticker";
import SectionWithSettings from "@/components/SectionWithSettings";
import { getReviewPostsList, getRegionName } from "@/lib/data/review-posts";
import { getRegions } from "@/lib/data/regions";

type TickerData = { items?: { region?: string; text?: string }[] };

interface TickerAsyncProps {
  ticker: TickerData | null;
  isAdmin: boolean;
}

async function TickerContent({ ticker, isAdmin }: TickerAsyncProps) {
  const [regions, reviewPosts] = await Promise.all([
    getRegions(),
    getReviewPostsList({ limit: 6 }),
  ]);
  const regionDisplayNames = Object.fromEntries(regions.map((r) => [r.slug, r.name]));

  const items = reviewPosts.map((p) => {
    const body = (p.sec_overview || p.sec_summary || p.title || "").trim();
    const text30 = body.length > 30 ? `${body.slice(0, 30)}…` : body;
    return {
      region: getRegionName(p.region, regionDisplayNames),
      text: text30 || `${p.venue} 리뷰 등록`,
    };
  });

  return (
    <SectionWithSettings isAdmin={isAdmin} sectionKey="ticker">
      <Ticker data={ticker} items={items} />
    </SectionWithSettings>
  );
}

export default function TickerAsync(props: TickerAsyncProps) {
  return (
    <Suspense
      fallback={
        <SectionWithSettings isAdmin={props.isAdmin} sectionKey="ticker">
          <div className="ticker" aria-hidden style={{ minHeight: 44, opacity: 0.5 }}>
            <div className="skeleton-line" style={{ width: "80%", height: 20, margin: "12px auto", borderRadius: 4 }} />
          </div>
        </SectionWithSettings>
      }
    >
      <TickerContent {...props} />
    </Suspense>
  );
}
