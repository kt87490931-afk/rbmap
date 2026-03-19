/**
 * 오늘 방문자 수 (KST 기준)
 * visit_logs에서 오늘의 실제 방문자(봇 제외) 조회
 */
import { unstable_cache } from "next/cache";
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

/** KST 00:00 기준 경과 분 (0 ~ 1440 미만) */
function getMinutesSinceMidnightKST(): number {
  const msKST = Date.now() + 9 * 60 * 60 * 1000;
  const msInDay = 24 * 60 * 60 * 1000;
  const msSinceMidnight = ((msKST % msInDay) + msInDay) % msInDay;
  return msSinceMidnight / (60 * 1000);
}

/**
 * 24시 기준 점진 증가: 설정된 추가 인원(offset)을 00시~24시에 걸쳐 선형으로 반영.
 * 00시에는 0, 24시에 가까울수록 설정값에 수렴.
 */
export function getEffectiveVisitorOffset(offset: number): number {
  if (offset <= 0) return 0;
  const minutesSinceMidnight = getMinutesSinceMidnightKST();
  const ratio = Math.min(1, minutesSinceMidnight / (24 * 60));
  return Math.round(offset * ratio);
}

/**
 * 메인 표시용 접속자 수 (실제 방문자 + 24시 기준 점진 증가하는 추가 인원)
 */
async function getDisplayVisitorCountUncached(): Promise<{ actual: number; offset: number; display: number }> {
  const [stats, { data: configRow }] = await Promise.all([
    getTodayVisitorCount(),
    supabaseAdmin.from("site_sections").select("content").eq("section_key", "visitor_config").maybeSingle(),
  ]);

  const offset = Number((configRow?.content as { visitor_offset?: number })?.visitor_offset ?? 0) || 0;
  const effectiveOffset = getEffectiveVisitorOffset(offset);
  const display = Math.max(0, stats.visitors + effectiveOffset);

  return { actual: stats.visitors, offset, display };
}

/** 60초 캐시로 TTFB 개선 (방문자 수는 실시간일 필요 없음) */
export async function getDisplayVisitorCount(): Promise<{ actual: number; offset: number; display: number }> {
  return unstable_cache(getDisplayVisitorCountUncached, ["display-visitor-count"], { revalidate: 60 })();
}
