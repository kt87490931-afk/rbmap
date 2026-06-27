/** KST(Asia/Seoul) 날짜 유틸 — 통계 API 공용 */

export function kstDateString(offsetDays = 0): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() + offsetDays);
  return kst.toISOString().slice(0, 10);
}

export function kstMonthStart(monthStr: string): string {
  return `${monthStr}-01`;
}

export function kstMonthEnd(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0));
  return last.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00+09:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function monthOptions(count = 12): string[] {
  const out: string[] = [];
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}
