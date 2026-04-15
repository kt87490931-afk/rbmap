/**
 * 일일 리포트 Cron API
 * 매일 00시 KST 호출: 전날 접속/클릭/리뷰/업소 통계를 텔레그램으로 발송
 * GET ?cron_secret=xxx 또는 Authorization: Bearer xxx
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notifyDailyReport, type DailyReportData } from "@/lib/telegram";
import { REGION_SLUG_TO_NAME, SLUG_TO_TYPE } from "@/lib/data/venues";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** KST 기준 전날 00:00 ~ 23:59:59 범위 (ISO 문자열) */
function getYesterdayKSTRange(): { start: string; end: string; dateLabel: string } {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateLabel = `${y}-${m}-${day}`;
  return {
    start: `${dateLabel}T00:00:00.000+09:00`,
    end: `${dateLabel}T23:59:59.999+09:00`,
    dateLabel,
  };
}

/** path 비교용 정규화: 앞뒤 슬래시 제거, 빈 문자열은 '/' */
function normalizePath(p: string): string {
  return (p || "").replace(/^\/+|\/+$/g, "") || "";
}

const THREENO_SWTEST_PATH = "p/threeno-swtest";
const DT9IN_PATH = "dt9in";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const url = new URL(request.url);
  const secret = url.searchParams.get("cron_secret") || authHeader?.replace(/^Bearer\s+/i, "");
  const envSecret = process.env.CRON_SECRET || process.env.CRON_DAILY_REPORT_SECRET;
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startAt = Date.now();
  const { start, end, dateLabel } = getYesterdayKSTRange();

  try {
    const [visitRes, clickRes, reviewRes, partnerRes, partnersListRes] = await Promise.all([
      supabaseAdmin
        .from("visit_logs")
        .select("path, visitor_type, created_at")
        .gte("created_at", start)
        .lte("created_at", end),
      supabaseAdmin
        .from("click_logs")
        .select("path, event_type, created_at")
        .eq("event_type", "call")
        .gte("created_at", start)
        .lte("created_at", end),
      supabaseAdmin
        .from("review_posts")
        .select("id, created_at")
        .gte("created_at", start)
        .lte("created_at", end),
      supabaseAdmin
        .from("partners")
        .select("id, created_at")
        .gte("created_at", start)
        .lte("created_at", end),
      supabaseAdmin.from("partners").select("id, href, name, region, type"),
    ]);

    const visits = visitRes.data ?? [];
    const clicks = clickRes.data ?? [];
    const newReviews = (reviewRes.data ?? []).length;
    const newPartners = (partnerRes.data ?? []).length;
    const partners = (partnersListRes.data ?? []) as { id: string; href: string; name: string; region: string; type: string }[];

    const pathToPartner = new Map<string, { name: string; region: string; type: string }>();
    for (const p of partners) {
      const key = normalizePath(p.href || "");
      if (key) pathToPartner.set(key, { name: p.name || "(이름없음)", region: p.region || "", type: p.type || "" });
    }

    const lookupPartner = (path: string) => pathToPartner.get(normalizePath(path));

    let visitors = 0;
    let bots = 0;
    const partnerViews: Record<string, number> = {};
    const regionDistribution: Record<string, number> = {};
    const typeDistribution: Record<string, number> = {};

    for (const v of visits) {
      const vt = (v.visitor_type || "visitor").toLowerCase();
      if (vt === "bot" || vt === "scanner" || vt === "crawler") {
        bots += 1;
      } else {
        visitors += 1;
      }
      const path = (v.path || "/").trim();
      const pathNorm = normalizePath(path);
      const partner = lookupPartner(path);
      if (partner) {
        partnerViews[pathNorm || path] = (partnerViews[pathNorm || path] ?? 0) + 1;
        const parts = path.split("/").filter(Boolean);
        const rn = partner.region || REGION_SLUG_TO_NAME[parts[0]] || parts[0] || "기타";
        const tn = partner.type || SLUG_TO_TYPE[parts[1]] || parts[1] || "기타";
        regionDistribution[rn] = (regionDistribution[rn] ?? 0) + 1;
        typeDistribution[tn] = (typeDistribution[tn] ?? 0) + 1;
      } else {
        const parts = path.split("/").filter(Boolean);
        if (parts.length >= 1) {
          const rn = REGION_SLUG_TO_NAME[parts[0]] ?? parts[0] ?? "기타";
          regionDistribution[rn] = (regionDistribution[rn] ?? 0) + 1;
        }
        if (parts.length >= 2) {
          const tn = SLUG_TO_TYPE[parts[1]] ?? parts[1] ?? "기타";
          typeDistribution[tn] = (typeDistribution[tn] ?? 0) + 1;
        }
      }
    }

    const partnerCalls: Record<string, number> = {};
    let threenoCallClicks = 0;
    let dt9inCallClicks = 0;
    for (const c of clicks) {
      const pathNorm = normalizePath(c.path || "");
      if (pathNorm) partnerCalls[pathNorm] = (partnerCalls[pathNorm] ?? 0) + 1;
      if (pathNorm === THREENO_SWTEST_PATH) threenoCallClicks += 1;
      if (pathNorm === DT9IN_PATH) dt9inCallClicks += 1;
    }

    const allPaths = new Set([...Object.keys(partnerViews), ...Object.keys(partnerCalls)]);
    const topPartners = Array.from(allPaths)
      .map((pathNorm) => {
        const info = pathToPartner.get(pathNorm);
        const name = info?.name ?? pathNorm;
        const views = partnerViews[pathNorm] ?? 0;
        const calls = partnerCalls[pathNorm] ?? 0;
        return { name, path: `/${pathNorm}`, views, calls };
      })
      .filter((p) => p.views > 0 || p.calls > 0)
      .sort((a, b) => b.views + b.calls * 3 - (a.views + a.calls * 3))
      .slice(0, 10);

    const reportData: DailyReportData = {
      visitors,
      bots,
      partnerViews,
      partnerCalls,
      threenoCallClicks,
      dt9inCallClicks,
      topPartners,
      regionDistribution,
      typeDistribution,
      newReviews,
      newPartners,
    };

    const ok = await notifyDailyReport(dateLabel, reportData);
    const durationMs = Date.now() - startAt;
    return NextResponse.json({
      ok,
      date: dateLabel,
      duration_ms: durationMs,
      visitors,
      bots,
      totalCalls: Object.values(partnerCalls).reduce((a, b) => a + b, 0),
      threenoCallClicks,
      dt9inCallClicks,
      newReviews,
      newPartners,
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Unknown error";
    const durationMs = Date.now() - startAt;
    return NextResponse.json(
      { error: errMsg, duration_ms: durationMs },
      { status: 500 }
    );
  }
}
