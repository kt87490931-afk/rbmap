/**
 * 오늘 접속자 수 (공개 API)
 * 메인 페이지 히어로 "오늘의접속자" 표시용
 * 실제 방문자 + 추가 인원(visitor_offset) = 표시값
 */
import { NextResponse } from "next/server";
import { getDisplayVisitorCount } from "@/lib/visit-count";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { actual, offset, display } = await getDisplayVisitorCount();
    return NextResponse.json({ actual, offset, display });
  } catch {
    return NextResponse.json({ actual: 0, offset: 0, display: 0 });
  }
}
