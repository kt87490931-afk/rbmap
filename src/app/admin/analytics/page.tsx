"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsRow, DailyAnalyticsRow, MonthlyAnalyticsRow } from "@/lib/analytics-query";
import { deviceTypeLabel } from "@/lib/device-type";
import { monthOptions } from "@/lib/analytics-kst";

type Tab = "daily" | "monthly";

interface ApiResponse {
  ok: boolean;
  range: { from: string; to: string };
  summary: AnalyticsRow;
  today: DailyAnalyticsRow;
  daily: DailyAnalyticsRow[];
  monthly: MonthlyAnalyticsRow[];
  note?: string;
  error?: string;
}

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ background: "var(--deep)", borderRadius: 4, height: 8, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, opacity: 0.85 }} />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [days, setDays] = useState(30);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ mode: tab });
      if (month) {
        params.set("month", month);
      } else {
        params.set("days", String(days));
      }
      const res = await fetch(`/api/admin/analytics?${params}`, { credentials: "include" });
      const json = (await res.json()) as ApiResponse;
      setData(json.ok ? json : null);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [tab, days, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = data?.summary;
  const today = data?.today;
  const daily = data?.daily ?? [];
  const monthly = data?.monthly ?? [];
  const maxDailyPv = Math.max(...daily.map((d) => d.pv), 1);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>통계</h1>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          PV · UV · 봇/일반 · PC/모바일/태블릿 · 자체 visit_logs 집계 (KST)
        </p>
      </div>

      {data?.note && (
        <p
          style={{
            fontSize: 12,
            color: "var(--gold)",
            background: "rgba(200,168,75,.08)",
            border: "1px solid rgba(200,168,75,.25)",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          ℹ️ {data.note}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <button className="btn-save" style={{ opacity: tab === "daily" ? 1 : 0.45 }} onClick={() => setTab("daily")}>
          📅 일별
        </button>
        <button className="btn-save" style={{ opacity: tab === "monthly" ? 1 : 0.45 }} onClick={() => setTab("monthly")}>
          📆 월별
        </button>
        {tab === "daily" && (
          <>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                className="btn-save"
                style={{ opacity: !month && days === d ? 1 : 0.45 }}
                onClick={() => {
                  setMonth("");
                  setDays(d);
                }}
              >
                {d}일
              </button>
            ))}
          </>
        )}
        <select
          className="admin-form-control"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ minWidth: 130 }}
        >
          <option value="">월 선택 (선택)</option>
          {monthOptions(14).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button className="btn-success" onClick={fetchData} disabled={loading}>
          🔄 새로고침
        </button>
        {data?.range && (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {data.range.from} ~ {data.range.to}
          </span>
        )}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", padding: 24 }}>로딩 중…</p>
      ) : !summary ? (
        <p style={{ color: "var(--muted)", padding: 24 }}>데이터를 불러오지 못했습니다.</p>
      ) : (
        <>
          <div className="stats-grid4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 14 }}>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--gold)" }}>
                {fmt(today?.pv ?? 0)}
              </div>
              <div className="stat-card-label">오늘 PV</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--purple, #a78bfa)" }}>
                {fmt(today?.uv ?? 0)}
              </div>
              <div className="stat-card-label">오늘 UV</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--green)" }}>
                {fmt(today?.pv_human ?? 0)}
              </div>
              <div className="stat-card-label">오늘 일반 PV</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-num" style={{ color: "var(--blue)" }}>
                {fmt(today?.pv_bot ?? 0)}
              </div>
              <div className="stat-card-label">오늘 봇 PV</div>
            </div>
          </div>

          <div className="card-box" style={{ marginBottom: 16 }}>
            <div className="card-box-title">📊 선택 기간 합계</div>
            <div
              className="stats-grid4"
              style={{ gridTemplateColumns: "repeat(6, 1fr)", marginBottom: 12 }}
            >
              <div className="stat-card">
                <div className="stat-card-num">{fmt(summary.pv)}</div>
                <div className="stat-card-label">PV</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-num">{fmt(summary.uv)}</div>
                <div className="stat-card-label">UV</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-num" style={{ color: "var(--green)" }}>
                  {fmt(summary.pv_human)}
                </div>
                <div className="stat-card-label">일반 PV</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-num" style={{ color: "var(--green)" }}>
                  {fmt(summary.uv_human)}
                </div>
                <div className="stat-card-label">일반 UV</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-num" style={{ color: "var(--blue)" }}>
                  {fmt(summary.pv_bot)}
                </div>
                <div className="stat-card-label">봇 PV</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-num" style={{ color: "var(--blue)" }}>
                  {fmt(summary.uv_bot)}
                </div>
                <div className="stat-card-label">봇 UV</div>
              </div>
            </div>

            <div className="card-box-title" style={{ marginTop: 8, fontSize: 13 }}>
              디바이스 (PV / UV)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {(
                [
                  ["desktop", summary.pv_desktop, summary.uv_desktop],
                  ["mobile", summary.pv_mobile, summary.uv_mobile],
                  ["tablet", summary.pv_tablet, summary.uv_tablet],
                ] as const
              ).map(([type, pv, uv]) => (
                <div key={type} className="stat-card">
                  <div style={{ fontSize: 12, marginBottom: 6 }}>{deviceTypeLabel(type)}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{fmt(pv)} PV</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{fmt(uv)} UV</div>
                </div>
              ))}
            </div>
          </div>

          {tab === "daily" && (
            <div className="card-box">
              <div className="card-box-title">📅 일별 상세</div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table" style={{ width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>날짜</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>PV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>UV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>일반 PV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>봇 PV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>PC</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>모바일</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>태블릿</th>
                      <th style={{ padding: "8px 10px", minWidth: 120 }}>PV 추이</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
                          데이터 없음
                        </td>
                      </tr>
                    ) : (
                      daily.map((row) => (
                        <tr key={row.stat_date} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>{row.stat_date}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>{fmt(row.pv)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(row.uv)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--green)" }}>
                            {fmt(row.pv_human)}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--blue)" }}>
                            {fmt(row.pv_bot)}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(row.pv_desktop)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(row.pv_mobile)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(row.pv_tablet)}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <Bar value={row.pv} max={maxDailyPv} color="var(--gold)" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "monthly" && (
            <div className="card-box">
              <div className="card-box-title">📆 월별 (최근 12개월)</div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table" style={{ width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>월</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>PV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>UV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>일반 PV/UV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>봇 PV/UV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>PC PV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>모바일 PV</th>
                      <th style={{ textAlign: "right", padding: "8px 10px" }}>태블릿 PV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
                          데이터 없음
                        </td>
                      </tr>
                    ) : (
                      monthly.map((row) => (
                        <tr key={row.stat_month} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px 10px", fontFamily: "monospace" }}>
                            {row.stat_month.slice(0, 7)}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>{fmt(row.pv)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(row.uv)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--green)" }}>
                            {fmt(row.pv_human)} / {fmt(row.uv_human)}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--blue)" }}>
                            {fmt(row.pv_bot)} / {fmt(row.uv_bot)}
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(row.pv_desktop)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(row.pv_mobile)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>{fmt(row.pv_tablet)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
