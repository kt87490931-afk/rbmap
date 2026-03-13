import { NextResponse } from "next/server";
import { requireAdminOrSetup } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const ATTACK_PATHS = [
  "/.env",
  "/.git",
  "/wp-admin",
  "/wp-login.php",
  "/wp-content",
  "/phpmyadmin",
  "/admin/config",
  "/administrator",
  "/xmlrpc.php",
  "/config.php",
  "/backup",
  "/.htaccess",
  "/shell",
  "/cmd",
  "/cgi-bin",
  "/.aws",
  "/.ssh",
  "/etc/passwd",
  "/api/v1/exploit",
];

const SCANNER_UA = [
  "nikto",
  "sqlmap",
  "nmap",
  "dirbuster",
  "gobuster",
  "wpscan",
  "masscan",
  "nuclei",
  "zgrab",
  "httpx",
  "curl/",
  "python-requests",
  "go-http-client",
  "java/",
  "libwww-perl",
];

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

export async function GET() {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: recentLogs } = await supabaseAdmin
    .from("visit_logs")
    .select("*")
    .gte("created_at", since24h)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (!recentLogs || recentLogs.length === 0) {
    return NextResponse.json({
      threats: [],
      summary: { high: 0, medium: 0, low: 0, total: 0 },
    });
  }

  const threats: Threat[] = [];

  for (const log of recentLogs) {
    const pathLower = (log.path || "").toLowerCase();
    const matched = ATTACK_PATHS.find((ap) => pathLower.includes(ap));
    if (matched) {
      threats.push({
        id: `atk-${log.id}`,
        level: "high",
        type: "🚨 공격 경로 접근",
        description: `위험 경로 "${matched}" 접근 시도`,
        ip: log.ip || "-",
        path: log.path,
        user_agent: log.user_agent || "-",
        created_at: log.created_at,
      });
    }
  }

  for (const log of recentLogs) {
    const uaLower = (log.user_agent || "").toLowerCase();
    const matched = SCANNER_UA.find((s) => uaLower.includes(s));
    if (matched) {
      const alreadyAdded = threats.some((t) => t.id === `atk-${log.id}`);
      if (!alreadyAdded) {
        threats.push({
          id: `scan-${log.id}`,
          level: "high",
          type: "🔴 스캐너 감지",
          description: `보안 스캐너 "${matched}" 탐지됨`,
          ip: log.ip || "-",
          path: log.path,
          user_agent: log.user_agent || "-",
          created_at: log.created_at,
        });
      }
    }
  }

  const recentHourLogs = recentLogs.filter((l) => l.created_at >= since1h);
  const ipCount1h: Record<string, number> = {};
  for (const log of recentHourLogs) {
    if (log.ip) {
      ipCount1h[log.ip] = (ipCount1h[log.ip] || 0) + 1;
    }
  }
  for (const [ip, count] of Object.entries(ipCount1h)) {
    if (count >= 100) {
      threats.push({
        id: `rate-${ip}`,
        level: count >= 500 ? "high" : "medium",
        type: "⚡ 과도한 요청",
        description: `1시간 내 ${count}회 요청 (IP: ${ip})`,
        ip,
        path: "-",
        user_agent: "-",
        created_at: new Date().toISOString(),
        count,
      });
    }
  }

  const ipPaths24h: Record<string, Set<string>> = {};
  for (const log of recentLogs) {
    if (log.ip) {
      if (!ipPaths24h[log.ip]) ipPaths24h[log.ip] = new Set();
      ipPaths24h[log.ip].add(log.path || "/");
    }
  }
  for (const [ip, paths] of Object.entries(ipPaths24h)) {
    if (paths.size >= 50) {
      const alreadyAdded = threats.some((t) => t.ip === ip && t.type.includes("과도한"));
      if (!alreadyAdded) {
        threats.push({
          id: `scan-path-${ip}`,
          level: "medium",
          type: "🔎 경로 스캐닝",
          description: `24시간 내 ${paths.size}개 서로 다른 경로 접근 (IP: ${ip})`,
          ip,
          path: `${paths.size}개 경로`,
          user_agent: "-",
          created_at: new Date().toISOString(),
          count: paths.size,
        });
      }
    }
  }

  const unknownBots: Record<string, { count: number; ua: string; ip: string; last: string }> = {};
  for (const log of recentLogs) {
    if (log.visitor_type === "bot") {
      const uaLower = (log.user_agent || "").toLowerCase();
      const isKnown = [
        "googlebot",
        "bingbot",
        "yandexbot",
        "duckduckbot",
        "facebookexternalhit",
        "twitterbot",
        "kakaotalk",
      ].some((k) => uaLower.includes(k));
      if (!isKnown && log.ip) {
        const key = log.ip;
        if (!unknownBots[key])
          unknownBots[key] = { count: 0, ua: log.user_agent || "-", ip: log.ip, last: log.created_at };
        unknownBots[key].count++;
        if (log.created_at > unknownBots[key].last) unknownBots[key].last = log.created_at;
      }
    }
  }
  for (const [ip, info] of Object.entries(unknownBots)) {
    if (info.count >= 10) {
      threats.push({
        id: `unkbot-${ip}`,
        level: info.count >= 50 ? "medium" : "low",
        type: "🤖 미확인 봇",
        description: `알려지지 않은 봇 ${info.count}회 접근`,
        ip,
        path: "-",
        user_agent: info.ua,
        created_at: info.last,
        count: info.count,
      });
    }
  }

  const noUA = recentLogs.filter(
    (l) => !l.user_agent || (l.user_agent as string).trim() === "" || l.user_agent === "-"
  );
  if (noUA.length >= 5) {
    const ips = [...new Set(noUA.map((l) => l.ip).filter(Boolean))];
    threats.push({
      id: "no-ua",
      level: noUA.length >= 30 ? "medium" : "low",
      type: "👻 User-Agent 없음",
      description: `UA 없이 접근 ${noUA.length}건 (IP: ${ips.slice(0, 3).join(", ")}${ips.length > 3 ? "..." : ""})`,
      ip: (ips[0] as string) || "-",
      path: "-",
      user_agent: "(없음)",
      created_at: noUA[0]?.created_at || new Date().toISOString(),
      count: noUA.length,
    });
  }

  threats.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.level] - order[b.level];
  });

  const summary = {
    high: threats.filter((t) => t.level === "high").length,
    medium: threats.filter((t) => t.level === "medium").length,
    low: threats.filter((t) => t.level === "low").length,
    total: threats.length,
  };

  return NextResponse.json({ threats, summary });
}
