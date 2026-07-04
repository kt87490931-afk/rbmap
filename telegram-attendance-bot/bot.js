require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.production') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');
const {
  todayDateStringKST,
  formatTimeKST,
  isValidDateString,
  isValidTimeString,
  parseTimeOnDateKST,
  formatDurationMinutes,
} = require('./time-utils');

const TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = (process.env.ATTENDANCE_ADMIN_IDS || process.env.ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

if (!TOKEN) {
  console.error('BOT_TOKEN 또는 TELEGRAM_BOT_TOKEN이 설정되어 있지 않습니다.');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const scheduledTimers = new Map();

function isOperator(userId) {
  return ADMIN_IDS.includes(String(userId));
}

function canOperate(userId) {
  if (ADMIN_IDS.length === 0) {
    console.warn('[경고] ATTENDANCE_ADMIN_IDS 미설정 — 출근/타이머 조작 불가');
    return false;
  }
  return isOperator(userId) || db.isDelegated(userId);
}

function denyOperate(chatId, replyTo) {
  const text = '⛔ 운영자 또는 지정된 직원만 사용할 수 있습니다.';
  if (replyTo) bot.sendMessage(chatId, text, { reply_to_message_id: replyTo });
  else bot.sendMessage(chatId, text);
}

function parseUserAndTime(args, defaultUserId) {
  let userId = String(defaultUserId);
  let timeStr = null;
  if (args.length === 0) return { userId, timeStr };
  if (args.length === 1) {
    if (isValidTimeString(args[0])) timeStr = args[0];
    else userId = String(args[0]);
  } else {
    userId = String(args[0]);
    timeStr = args[1];
  }
  return { userId, timeStr };
}

function resolveTime(date, timeStr) {
  if (timeStr) {
    if (!isValidTimeString(timeStr)) return { error: '시간 형식: HH:MM (예: 18:30)' };
    return { iso: parseTimeOnDateKST(date, timeStr) };
  }
  return { iso: new Date().toISOString() };
}

async function resolveUserName(chatId, userId, fallback) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    const u = member.user;
    return u.first_name + (u.last_name ? ` ${u.last_name}` : '');
  } catch {
    return fallback || `ID:${userId}`;
  }
}

async function broadcastNotice(text, chatId) {
  await bot.sendMessage(chatId, text).catch((err) => console.error('그룹 공지 실패:', err.message));
  if (CHANNEL_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHANNEL_ID, text }),
      });
    } catch (e) {
      console.error('채널 공지 실패:', e.message);
    }
  }
}

function clearTimer(id) {
  const handle = scheduledTimers.get(id);
  if (handle) {
    clearTimeout(handle);
    scheduledTimers.delete(id);
  }
}

function scheduleSessionAlert(row) {
  clearTimer(row.id);
  const fresh = db.findById(row.id);
  if (!fresh || fresh.status !== 'IN_SESSION' || !fresh.session || fresh.session.alert_sent) return;

  const delay = new Date(fresh.session.alert_time).getTime() - Date.now();

  const fire = () => {
    scheduledTimers.delete(row.id);
    const current = db.findById(row.id);
    if (!current || current.status !== 'IN_SESSION' || current.session.alert_sent) return;

    bot
      .sendMessage(
        current.chat_id,
        `⏰ ${current.user_name}님 — ${current.session.hour_count}시간째, 곧 시간이 종료됩니다. 연장하시겠습니까?\n(현재 알림 기준: ${db.getAlertMinutes()}분)`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '➕ 연장', callback_data: `extend:${current.id}` },
                { text: '⏹ 종료', callback_data: `endsession:${current.id}` },
              ],
            ],
          },
        }
      )
      .catch((err) => console.error('알림 전송 실패:', err.message));

    db.markSessionAlertSent(current.id);
  };

  if (delay <= 0) fire();
  else scheduledTimers.set(row.id, setTimeout(fire, delay));
}

function resyncAllTimers() {
  const pending = db.getPendingSessionAlerts();
  for (const id of [...scheduledTimers.keys()]) {
    const row = db.findById(id);
    if (!row || row.status !== 'IN_SESSION' || !row.session || row.session.alert_sent) {
      clearTimer(id);
    }
  }
  pending.forEach((row) => {
    if (!scheduledTimers.has(row.id)) scheduleSessionAlert(row);
    else {
      clearTimer(row.id);
      scheduleSessionAlert(row);
    }
  });
}

function restorePendingAlerts() {
  db.getPendingSessionAlerts().forEach(scheduleSessionAlert);
}

function statusLabel(row) {
  if (row.status === 'DONE') return '퇴근';
  if (row.status === 'IN_SESSION') return `${row.session.hour_count}시간째 진행중`;
  return '출근(대기중)';
}

function operatorName(msg) {
  return msg.from.first_name + (msg.from.last_name ? ` ${msg.from.last_name}` : '');
}

// ---------- /알림확인 (전 직원) ----------
bot.onText(/^\/알림확인$/, (msg) => {
  const minutes = db.getAlertMinutes();
  bot.sendMessage(
    msg.chat.id,
    `📢 현재 알림 기준: ${minutes}분\n` +
      `(손님 응대 시작/연장 후 ${minutes}분 뒤 연장 확인 알림이 발송됩니다)\n\n` +
      `변경은 운영자가 /알림설정 또는 어드민에서 할 수 있습니다.`
  );
});

// ---------- /알림설정 (운영자) ----------
bot.onText(/^\/알림설정(?:\s+(\d+))?$/, async (msg, match) => {
  if (!isOperator(msg.from.id)) {
    bot.sendMessage(msg.chat.id, '⛔ 운영자만 변경할 수 있습니다. 현재 설정은 /알림확인 으로 확인하세요.');
    return;
  }
  const value = match[1];
  if (!value) {
    bot.sendMessage(
      msg.chat.id,
      `현재 알림 기준: ${db.getAlertMinutes()}분\n변경 예) /알림설정 55`
    );
    return;
  }
  const minutes = parseInt(value, 10);
  if (![50, 55, 60].includes(minutes)) {
    bot.sendMessage(msg.chat.id, '50, 55, 60 중 하나만 설정할 수 있습니다.');
    return;
  }
  const prev = db.getAlertMinutes();
  db.setAlertMinutes(minutes, operatorName(msg));
  db.appendAudit('alert_change', `${prev}분 → ${minutes}분`, operatorName(msg));
  await broadcastNotice(
    `📢 [알림 설정 변경]\n${operatorName(msg)}님이 알림 기준을 ${minutes}분으로 변경했습니다.\n(다음 손님 응대 시작/연장부터 적용)`,
    msg.chat.id
  );
});

// ---------- 권한 관리 (운영자) ----------
bot.onText(/^\/권한추가(?:\s+(\d+))(?:\s+(.+))?$/, (msg, match) => {
  if (!isOperator(msg.from.id)) {
    bot.sendMessage(msg.chat.id, '⛔ 운영자만 사용할 수 있습니다.');
    return;
  }
  const userId = match[1];
  const label = match[2]?.trim() || null;
  if (!userId) {
    bot.sendMessage(msg.chat.id, '사용법: /권한추가 텔레그램ID [별칭]\n예) /권한추가 123456789 카운터');
    return;
  }
  db.addDelegated(userId, label);
  db.appendAudit('delegate_add', userId, operatorName(msg));
  bot.sendMessage(msg.chat.id, `✅ ${userId}${label ? ` (${label})` : ''} 님에게 출근/타이머 권한을 부여했습니다.`);
});

bot.onText(/^\/권한제거(?:\s+(\d+))?$/, (msg, match) => {
  if (!isOperator(msg.from.id)) {
    bot.sendMessage(msg.chat.id, '⛔ 운영자만 사용할 수 있습니다.');
    return;
  }
  const userId = match[1];
  if (!userId) {
    bot.sendMessage(msg.chat.id, '사용법: /권한제거 텔레그램ID');
    return;
  }
  db.removeDelegated(userId);
  db.appendAudit('delegate_remove', userId, operatorName(msg));
  bot.sendMessage(msg.chat.id, `✅ ${userId} 님의 권한을 해제했습니다.`);
});

bot.onText(/^\/권한목록$/, (msg) => {
  if (!isOperator(msg.from.id)) {
    bot.sendMessage(msg.chat.id, '⛔ 운영자만 조회할 수 있습니다.');
    return;
  }
  const ids = db.getDelegatedIds();
  const labels = db.getDelegatedLabels();
  if (ids.length === 0) {
    bot.sendMessage(msg.chat.id, '지정된 직원이 없습니다.\n/권한추가 텔레그램ID [별칭]');
    return;
  }
  const lines = ids.map((id, i) => {
    const label = labels[id] ? ` (${labels[id]})` : '';
    return `${i + 1}. ${id}${label}`;
  });
  bot.sendMessage(msg.chat.id, `👥 출근/타이머 권한 직원 (${ids.length}명)\n\n${lines.join('\n')}`);
});

// ---------- /출근 [userId] [HH:MM] ----------
bot.onText(/^\/출근(?:\s+(.+))?$/, async (msg, match) => {
  if (!canOperate(msg.from.id)) {
    denyOperate(msg.chat.id, msg.message_id);
    return;
  }
  const args = (match[1] || '').trim().split(/\s+/).filter(Boolean);
  const { userId, timeStr } = parseUserAndTime(args, msg.from.id);
  const date = todayDateStringKST();
  const timeResult = resolveTime(date, timeStr);
  if (timeResult.error) {
    bot.sendMessage(msg.chat.id, timeResult.error);
    return;
  }

  const existing = db.findTodayCheckin(userId, date);
  if (existing) {
    bot.sendMessage(
      msg.chat.id,
      `이미 ${existing.user_name}님은 오늘 ${formatTimeKST(existing.checkin_time)}에 출근 처리되었습니다.`
    );
    return;
  }

  const userName = await resolveUserName(msg.chat.id, userId, null);
  db.insertCheckin({
    chatId: msg.chat.id,
    userId,
    userName,
    date,
    checkinTime: timeResult.iso,
  });
  db.appendAudit('checkin', `${userName} ${formatTimeKST(timeResult.iso)}`, operatorName(msg));
  bot.sendMessage(
    msg.chat.id,
    `✅ ${userName}님 출근 (${formatTimeKST(timeResult.iso)}) — 손님을 기다리는 중`
  );
});

// ---------- /시작 [userId] [HH:MM] ----------
bot.onText(/^\/시작(?:\s+(.+))?$/, async (msg, match) => {
  if (!canOperate(msg.from.id)) {
    denyOperate(msg.chat.id, msg.message_id);
    return;
  }
  const args = (match[1] || '').trim().split(/\s+/).filter(Boolean);
  const { userId, timeStr } = parseUserAndTime(args, msg.from.id);
  const date = todayDateStringKST();
  const timeResult = resolveTime(date, timeStr);
  if (timeResult.error) {
    bot.sendMessage(msg.chat.id, timeResult.error);
    return;
  }

  const existing = db.findTodayCheckin(userId, date);
  if (!existing) {
    bot.sendMessage(msg.chat.id, '먼저 /출근 으로 출근 체크를 해주세요.');
    return;
  }
  if (existing.status === 'IN_SESSION') {
    bot.sendMessage(msg.chat.id, `이미 ${existing.user_name}님 ${existing.session.hour_count}시간째 진행중입니다.`);
    return;
  }
  if (existing.status === 'DONE') {
    bot.sendMessage(msg.chat.id, '이미 퇴근 처리되었습니다.');
    return;
  }

  const alertMinutes = db.getAlertMinutes();
  const alertTime = new Date(new Date(timeResult.iso).getTime() + alertMinutes * 60000).toISOString();
  const row = db.startSession(existing.id, {
    startTime: timeResult.iso,
    alertMinutes,
    alertTime,
  });
  scheduleSessionAlert(row);
  db.appendAudit('session_start', `${existing.user_name} ${formatTimeKST(timeResult.iso)}`, operatorName(msg));
  bot.sendMessage(
    msg.chat.id,
    `▶️ ${existing.user_name}님 1시간째 시작 (${formatTimeKST(timeResult.iso)}) — ${alertMinutes}분 후 연장 확인 알림 예정`
  );
});

// ---------- /퇴근 [userId] [HH:MM] ----------
bot.onText(/^\/퇴근(?:\s+(.+))?$/, async (msg, match) => {
  if (!canOperate(msg.from.id)) {
    denyOperate(msg.chat.id, msg.message_id);
    return;
  }
  const args = (match[1] || '').trim().split(/\s+/).filter(Boolean);
  const { userId, timeStr } = parseUserAndTime(args, msg.from.id);
  const date = todayDateStringKST();
  const timeResult = resolveTime(date, timeStr);
  if (timeResult.error) {
    bot.sendMessage(msg.chat.id, timeResult.error);
    return;
  }

  const existing = db.findTodayCheckin(userId, date);
  if (!existing) {
    bot.sendMessage(msg.chat.id, '오늘 출근 기록이 없습니다.');
    return;
  }

  const result = db.setCheckout(existing.id, timeResult.iso);
  if (result === 'IN_SESSION') {
    bot.sendMessage(msg.chat.id, '손님 응대가 진행중입니다. 먼저 종료 처리를 해주세요.');
    return;
  }
  if (result === 'ALREADY') {
    bot.sendMessage(msg.chat.id, '이미 퇴근 처리되었습니다.');
    return;
  }

  clearTimer(existing.id);
  db.appendAudit('checkout', `${existing.user_name} ${formatTimeKST(timeResult.iso)}`, operatorName(msg));
  const worked = formatDurationMinutes(existing.checkin_time, timeResult.iso);
  bot.sendMessage(
    msg.chat.id,
    `🏁 ${existing.user_name}님 퇴근 (${formatTimeKST(timeResult.iso)}) — 총 근무 ${worked}`
  );
});

// ---------- 수정 명령 ----------
bot.onText(/^\/출근수정(?:\s+(.+))?$/, async (msg, match) => {
  if (!canOperate(msg.from.id)) {
    denyOperate(msg.chat.id, msg.message_id);
    return;
  }
  const parts = (match[1] || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 1) {
    bot.sendMessage(msg.chat.id, '사용법: /출근수정 [텔레그램ID] HH:MM\n예) /출근수정 123456789 18:30');
    return;
  }
  let userId;
  let timeStr;
  if (parts.length === 1 && isValidTimeString(parts[0])) {
    userId = String(msg.from.id);
    timeStr = parts[0];
  } else {
    userId = parts[0];
    timeStr = parts[1];
  }
  if (!isValidTimeString(timeStr)) {
    bot.sendMessage(msg.chat.id, '시간 형식: HH:MM');
    return;
  }
  const date = todayDateStringKST();
  const row = db.findTodayCheckin(userId, date);
  if (!row) {
    bot.sendMessage(msg.chat.id, '오늘 출근 기록이 없습니다.');
    return;
  }
  const prev = formatTimeKST(row.checkin_time);
  const iso = parseTimeOnDateKST(date, timeStr);
  db.updateCheckinTime(row.id, iso);
  db.appendAudit('checkin_edit', `${row.user_name} ${prev}→${timeStr}`, operatorName(msg));
  bot.sendMessage(msg.chat.id, `✏️ ${row.user_name}님 출근 시각: ${prev} → ${timeStr}`);
});

bot.onText(/^\/시작수정(?:\s+(.+))?$/, async (msg, match) => {
  if (!canOperate(msg.from.id)) {
    denyOperate(msg.chat.id, msg.message_id);
    return;
  }
  const parts = (match[1] || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    bot.sendMessage(msg.chat.id, '사용법: /시작수정 텔레그램ID HH:MM\n(진행 중 세션만 수정 가능)');
    return;
  }
  const userId = parts[0];
  const timeStr = parts[1];
  if (!isValidTimeString(timeStr)) {
    bot.sendMessage(msg.chat.id, '시간 형식: HH:MM');
    return;
  }
  const date = todayDateStringKST();
  const row = db.findTodayCheckin(userId, date);
  if (!row || row.status !== 'IN_SESSION') {
    bot.sendMessage(msg.chat.id, '진행 중인 세션이 없습니다.');
    return;
  }
  const prev = formatTimeKST(row.session.start_time);
  const iso = parseTimeOnDateKST(date, timeStr);
  const alertMinutes = db.getAlertMinutes();
  const alertTime = new Date(new Date(iso).getTime() + alertMinutes * 60000).toISOString();
  db.updateSessionStartTime(row.id, { startTime: iso, alertMinutes, alertTime });
  clearTimer(row.id);
  scheduleSessionAlert(db.findById(row.id));
  db.appendAudit('session_edit', `${row.user_name} ${prev}→${timeStr}`, operatorName(msg));
  bot.sendMessage(
    msg.chat.id,
    `✏️ ${row.user_name}님 세션 시작: ${prev} → ${timeStr} (알림 ${alertMinutes}분 후 재예약)`
  );
});

bot.onText(/^\/퇴근수정(?:\s+(.+))?$/, async (msg, match) => {
  if (!canOperate(msg.from.id)) {
    denyOperate(msg.chat.id, msg.message_id);
    return;
  }
  const parts = (match[1] || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    bot.sendMessage(msg.chat.id, '사용법: /퇴근수정 텔레그램ID HH:MM');
    return;
  }
  const userId = parts[0];
  const timeStr = parts[1];
  if (!isValidTimeString(timeStr)) {
    bot.sendMessage(msg.chat.id, '시간 형식: HH:MM');
    return;
  }
  const date = todayDateStringKST();
  const row = db.findTodayCheckin(userId, date);
  if (!row || row.status !== 'DONE') {
    bot.sendMessage(msg.chat.id, '퇴근 완료 기록이 없습니다.');
    return;
  }
  const prev = formatTimeKST(row.checkout_time);
  const iso = parseTimeOnDateKST(date, timeStr);
  db.updateCheckoutTime(row.id, iso);
  db.appendAudit('checkout_edit', `${row.user_name} ${prev}→${timeStr}`, operatorName(msg));
  bot.sendMessage(msg.chat.id, `✏️ ${row.user_name}님 퇴근 시각: ${prev} → ${timeStr}`);
});

bot.onText(/^\/기록삭제(?:\s+(\d+))?$/, async (msg, match) => {
  if (!isOperator(msg.from.id)) {
    bot.sendMessage(msg.chat.id, '⛔ 운영자만 기록을 삭제할 수 있습니다.');
    return;
  }
  const userId = match[1];
  if (!userId) {
    bot.sendMessage(msg.chat.id, '사용법: /기록삭제 텔레그램ID');
    return;
  }
  const date = todayDateStringKST();
  const row = db.findTodayCheckin(userId, date);
  if (!row) {
    bot.sendMessage(msg.chat.id, '오늘 기록이 없습니다.');
    return;
  }
  clearTimer(row.id);
  db.deleteCheckin(row.id);
  db.appendAudit('record_delete', row.user_name, operatorName(msg));
  bot.sendMessage(msg.chat.id, `🗑 ${row.user_name}님 오늘 출근 기록을 삭제했습니다.`);
});

// ---------- 버튼 UI (/출근, /시작, /퇴근) ----------
bot.onText(/^\/출근버튼$/, (msg) => {
  if (!canOperate(msg.from.id)) {
    denyOperate(msg.chat.id, msg.message_id);
    return;
  }
  bot.sendMessage(msg.chat.id, '아래 버튼을 눌러 출근을 체크해주세요.', {
    reply_markup: { inline_keyboard: [[{ text: '✅ 출근하기', callback_data: 'checkin' }]] },
  });
});

bot.onText(/^\/시작버튼$/, (msg) => {
  if (!canOperate(msg.from.id)) {
    denyOperate(msg.chat.id, msg.message_id);
    return;
  }
  bot.sendMessage(msg.chat.id, '손님 응대를 시작하려면 아래 버튼을 눌러주세요.', {
    reply_markup: { inline_keyboard: [[{ text: '▶️ 손님 응대 시작', callback_data: 'startsession' }]] },
  });
});

bot.onText(/^\/퇴근버튼$/, (msg) => {
  if (!canOperate(msg.from.id)) {
    denyOperate(msg.chat.id, msg.message_id);
    return;
  }
  bot.sendMessage(msg.chat.id, '아래 버튼을 눌러 퇴근을 체크해주세요.', {
    reply_markup: { inline_keyboard: [[{ text: '🏁 퇴근하기', callback_data: 'checkout' }]] },
  });
});

// ---------- 버튼 클릭 ----------
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const actorId = query.from.id;
  const userId = query.from.id;
  const userName = query.from.first_name + (query.from.last_name ? ` ${query.from.last_name}` : '');
  const date = todayDateStringKST();
  const [action, idStr] = query.data.split(':');
  const targetId = idStr ? parseInt(idStr, 10) : null;

  if (['checkin', 'startsession', 'checkout'].includes(action) && !canOperate(actorId)) {
    await bot.answerCallbackQuery(query.id, { text: '운영자 또는 지정된 직원만 사용할 수 있습니다.', show_alert: true });
    return;
  }
  if (['extend', 'endsession'].includes(action) && !canOperate(actorId)) {
    await bot.answerCallbackQuery(query.id, { text: '운영자 또는 지정된 직원만 연장/종료할 수 있습니다.', show_alert: true });
    return;
  }

  if (action === 'checkin') {
    const existing = db.findTodayCheckin(userId, date);
    if (existing) {
      await bot.answerCallbackQuery(query.id, {
        text: `이미 오늘 ${formatTimeKST(existing.checkin_time)}에 출근 처리되었습니다.`,
        show_alert: true,
      });
      return;
    }
    const now = new Date();
    db.insertCheckin({ chatId, userId, userName, date, checkinTime: now.toISOString() });
    await bot.answerCallbackQuery(query.id, { text: '출근 처리되었습니다!' });
    bot.sendMessage(chatId, `✅ ${userName}님 출근 (${formatTimeKST(now.toISOString())}) — 손님을 기다리는 중`);
    return;
  }

  if (action === 'startsession') {
    const existing = db.findTodayCheckin(userId, date);
    if (!existing) {
      await bot.answerCallbackQuery(query.id, { text: '먼저 /출근 으로 출근 체크를 해주세요.', show_alert: true });
      return;
    }
    if (existing.status === 'IN_SESSION') {
      await bot.answerCallbackQuery(query.id, {
        text: `이미 ${existing.session.hour_count}시간째 진행중입니다.`,
        show_alert: true,
      });
      return;
    }
    if (existing.status === 'DONE') {
      await bot.answerCallbackQuery(query.id, { text: '이미 퇴근 처리되었습니다.', show_alert: true });
      return;
    }
    const now = new Date();
    const alertMinutes = db.getAlertMinutes();
    const alertTime = new Date(now.getTime() + alertMinutes * 60000).toISOString();
    const row = db.startSession(existing.id, {
      startTime: now.toISOString(),
      alertMinutes,
      alertTime,
    });
    scheduleSessionAlert(row);
    await bot.answerCallbackQuery(query.id, { text: '1시간째 시작되었습니다!' });
    bot.sendMessage(
      chatId,
      `▶️ ${userName}님 1시간째 시작 (${formatTimeKST(now.toISOString())}) — ${alertMinutes}분 후 연장 확인 알림 예정`
    );
    return;
  }

  if (action === 'extend') {
    const row = db.findById(targetId);
    if (!row || row.status !== 'IN_SESSION') {
      await bot.answerCallbackQuery(query.id, { text: '이미 처리되었거나 존재하지 않는 세션입니다.', show_alert: true });
      return;
    }
    const now = new Date();
    const alertMinutes = db.getAlertMinutes();
    const alertTime = new Date(now.getTime() + alertMinutes * 60000).toISOString();
    const updated = db.extendSession(targetId, { alertMinutes, alertTime });
    scheduleSessionAlert(updated);
    await bot.answerCallbackQuery(query.id, { text: `${updated.session.hour_count}시간째로 연장되었습니다.` });
    bot.sendMessage(
      chatId,
      `➕ ${updated.user_name}님 ${updated.session.hour_count}시간째로 연장 — ${alertMinutes}분 후 다시 확인 알림 예정`
    );
    return;
  }

  if (action === 'endsession') {
    const row = db.findById(targetId);
    if (!row || row.status !== 'IN_SESSION') {
      await bot.answerCallbackQuery(query.id, { text: '이미 처리되었거나 존재하지 않는 세션입니다.', show_alert: true });
      return;
    }
    clearTimer(targetId);
    const now = new Date();
    const hours = row.session.hour_count;
    db.endSession(targetId, now.toISOString());
    await bot.answerCallbackQuery(query.id, { text: '종료 처리되었습니다.' });
    bot.sendMessage(chatId, `⏹ ${row.user_name}님 세션 종료 (총 ${hours}시간) — 다시 대기중 상태입니다.`);
    return;
  }

  if (action === 'checkout') {
    const existing = db.findTodayCheckin(userId, date);
    if (!existing) {
      await bot.answerCallbackQuery(query.id, { text: '오늘 출근 기록이 없습니다.', show_alert: true });
      return;
    }
    const now = new Date();
    const result = db.setCheckout(existing.id, now.toISOString());
    if (result === 'IN_SESSION') {
      await bot.answerCallbackQuery(query.id, {
        text: '손님 응대가 진행중입니다. 먼저 종료 처리를 해주세요.',
        show_alert: true,
      });
      return;
    }
    if (result === 'ALREADY') {
      await bot.answerCallbackQuery(query.id, { text: '이미 퇴근 처리되었습니다.', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(query.id, { text: '퇴근 처리되었습니다!' });
    const worked = formatDurationMinutes(existing.checkin_time, now.toISOString());
    bot.sendMessage(chatId, `🏁 ${userName}님 퇴근 (${formatTimeKST(now.toISOString())}) — 총 근무 ${worked}`);
  }
});

// ---------- 조회 ----------
bot.onText(/^\/출근현황(?:\s+(\d{4}-\d{2}-\d{2}))?$/, (msg, match) => {
  const date = match[1] || todayDateStringKST();
  if (!isValidDateString(date)) {
    bot.sendMessage(msg.chat.id, '날짜 형식: YYYY-MM-DD');
    return;
  }
  const rows = db.getCheckinsByDate(date);
  if (rows.length === 0) {
    bot.sendMessage(msg.chat.id, `${date} 출근 기록이 없습니다.`);
    return;
  }
  const alertMin = db.getAlertMinutes();
  const lines = rows.map((r, i) => {
    const sessionCount = r.session_history.length + (r.status === 'IN_SESSION' ? 1 : 0);
    const totalHours =
      r.session_history.reduce((sum, s) => sum + s.hours, 0) +
      (r.status === 'IN_SESSION' ? r.session.hour_count : 0);
    const checkoutPart = r.checkout_time ? `, 퇴근 ${formatTimeKST(r.checkout_time)}` : '';
    return `${i + 1}. ${r.user_name} — [${statusLabel(r)}] 출근 ${formatTimeKST(r.checkin_time)}${checkoutPart} / 손님응대 ${sessionCount}회, 총 ${totalHours}시간`;
  });
  bot.sendMessage(
    msg.chat.id,
    `📋 ${date} 출근부 (총 ${rows.length}명) · 알림 ${alertMin}분\n\n${lines.join('\n')}`
  );
});

bot.onText(/^\/출근부목록$/, (msg) => {
  const dates = db.getAvailableDates();
  if (dates.length === 0) {
    bot.sendMessage(msg.chat.id, '아직 출근 기록이 없습니다.');
    return;
  }
  bot.sendMessage(msg.chat.id, `최근 기록 날짜:\n${dates.join('\n')}\n\n조회: /출근현황 ${dates[0]}`);
});

bot.onText(/^\/도움말$/, (msg) => {
  const op = canOperate(msg.from.id);
  const admin = isOperator(msg.from.id);
  const lines = [
    '📌 출근부 봇 명령어',
    '',
    '【전 직원】',
    '/알림확인 — 현재 50/55/60분 알림 설정 조회',
    '/출근현황 [날짜] — 출근부 조회',
    '/출근부목록 — 기록 날짜 목록',
  ];
  if (op) {
    lines.push('', '【출근/타이머 권한】');
    lines.push('/출근 [ID] [HH:MM] — 출근 (시간 지정 가능)');
    lines.push('/시작 [ID] [HH:MM] — 손님 응대 시작');
    lines.push('/퇴근 [ID] [HH:MM] — 퇴근');
    lines.push('/출근수정 [ID] HH:MM — 출근 시각 수정');
    lines.push('/시작수정 ID HH:MM — 세션 시작 시각 수정');
    lines.push('/퇴근수정 ID HH:MM — 퇴근 시각 수정');
    lines.push('/출근버튼 /시작버튼 /퇴근버튼 — 버튼 UI');
  }
  if (admin) {
    lines.push('', '【운영자】');
    lines.push('/알림설정 [50|55|60] — 알림 시점 변경 (그룹·채널 공지)');
    lines.push('/권한추가 ID [별칭] — 출근/타이머 권한 부여');
    lines.push('/권한제거 ID — 권한 해제');
    lines.push('/권한목록 — 권한 직원 목록');
    lines.push('/기록삭제 ID — 오늘 출근 기록 삭제');
  }
  bot.sendMessage(msg.chat.id, lines.join('\n'));
});

restorePendingAlerts();
setInterval(resyncAllTimers, 60000);

console.log(`텔레그램 출근부 봇 실행 (DB: ${db.DB_FILE}, 운영자 ${ADMIN_IDS.length}명)`);
