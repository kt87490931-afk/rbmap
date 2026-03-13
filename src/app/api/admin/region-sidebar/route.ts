import { NextResponse } from "next/server";
import { requireAdminOrSetup } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type RegionSidebarConfig = {
  priceRows?: { type: string; val: string; chg: string }[];
  priceNote?: string;
  tips?: { title: string; text: string; color: string }[];
  nearbyRegions?: { slug: string; name: string; venues: number; reviews: number }[];
};

export async function GET() {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const { data, error } = await supabaseAdmin
    .from("site_sections")
    .select("content")
    .eq("section_key", "region_sidebar")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const content = (data?.content as Record<string, RegionSidebarConfig>) ?? {};
  return NextResponse.json(content);
}

export async function PATCH(request: Request) {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const body = await request.json();
  const { region, config } = body as { region: string; config: RegionSidebarConfig };
  if (!region || typeof region !== "string") {
    return NextResponse.json({ error: "region 필수" }, { status: 400 });
  }

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("site_sections")
    .select("content")
    .eq("section_key", "region_sidebar")
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const current = (existing?.content as Record<string, RegionSidebarConfig>) ?? {};
  const merged = { ...current, [region]: { ...(current[region] ?? {}), ...config } };

  const { data, error } = await supabaseAdmin
    .from("site_sections")
    .upsert(
      { section_key: "region_sidebar", content: merged, updated_at: new Date().toISOString() },
      { onConflict: "section_key" }
    )
    .select("content")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data.content);
}
