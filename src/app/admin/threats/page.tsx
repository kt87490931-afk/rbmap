"use client";

import { useState, useEffect, useCallback } from "react";

interface Threat {
  id: string;
  level: "high" | "medium" | "low";
  type: string;
  description: string;
  ip: string;
  path: string;
  user_agent: string;
  created_at: string;
  count?: number;
}

interface Summary {
  high: number;
  medium: number;
  low: number;
  total: number;
}

const LEVEL_STYLE: Record<string, { bg: string; border: string; color: string; label: string }> = {
  high: {
    bg: "rgba(255,77,46,.12)",
    border: "rgba(255,77,46,.4)",
    color: "var(--red)",
    label: "🔴 높음",
  },
  medium: {
    bg: "rgba(255,184,0,.1)",
    border: "rgba(255,184,0,.35)",
    color: "var(--gold)",
    label: "🟡 중간",
  },
  low: {
    bg: "rgba(99,102,241,.08)",
    border: "rgba(99,102,241,.25)",
    color: "var(--blue)",
    label: "🔵 낮음",
  },
};

export default function AdminThreatsPage() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [summary, setSummary] = useState<Summary>({ high: 0, medium: 0, low: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const fetchThreats = useCallback(async () => {
    setLoading(true);
    try {
      const [threatsRes, blockedRes] = await Promise.all([
        fetch("/api/admin/threats"),
        fetch("/api/admin/blocked-ips"),
      ]);
      const threatsData = await threatsRes.json();
      const blockedData = await blockedRes.json().catch(() => []);
      setThreats(threatsData.threats || []);
      setSummary(threatsData.summary || { high: 0, medium: 0, low: 0, total: 0 });
      setBlockedIps(new Set(Array.isArray(blockedData) ? blockedData : []));
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  const handleBlock = useCallback(
    async (ip: string) => {
      if (!ip || ip === "-" || blockingIp) return;
      setBlockingIp(ip);
      setMsg(null);
      try {
        const res = await fetch("/api/admin/blocked-ips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip, reason: "위험 감지 차단" }),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setBlockedIps((prev) => new Set(prev).add(ip));
          setMsg({ text: `${ip} 차단되었습니다.`, type: "ok" });
          setTimeout(() => setMsg(null), 4000);
        } else {
          setMsg({ text: data.error || "차단 실패", type: "err" });
        }
      } catch {
        setMsg({ text: "네트워크 오류", type: "err" });
      } finally {
        setBlockingIp(null);
      }
    },
    [blockingIp]
  );

  const filtered = filter === "all" ? threats : threats.filter((t) => t.level === filter);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>THREAT DETECTION</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>위험 감지 · 최근 24시간 모니터링</p>
        <p style={{ fontSize: 11, color: "var(--muted)", padding: "8px 12px", background: "rgba(0,0,0,.2)", borderRadius: 6 }}>
          💡 <strong>차단:</strong> 아래 "차단" 버튼 클릭 시 즉시 적용. 또는 .env.production에 <code style={{ fontFamily: "monospace", fontSize: 10 }}>BLOCKED_IPS=IP</code> 추가.
        </p>
        {msg && (
          <p
            style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 12,
              background: msg.type === "ok" ? "rgba(46,204,113,.15)" : "rgba(255,71,87,.15)",
              color: msg.type === "ok" ? "var(--green)" : "var(--red)",
            }}
          >
            {msg.text}
          </p>
        )}
      </div>

      <div className="stats-grid4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 18 }}>
        <div className="stat-card" style={{ borderLeft: "3px solid var(--red)" }}>
          <div className="stat-card-num" style={{ color: "var(--red)" }}>
            {summary.high}
          </div>
          <div className="stat-card-label">🔴 높음</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid var(--gold)" }}>
          <div className="stat-card-num" style={{ color: "var(--gold)" }}>
            {summary.medium}
          </div>
          <div className="stat-card-label">🟡 중간</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid var(--blue)" }}>
          <div className="stat-card-num" style={{ color: "var(--blue)" }}>
            {summary.low}
          </div>
          <div className="stat-card-label">🔵 낮음</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-num">{summary.total}</div>
          <div className="stat-card-label">전체 감지</div>
        </div>
      </div>

      <div className="card-box" style={{ marginBottom: 16 }}>
        <div className="card-box-title">🛡 감지 규칙</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 8,
          }}
        >
          {[
            {
              level: "high" as const,
              icon: "🚨",
              title: "공격 경로 접근",
              desc: "/.env, /wp-admin, /phpmyadmin 등 위험 경로",
            },
            {
              level: "high" as const,
              icon: "🔴",
              title: "보안 스캐너",
              desc: "Nikto, SQLMap, Nmap 등 스캐너 UA 탐지",
            },
            {
              level: "medium" as const,
              icon: "⚡",
              title: "과도한 요청",
              desc: "1시간 내 100회 이상 동일 IP 접근",
            },
            {
              level: "medium" as const,
              icon: "🔎",
              title: "경로 스캐닝",
              desc: "24시간 내 50개 이상 서로 다른 경로 탐색",
            },
            {
              level: "low" as const,
              icon: "🤖",
              title: "미확인 봇",
              desc: "알려진 검색엔진이 아닌 봇의 반복 접근",
            },
            {
              level: "low" as const,
              icon: "👻",
              title: "UA 누락",
              desc: "User-Agent 없이 접근하는 요청",
            },
          ].map((rule, i) => {
            const s = LEVEL_STYLE[rule.level];
            return (
              <div
                key={i}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 3, color: s.color }}>
                  {rule.icon} {rule.title}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 11 }}>{rule.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-box">
        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
          {(["all", "high", "medium", "low"] as const).map((f) => (
            <button
              key={f}
              className="btn-save"
              style={{ opacity: filter === f ? 1 : 0.4 }}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "📋 전체" : LEVEL_STYLE[f].label}
            </button>
          ))}
          <button className="btn-success" onClick={fetchThreats} disabled={loading}>
            🔄 새로고침
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>분석 중...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: "var(--green)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>위험 요소 없음</p>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>
              최근 24시간 동안 수상한 활동이 감지되지 않았습니다.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((threat) => {
              const s = LEVEL_STYLE[threat.level];
              return (
                <div
                  key={threat.id}
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 100,
                          fontSize: 10,
                          fontWeight: 700,
                          background: s.border,
                          color: "#fff",
                          marginRight: 8,
                        }}
                      >
                        {s.label}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{threat.type}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        fontFamily: "monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(threat.created_at).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text)", marginBottom: 8 }}>{threat.description}</p>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: 11,
                      color: "var(--muted)",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      🌐 IP:{" "}
                      <strong style={{ color: "var(--text)", fontFamily: "monospace" }}>{threat.ip}</strong>
                    </span>
                    {threat.ip &&
                      threat.ip !== "-" &&
                      (blockedIps.has(threat.ip) ? (
                        <span style={{ color: "var(--green)", fontWeight: 600 }}>✓ 차단됨</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-danger"
                          style={{ padding: "4px 10px", fontSize: 10 }}
                          onClick={() => handleBlock(threat.ip)}
                          disabled={!!blockingIp}
                        >
                          {blockingIp === threat.ip ? "처리 중..." : "🚫 차단"}
                        </button>
                      ))}
                    {threat.path && threat.path !== "-" && (
                      <span>
                        📂 경로: <strong style={{ color: "var(--text)" }}>{threat.path}</strong>
                      </span>
                    )}
                    {threat.count && (
                      <span>
                        🔢 횟수: <strong style={{ color: s.color }}>{threat.count}회</strong>
                      </span>
                    )}
                  </div>
                  {threat.user_agent &&
                    threat.user_agent !== "-" &&
                    threat.user_agent !== "(없음)" && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 10,
                          color: "var(--muted)",
                          background: "rgba(0,0,0,.2)",
                          padding: "4px 8px",
                          borderRadius: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={threat.user_agent}
                      >
                        UA: {threat.user_agent}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
