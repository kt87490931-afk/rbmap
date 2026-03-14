import { NextResponse } from "next/server";
import { requireAdminOrSetup } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/** 어드민: 차단 IP 목록 조회 */
export async function GET() {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const { data } = await supabaseAdmin.from("blocked_ips").select("ip");
  const ips = (data ?? []).map((r) => r.ip).filter(Boolean);
  return NextResponse.json(ips);
}

/** 어드민: IP 차단 추가 */
export async function POST(request: Request) {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const body = await request.json().catch(() => ({}));
  const ip = String(body.ip ?? "").trim();
  if (!ip) {
    return NextResponse.json({ error: "ip 필수" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("blocked_ips").upsert(
    { ip, reason: body.reason || "어드민 차단", created_at: new Date().toISOString() },
    { onConflict: "ip" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, ip });
}

/** 어드민: IP 차단 해제 */
export async function DELETE(request: Request) {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip")?.trim();
  if (!ip) {
    return NextResponse.json({ error: "ip 쿼리 필수" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("blocked_ips").delete().eq("ip", ip);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
