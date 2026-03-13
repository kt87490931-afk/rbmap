import { NextResponse } from "next/server";
import { getRegionsWithPartners } from "@/lib/data/partners";

/** 제휴업체가 1개 이상 등록된 지역 목록 (지역 드롭다운용) */
export async function GET() {
  try {
    const regions = await getRegionsWithPartners();
    return NextResponse.json(regions);
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}
