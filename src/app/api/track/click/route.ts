import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = (body.path as string) || "/";
    const eventType = (body.type as string) || "call";

    if (!path || path.length > 500) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await supabaseAdmin.from("click_logs").insert({
      path: path.substring(0, 500),
      event_type: eventType === "call" ? "call" : "click",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
