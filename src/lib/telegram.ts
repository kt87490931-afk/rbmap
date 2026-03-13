const TELEGRAM_API = "https://api.telegram.org/bot";

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  return { token, chatId, enabled: !!token && !!chatId };
}

async function sendMessage(text: string, parseMode: "HTML" | "Markdown" = "HTML"): Promise<boolean> {
  const { token, chatId, enabled } = getConfig();
  if (!enabled) return false;

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
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

export { sendMessage };
