import { NextResponse } from "next/server";
import { getRegions } from "@/lib/data/regions";

export const dynamic = "force-dynamic";

/** 어드민에 등록된 지역 목록 (지역 드롭다운·전체 지역 페이지용) */
export async function GET() {
  try {
    const regions = await getRegions();
    const res = NextResponse.json(
      regions.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        short: r.short,
        venues: r.venues,
        reviews: r.reviews,
        badge: r.badge,
        coming: r.coming,
      }))
    );
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
