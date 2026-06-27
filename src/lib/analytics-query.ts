import { supabaseAdmin } from '@/lib/supabase-server';

export interface AnalyticsRow {
  pv: number;
  uv: number;
  pv_bot: number;
  uv_bot: number;
  pv_human: number;
  uv_human: number;
  pv_desktop: number;
  pv_mobile: number;
  pv_tablet: number;
  uv_desktop: number;
  uv_mobile: number;
  uv_tablet: number;
}

export interface DailyAnalyticsRow extends AnalyticsRow {
  stat_date: string;
}

export interface MonthlyAnalyticsRow extends AnalyticsRow {
  stat_month: string;
}

const EMPTY: AnalyticsRow = {
  pv: 0,
  uv: 0,
  pv_bot: 0,
  uv_bot: 0,
  pv_human: 0,
  uv_human: 0,
  pv_desktop: 0,
  pv_mobile: 0,
  pv_tablet: 0,
  uv_desktop: 0,
  uv_mobile: 0,
  uv_tablet: 0,
};

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v) || 0;
}

function mapDaily(row: Record<string, unknown>): DailyAnalyticsRow {
  return {
    stat_date: String(row.stat_date ?? ''),
    pv: num(row.pv),
    uv: num(row.uv),
    pv_bot: num(row.pv_bot),
    uv_bot: num(row.uv_bot),
    pv_human: num(row.pv_human),
    uv_human: num(row.uv_human),
    pv_desktop: num(row.pv_desktop),
    pv_mobile: num(row.pv_mobile),
    pv_tablet: num(row.pv_tablet),
    uv_desktop: num(row.uv_desktop),
    uv_mobile: num(row.uv_mobile),
    uv_tablet: num(row.uv_tablet),
  };
}

function mapMonthly(row: Record<string, unknown>): MonthlyAnalyticsRow {
  return {
    stat_month: String(row.stat_month ?? ''),
    pv: num(row.pv),
    uv: num(row.uv),
    pv_bot: num(row.pv_bot),
    uv_bot: num(row.uv_bot),
    pv_human: num(row.pv_human),
    uv_human: num(row.uv_human),
    pv_desktop: num(row.pv_desktop),
    pv_mobile: num(row.pv_mobile),
    pv_tablet: num(row.pv_tablet),
    uv_desktop: num(row.uv_desktop),
    uv_mobile: num(row.uv_mobile),
    uv_tablet: num(row.uv_tablet),
  };
}

function mapPeriod(row: Record<string, unknown>): AnalyticsRow {
  return {
    pv: num(row.pv),
    uv: num(row.uv),
    pv_bot: num(row.pv_bot),
    uv_bot: num(row.uv_bot),
    pv_human: num(row.pv_human),
    uv_human: num(row.uv_human),
    pv_desktop: num(row.pv_desktop),
    pv_mobile: num(row.pv_mobile),
    pv_tablet: num(row.pv_tablet),
    uv_desktop: num(row.uv_desktop),
    uv_mobile: num(row.uv_mobile),
    uv_tablet: num(row.uv_tablet),
  };
}

export function sumAnalyticsRows(rows: AnalyticsRow[]): AnalyticsRow {
  return rows.reduce(
    (acc, r) => ({
      pv: acc.pv + r.pv,
      uv: acc.uv + r.uv,
      pv_bot: acc.pv_bot + r.pv_bot,
      uv_bot: acc.uv_bot + r.uv_bot,
      pv_human: acc.pv_human + r.pv_human,
      uv_human: acc.uv_human + r.uv_human,
      pv_desktop: acc.pv_desktop + r.pv_desktop,
      pv_mobile: acc.pv_mobile + r.pv_mobile,
      pv_tablet: acc.pv_tablet + r.pv_tablet,
      uv_desktop: acc.uv_desktop + r.uv_desktop,
      uv_mobile: acc.uv_mobile + r.uv_mobile,
      uv_tablet: acc.uv_tablet + r.uv_tablet,
    }),
    { ...EMPTY }
  );
}

/** RPC 미적용 DB fallback — 일별 PV/봇만 */
async function fallbackDaily(from: string, to: string): Promise<DailyAnalyticsRow[]> {
  const start = new Date(from + 'T00:00:00+09:00').toISOString();
  const end = new Date(to + 'T23:59:59.999+09:00').toISOString();
  const { data, error } = await supabaseAdmin
    .from('visit_logs')
    .select('created_at, visitor_type')
    .gte('created_at', start)
    .lte('created_at', end);
  if (error) throw error;

  const byDay: Record<string, DailyAnalyticsRow> = {};
  for (const row of data ?? []) {
    const d = new Date(row.created_at as string);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (!byDay[kst]) {
      byDay[kst] = { stat_date: kst, ...EMPTY };
    }
    byDay[kst].pv += 1;
    if ((row.visitor_type as string) === 'bot') {
      byDay[kst].pv_bot += 1;
    } else {
      byDay[kst].pv_human += 1;
    }
  }
  return Object.values(byDay).sort((a, b) => b.stat_date.localeCompare(a.stat_date));
}

export async function fetchDailyAnalytics(from: string, to: string): Promise<DailyAnalyticsRow[]> {
  const { data, error } = await supabaseAdmin.rpc('get_analytics_daily_stats', {
    p_from: from,
    p_to: to,
  });
  if (error) {
    if (/function.*does not exist|schema cache/i.test(error.message)) {
      return fallbackDaily(from, to);
    }
    throw error;
  }
  return (data ?? []).map((row: Record<string, unknown>) => mapDaily(row));
}

export async function fetchMonthlyAnalytics(from: string, to: string): Promise<MonthlyAnalyticsRow[]> {
  const { data, error } = await supabaseAdmin.rpc('get_analytics_monthly_stats', {
    p_from: from,
    p_to: to,
  });
  if (error) {
    if (/function.*does not exist|schema cache/i.test(error.message)) {
      const daily = await fallbackDaily(from, to);
      const byMonth: Record<string, MonthlyAnalyticsRow> = {};
      for (const d of daily) {
        const m = d.stat_date.slice(0, 7) + '-01';
        if (!byMonth[m]) byMonth[m] = { stat_month: m, ...EMPTY };
        byMonth[m].pv += d.pv;
        byMonth[m].pv_bot += d.pv_bot;
        byMonth[m].pv_human += d.pv_human;
      }
      return Object.values(byMonth).sort((a, b) => b.stat_month.localeCompare(a.stat_month));
    }
    throw error;
  }
  return (data ?? []).map((row: Record<string, unknown>) => mapMonthly(row));
}

export async function fetchPeriodSummary(from: string, to: string): Promise<AnalyticsRow> {
  const { data, error } = await supabaseAdmin.rpc('get_analytics_period_stats', {
    p_from: from,
    p_to: to,
  });
  if (error) {
    if (/function.*does not exist|schema cache/i.test(error.message)) {
      const daily = await fallbackDaily(from, to);
      return sumAnalyticsRows(daily);
    }
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row ? mapPeriod(row as Record<string, unknown>) : { ...EMPTY };
}
