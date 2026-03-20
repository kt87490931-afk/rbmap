/**
 * 업체 상세 페이지 리뷰 지연 로드용 API
 * GET /api/venue-reviews?region=garak&venue=garakroom
 */
import { NextResponse } from "next/server";
import { getReviewPostsByVenue } from "@/lib/data/review-posts";
import { buildReviewUrl, formatStars } from "@/lib/data/review-posts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region")?.trim();
  const venue = searchParams.get("venue")?.trim();

  if (!region || !venue) {
    return NextResponse.json({ error: "region, venue required" }, { status: 400 });
  }

  try {
    const posts = await getReviewPostsByVenue(region, venue, undefined, 50);
    const reviews = posts.map((p) => {
      const body = (p.sec_overview || p.sec_summary || "").trim();
      const totalChars =
        (p.sec_overview || "").length +
        (p.sec_lineup || "").length +
        (p.sec_price || "").length +
        (p.sec_facility || "").length +
        (p.sec_summary && p.sec_summary !== p.sec_overview ? (p.sec_summary || "").length : 0);
      return {
        id: p.id,
        href: buildReviewUrl(region, p.type, venue, p.slug),
        title: p.title,
        stars: formatStars(p.star),
        starsNum: String(p.star),
        body: body.slice(0, 500) + (body.length > 500 ? "..." : ""),
        date: p.published_at
          ? new Date(p.published_at)
              .toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
              .replace(/\. /g, ".")
              .replace(/\.$/, "")
          : "",
        charCount: `약 ${Math.round(totalChars / 100) * 100 || 300}자`,
      };
    });

    return NextResponse.json(reviews);
  } catch (err) {
    console.error("[venue-reviews]", err);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
