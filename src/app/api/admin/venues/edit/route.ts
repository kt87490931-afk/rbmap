import { NextResponse } from "next/server";
import { requireAdminOrSetup } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
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

  const { data: existing } = await supabaseAdmin
    .from("venue_edits")
    .select("id, edits_json")
    .eq("region_slug", region_slug)
    .eq("category_slug", category_slug)
    .eq("venue_slug", venue_slug)
    .maybeSingle();

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
}
