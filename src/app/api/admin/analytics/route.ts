import { NextResponse } from "next/server";
import { requireAdminOrSetup } from "@/lib/admin-auth";
import { kstDateString, kstMonthEnd, kstMonthStart, addDays } from "@/lib/analytics-kst";
import {
  fetchDailyAnalytics,
  fetchMonthlyAnalytics,
  fetchPeriodSummary,
} from "@/lib/analytics-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "daily";
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 7), 366);
  const month = searchParams.get("month") || "";
  const dateFrom = searchParams.get("from") || "";
  const dateTo = searchParams.get("to") || "";

  let from = dateFrom;
  let to = dateTo || kstDateString();

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    from = kstMonthStart(month);
    to = kstMonthEnd(month);
  } else if (!dateFrom) {
    from = addDays(kstDateString(), -(days - 1));
  }

  if (from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }

  try {
    const [daily, monthly, summary] = await Promise.all([
      fetchDailyAnalytics(from, to),
      fetchMonthlyAnalytics(addDays(kstDateString(), -365), kstDateString()),
      fetchPeriodSummary(from, to),
    ]);

    const todayStr = kstDateString();
    const todayDaily = daily.find((d) => d.stat_date === todayStr) ?? null;
    const todaySummary = await fetchPeriodSummary(todayStr, todayStr);

    return NextResponse.json({
      ok: true,
      mode,
      range: { from, to },
      summary,
      today: todayDaily ?? { stat_date: todayStr, ...todaySummary },
      daily: mode === "daily" ? daily : [],
      monthly,
      note:
        "UV·디바이스는 supabase-analytics-stats.sql 실행 후 신규 방문부터 정확히 집계됩니다. 봇은 UA·Cloudflare 동기화 기준(추정)입니다.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
