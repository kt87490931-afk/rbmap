/**
 * 오늘 방문자 수 (KST 기준)
 * visit_logs에서 오늘의 실제 방문자(봇 제외) 조회
 */
import { supabaseAdmin } from "./supabase-server";

function kstDate(offset = 0): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setDate(kst.getDate() + offset);
  return kst.toISOString().slice(0, 10);
}

function kstRange(dateStr: string) {
  const start = new Date(dateStr + "T00:00:00+09:00");
  const end = new Date(dateStr + "T23:59:59.999+09:00");
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export async function getTodayVisitorCount(): Promise<{ total: number; visitors: number; bots: number }> {
  const todayStr = kstDate();
  const { startISO, endISO } = kstRange(todayStr);

  const [
    { count: total },
    { count: bots },
  ] = await Promise.all([
    supabaseAdmin
      .from("visit_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startISO)
      .lte("created_at", endISO),
    supabaseAdmin
      .from("visit_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .eq("visitor_type", "bot"),
  ]);

  const t = total ?? 0;
  const b = bots ?? 0;
  return { total: t, visitors: t - b, bots: b };
}

/**
 * 메인 표시용 접속자 수 (실제 방문자 + visitor_offset)
 */
export async function getDisplayVisitorCount(): Promise<{ actual: number; offset: number; display: number }> {
  const [stats, { data: configRow }] = await Promise.all([
    getTodayVisitorCount(),
    supabaseAdmin.from("site_sections").select("content").eq("section_key", "visitor_config").maybeSingle(),
  ]);

  const offset = Number((configRow?.content as { visitor_offset?: number })?.visitor_offset ?? 0) || 0;
  const display = Math.max(0, stats.visitors + offset);

  return { actual: stats.visitors, offset, display };
}
