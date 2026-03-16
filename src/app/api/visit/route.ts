import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notifyThreat } from "@/lib/telegram";

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
];

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const body = await request.json().catch(() => ({}));
    const path = (body.path as string) || "/";
    const rawReferrer = (body.referrer as string) || "";
    const referrer = rawReferrer.length > 2000 ? rawReferrer.slice(0, 2000) : rawReferrer;

    const forwarded = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
    const userAgent = headersList.get("user-agent") || "";

    const botPattern =
      /bot|crawler|spider|slurp|googlebot|bingbot|yandex|duckduckbot|baidu|facebookexternalhit|facebot|twitterbot|kakaotalk|oai-searchbot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider/i;
    const visitorType = botPattern.test(userAgent) ? "bot" : "visitor";

    await supabaseAdmin.from("visit_logs").insert({
      ip,
      user_agent: userAgent.substring(0, 500),
      path: path.substring(0, 500),
      visitor_type: visitorType,
      referrer: referrer || null,
      created_at: new Date().toISOString(),
    });

    const pathLower = path.toLowerCase();
    const attackPath = ATTACK_PATHS.find((ap) => pathLower.includes(ap));
    if (attackPath) {
      notifyThreat("high", "🚨 공격 경로 접근", `위험 경로 "${attackPath}" 접근 시도`, ip).catch(() => {});
    }

    const uaLower = userAgent.toLowerCase();
    const scannerMatch = SCANNER_UA.find((s) => uaLower.includes(s));
    if (scannerMatch && !attackPath) {
      notifyThreat("high", "🔴 보안 스캐너 감지", `스캐너 "${scannerMatch}" 탐지됨`, ip).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
