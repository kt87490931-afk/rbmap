import { NextResponse } from "next/server";
import { requireAdminOrSetup } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const authErr = await requireAdminOrSetup();
    if (authErr) return authErr;

    const body = await request.json();
    const { region_slug, category_slug, venue_slug, section, payload } = body;

    if (
      !region_slug ||
      !category_slug ||
      !venue_slug ||
      !section ||
      !["hero", "price", "intro", "map", "seo"].includes(section)
    ) {
      return NextResponse.json(
        { error: "region_slug, category_slug, venue_slug, section(hero|price|intro|map|seo) 필수" },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "payload 객체 필수" }, { status: 400 });
    }

    const { data: existing, error: selectError } = await supabaseAdmin
      .from("venue_edits")
      .select("id, edits_json")
      .eq("region_slug", region_slug)
      .eq("category_slug", category_slug)
      .eq("venue_slug", venue_slug)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({ error: `venue_edits 조회 실패: ${selectError.message}` }, { status: 400 });
    }

    const prevEdits = (existing?.edits_json as Record<string, unknown>) ?? {};
    const nextEdits = { ...prevEdits, [section]: payload };

    const row = {
      region_slug,
      category_slug,
      venue_slug,
      edits_json: nextEdits,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = existing
      ? await supabaseAdmin
          .from("venue_edits")
          .update(row)
          .eq("id", existing.id)
          .select()
          .single()
      : await supabaseAdmin
          .from("venue_edits")
          .insert(row)
          .select()
          .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/admin/venues/edit] PATCH error:", err);
    return NextResponse.json({ error: message || "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
