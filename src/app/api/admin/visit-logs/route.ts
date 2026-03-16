import { NextResponse } from "next/server";
import { requireAdminOrSetup } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { parseSearchQueryFromReferrer } from "@/lib/referrer-search";

export const dynamic = "force-dynamic";

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

async function countForDay(dateStr: string) {
  const { startISO, endISO } = kstRange(dateStr);

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

export async function GET(request: Request) {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 500, 1000);
  const filterType = searchParams.get("type") || "all";
  const dateFilter = searchParams.get("date") || "";

  const todayStr = kstDate();
  const last7days: string[] = [];
  for (let i = 0; i < 7; i++) {
    last7days.push(kstDate(-i));
  }

  let query = supabaseAdmin
    .from("visit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filterType === "bot") {
    query = query.eq("visitor_type", "bot");
  } else if (filterType === "visitor") {
    query = query.neq("visitor_type", "bot");
  }

  if (dateFilter) {
    const { startISO, endISO } = kstRange(dateFilter);
    query = query.gte("created_at", startISO).lte("created_at", endISO);
  }

  const [queryResult, todayStats, ...weekDayStats] = await Promise.all([
    query,
    countForDay(todayStr),
    ...last7days.map((d) => countForDay(d)),
  ]);

  const dailyStats: Record<string, { total: number; visitors: number; bots: number }> = {};
  for (let i = 0; i < last7days.length; i++) {
    dailyStats[last7days[i]] = weekDayStats[i];
  }

  const rawLogs = queryResult.data ?? [];
  const logs = rawLogs.map((log: { referrer?: string | null; [k: string]: unknown }) => ({
    ...log,
    search_query: parseSearchQueryFromReferrer(log.referrer ?? null) ?? null,
  }));

  return NextResponse.json({
    logs,
    todayCount: todayStats.total,
    todayBots: todayStats.bots,
    todayVisitors: todayStats.visitors,
    dailyStats,
    last7days,
  });
}
