"use client";

import { useState, useEffect, useCallback } from "react";

interface VisitLog {
  id: string;
  ip: string;
  user_agent: string;
  path: string;
  visitor_type: string;
  created_at: string;
  referrer?: string | null;
  search_query?: string | null;
}

interface DailyStat {
  total: number;
  visitors: number;
  bots: number;
}

const BOT_NAMES: Record<string, string> = {
  googlebot: "🔍 Googlebot",
  bingbot: "🔎 Bingbot",
  yandexbot: "🟡 YandexBot",
  duckduckbot: "🦆 DuckDuckBot",
  baiduspider: "🔴 Baidu",
  facebookexternalhit: "📘 Facebook",
  facebot: "📘 Facebook",
  twitterbot: "🐦 Twitterbot",
  "kakaotalk-scrap": "💬 KakaoTalk",
  semrushbot: "📊 SEMrush",
  ahrefsbot: "📈 Ahrefs",
  mj12bot: "🔧 MJ12Bot",
  dotbot: "🤖 DotBot",
  petalbot: "🌸 PetalBot",
  bytespider: "🕷 ByteSpider",
  "oai-searchbot": "🤖 OpenAI",
  gptbot: "🤖 GPTBot",
  "google-inspectiontool": "🔍 Google Inspect",
};

function referrerLabel(log: VisitLog): string {
  if (log.search_query) return log.search_query;
  if (!log.referrer) return "-";
  try {
    return new URL(log.referrer).hostname;
  } catch {
    return log.referrer.length > 40 ? log.referrer.slice(0, 40) + "…" : log.referrer;
  }
}

function classifyUA(ua: string, visitorType?: string): { label: string; detail: string } {
  if (!ua) return { label: "❓ 알 수 없음", detail: "-" };
  const lower = ua.toLowerCase();

  for (const [key, label] of Object.entries(BOT_NAMES)) {
    if (lower.includes(key)) return { label, detail: key };
  }

  if (
    visitorType === "bot" ||
    lower.includes("bot") ||
    lower.includes("crawl") ||
    lower.includes("spider")
  ) {
    return { label: "🤖 기타 봇", detail: ua.substring(0, 50) };
  }

  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
    return { label: "📱 모바일", detail: "" };
  }

  return { label: "💻 PC", detail: "" };
}

export default function AdminVisitLogsPage() {
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [todayBots, setTodayBots] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const [filter, setFilter] = useState<"all" | "bot" | "visitor">("all");
  const [dailyStats, setDailyStats] = useState<Record<string, DailyStat>>({});
  const [last7days, setLast7days] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [tab, setTab] = useState<"daily" | "logs">("daily");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: filter, limit: "500" });
      if (selectedDate) params.set("date", selectedDate);
      const res = await fetch(`/api/admin/visit-logs?${params}`);
      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setTodayCount(data.todayCount || 0);
      setTodayBots(data.todayBots || 0);
      setTodayVisitors(data.todayVisitors || 0);
      setDailyStats(data.dailyStats || {});
      setLast7days(data.last7days || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [filter, selectedDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const maxDaily = Math.max(...Object.values(dailyStats).map((d) => d.total), 1);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>VISIT LOGS</h1>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>접속자 로그 · 봇 포함 전체 모니터링</p>
      </div>

      <div className="stats-grid4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 18 }}>
        <div className="stat-card">
          <div className="stat-card-num" style={{ color: "var(--gold)" }}>
            {todayCount}
          </div>
          <div className="stat-card-label">오늘 전체</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num" style={{ color: "var(--green)" }}>
            {todayVisitors}
          </div>
          <div className="stat-card-label">실제 방문자</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num" style={{ color: "var(--blue)" }}>
            {todayBots}
          </div>
          <div className="stat-card-label">봇 방문</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num">{logs.length}</div>
          <div className="stat-card-label">로그 건수</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        <button
          className="btn-save"
          style={{ opacity: tab === "daily" ? 1 : 0.4 }}
          onClick={() => setTab("daily")}
        >
          📅 일별 집계
        </button>
        <button
          className="btn-save"
          style={{ opacity: tab === "logs" ? 1 : 0.4 }}
          onClick={() => setTab("logs")}
        >
          📋 상세 로그
        </button>
      </div>

      {tab === "daily" && (
        <div className="card-box">
          <div className="card-box-title">📅 최근 7일 일별 현황</div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px" }}>날짜</th>
                  <th style={{ textAlign: "right", padding: "10px 12px" }}>전체</th>
                  <th style={{ textAlign: "right", padding: "10px 12px" }}>방문자</th>
                  <th style={{ textAlign: "right", padding: "10px 12px" }}>봇</th>
                  <th style={{ width: "40%", padding: "10px 12px" }}>비율</th>
                  <th style={{ padding: "10px 12px" }}>상세</th>
                </tr>
              </thead>
              <tbody>
                {last7days.map((date) => {
                  const stat = dailyStats[date] || { total: 0, visitors: 0, bots: 0 };
                  const pct = maxDaily > 0 ? (stat.total / maxDaily) * 100 : 0;
                  const visitorPct = stat.total > 0 ? (stat.visitors / stat.total) * 100 : 0;
                  const isToday = date === new Date().toISOString().slice(0, 10);
                  return (
                    <tr
                      key={date}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: isToday ? "rgba(200,168,75,.06)" : undefined,
                      }}
                    >
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
                        {date.slice(5)}
                        {isToday && (
                          <span style={{ color: "var(--gold)", fontSize: 10, marginLeft: 4 }}>오늘</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{stat.total}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--green)" }}>
                        {stat.visitors}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--blue)" }}>
                        {stat.bots}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 1,
                            height: 18,
                            borderRadius: 4,
                            overflow: "hidden",
                            background: "var(--deep)",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct * (visitorPct / 100)}%`,
                              background: "var(--green)",
                              opacity: 0.8,
                            }}
                          />
                          <div
                            style={{
                              width: `${pct * ((100 - visitorPct) / 100)}%`,
                              background: "var(--blue)",
                              opacity: 0.5,
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                          방문자 {visitorPct.toFixed(0)}% · 봇 {(100 - visitorPct).toFixed(0)}%
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <button
                          className="btn-save"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => {
                            setSelectedDate(date);
                            setTab("logs");
                          }}
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="card-box">
          <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
            {(["all", "visitor", "bot"] as const).map((f) => (
              <button
                key={f}
                className="btn-save"
                style={{ opacity: filter === f ? 1 : 0.5 }}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "📋 전체" : f === "visitor" ? "👤 방문자" : "🤖 봇"}
              </button>
            ))}
            {selectedDate && (
              <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>
                📅 {selectedDate}
                <button
                  onClick={() => setSelectedDate("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    fontSize: 14,
                    marginLeft: 4,
                  }}
                >
                  ✕
                </button>
              </span>
            )}
            <button className="btn-success" onClick={fetchLogs} disabled={loading}>
              🔄 새로고침
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>로딩 중...</p>
          ) : logs.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>로그 데이터가 없습니다.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>시간</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>유형</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>IP</th>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>경로</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", minWidth: 120 }}>유입 검색어</th>
                    <th style={{ textAlign: "left", padding: "8px 10px", maxWidth: 200 }}>User-Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const { label } = classifyUA(log.user_agent, log.visitor_type);
                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 10px", fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                          {new Date(log.created_at).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td style={{ padding: "8px 10px" }}>{label}</td>
                        <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11 }}>{log.ip || "-"}</td>
                        <td
                          style={{
                            padding: "8px 10px",
                            maxWidth: 160,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.path || "/"}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: log.search_query ? "var(--gold)" : "var(--muted)",
                          }}
                          title={log.search_query || log.referrer || undefined}
                        >
                          {referrerLabel(log)}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            fontSize: 10,
                            maxWidth: 250,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "var(--muted)",
                          }}
                          title={log.user_agent}
                        >
                          {log.user_agent || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
