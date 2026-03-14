const TELEGRAM_API = "https://api.telegram.org/bot";

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  const targetIds = [chatId, channelId].filter(Boolean) as string[];
  return { token, chatId, channelId, targetIds, enabled: !!token && targetIds.length > 0 };
}

/** 단일 chat_id/channel_id로 메시지 전송 */
async function sendToTarget(
  token: string,
  targetId: string,
  text: string,
  parseMode: "HTML" | "Markdown"
): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 채팅 + 채널 모두로 메시지 전송 (둘 다 설정 시) */
async function sendMessage(text: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
  const { token, targetIds, enabled } = getConfig();
  if (!enabled || !token) return false;

  const results = await Promise.all(
    targetIds.map((id) => sendToTarget(token, id, text, parseMode))
  );
  return results.some(Boolean);
}

export async function notifyThreat(
  level: "high" | "medium",
  type: string,
  description: string,
  ip: string
): Promise<boolean> {
  const emoji = level === "high" ? "🚨" : "⚠️";
  const levelKo = level === "high" ? "높음" : "중간";
  const time = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return sendMessage(
    `${emoji} <b>[룸빵여지도 위험 감지 - ${levelKo}]</b>\n\n` +
      `<b>유형:</b> ${type}\n` +
      `<b>내용:</b> ${description}\n` +
      `<b>IP:</b> <code>${ip}</code>\n` +
      `<b>시간:</b> ${time}`
  );
}

export async function notifyAdminLogin(email: string, ip: string): Promise<boolean> {
  const time = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return sendMessage(
    `🔐 <b>[룸빵여지도 관리자 로그인]</b>\n\n` +
      `<b>계정:</b> ${email}\n` +
      `<b>IP:</b> <code>${ip}</code>\n` +
      `<b>시간:</b> ${time}\n` +
      `✅ OTP 인증 완료`
  );
}

export async function notifyTest(): Promise<boolean> {
  const time = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return sendMessage(
    `✅ <b>[룸빵여지도 알림 테스트]</b>\n\n` +
      `텔레그램 알림이 정상적으로 연결되었습니다.\n` +
      `<b>시간:</b> ${time}\n\n` +
      `📋 알림 종류:\n` +
      `• 🚨 위험 감지 (공격 경로, 스캐너)\n` +
      `• 🔐 관리자 로그인`
  );
}

/** 일일 리포트 전송 인자 타입 */
export interface DailyReportData {
  visitors: number;
  bots: number;
  partnerViews: Record<string, number>;
  partnerCalls: Record<string, number>;
  topPartners: { name: string; path: string; views: number; calls: number }[];
  regionDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  newReviews: number;
  newPartners: number;
}

export async function notifyDailyReport(date: string, data: DailyReportData): Promise<boolean> {
  const totalCalls = Object.values(data.partnerCalls).reduce((a, b) => a + b, 0);
  const lines: string[] = [
    `📊 <b>[룸빵여지도 일일 리포트] ${date}</b>\n`,
    `👥 <b>접속</b>`,
    `  • 방문자: ${data.visitors}명`,
    `  • 봇/스캐너: ${data.bots}명`,
    ``,
    `📞 <b>전화 클릭</b>`,
    `  • 총 ${totalCalls}건`,
  ];

  if (data.topPartners.length > 0) {
    lines.push(``, `🏆 <b>상위 노출 업소 TOP 5</b>`);
    data.topPartners.slice(0, 5).forEach((p, i) => {
      lines.push(`  ${i + 1}. ${p.name} (조회 ${p.views}, 전화 ${p.calls})`);
    });
  }

  lines.push(
    ``,
    `📍 <b>지역별 방문</b>`,
    ...Object.entries(data.regionDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([r, c]) => `  • ${r}: ${c}건`),
    ``,
    `🏷️ <b>업종별 방문</b>`,
    ...Object.entries(data.typeDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([t, c]) => `  • ${t}: ${c}건`),
    ``,
    `🆕 <b>신규</b>`,
    `  • 리뷰: ${data.newReviews}건`,
    `  • 업소: ${data.newPartners}건`
  );

  return sendMessage(lines.join("\n"));
}
