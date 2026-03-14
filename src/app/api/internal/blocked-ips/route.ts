import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** 미들웨어에서 호출. 차단 IP 목록 반환. 내부용(secret 검증) */
export async function GET(request: Request) {
  const auth = request.headers.get("x-blocked-check") || "";
  const secret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret && auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabaseAdmin
    .from("blocked_ips")
    .select("ip")
    .then((r) => r);

  const ips = (data ?? []).map((r) => r.ip).filter(Boolean);
  return NextResponse.json(ips);
}
