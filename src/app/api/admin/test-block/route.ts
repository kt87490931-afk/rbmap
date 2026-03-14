import { NextResponse } from "next/server";
import { requireAdminOrSetup } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * 차단 IP 실제 동작 테스트
 * 미들웨어에 X-Forwarded-For로 요청을 보내 403 반환 여부 확인
 */
export async function GET(request: Request) {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip")?.trim();
  if (!ip) {
    return NextResponse.json({ error: "ip 쿼리 필수 (예: ?ip=34.76.117.34)" }, { status: 400 });
  }

  try {
    // localhost로 직접 요청 (Nginx 우회) → X-Forwarded-For가 그대로 전달됨
    const port = process.env.PORT || 3000;
    const testUrl = `http://127.0.0.1:${port}/`;

    const res = await fetch(testUrl, {
      headers: { "X-Forwarded-For": ip, "X-Real-IP": ip },
      cache: "no-store",
    } as RequestInit);

    const blocked = res.status === 403;
    return NextResponse.json({
      ip,
      blocked,
      status: res.status,
      message: blocked ? "✓ 정상: 해당 IP는 403으로 차단됩니다." : "해당 IP는 차단 목록에 없습니다.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "테스트 실패", detail: String(e) },
      { status: 500 }
    );
  }
}
