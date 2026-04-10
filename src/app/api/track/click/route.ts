import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/** 외부 사이트에서 fetch(mode:cors)로 전화 클릭 기록 시 프리플라이트 대응 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = (body.path as string) || "/";
    const eventType = (body.type as string) || "call";

    if (!path || path.length > 500) {
      return NextResponse.json({ ok: false }, { status: 400, headers: CORS_HEADERS });
    }

    await supabaseAdmin.from("click_logs").insert({
      path: path.substring(0, 500),
      event_type: eventType === "call" ? "call" : "click",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500, headers: CORS_HEADERS });
  }
}
