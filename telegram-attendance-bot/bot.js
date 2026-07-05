require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.production'), override: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
require('dotenv').config({ override: true });

const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');
const fmt = require('./format');
const flows = require('./flows');
const {
  todayDateStringKST,
  formatTimeKST,
  isValidTimeString,
  parseTimeOnDateKST,
} = require('./time-utils');

// 출근부 전용 봇 토큰 우선 (룸빵여지도 알림 봇과 분리)
const TOKEN =
  process.env.ATTENDANCE_BOT_TOKEN || process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = (process.env.ATTENDANCE_ADMIN_IDS || process.env.ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN 미설정');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const scheduledTimers = new Map();

function isOperator(userId) {
  return ADMIN_IDS.includes(String(userId));
}

function canOperate(userId) {
  if (ADMIN_IDS.length === 0) return false;
  return isOperator(userId) || db.isDelegated(userId);
}

function operatorName(from) {
  return from.first_name + (from.last_name ? ` ${from.last_name}` : '');
}

function deny(chatId) {
  bot.sendMessage(chatId, '⛔ 운영자 또는 지정된 직원만 사용할 수 있습니다.');
}

async function broadcast(text, chatId) {
  await bot.sendMessage(chatId, text).catch(() => {});
  if (CHANNEL_ID) {
    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHANNEL_ID, text }),
    }).catch(() => {});
  }
}

function clearTimer(sessionId) {
  const h = scheduledTimers.get(sessionId);
  if (h) {
    clearTimeout(h);
    scheduledTimers.delete(sessionId);
  }
}

function scheduleAlert(session) {
  clearTimer(session.id);
  const fresh = db.findSessionById(session.id);
  if (!fresh || fresh.session.status !== 'active' || fresh.session.alert_sent) return;

  const delay = new Date(fresh.session.alert_time).getTime() - Date.now();
  const fire = () => {
    scheduledTimers.delete(session.id);
    const cur = db.findSessionById(session.id);
    if (!cur || cur.session.status !== 'active' || cur.session.alert_sent) return;

    const text = fmt.formatAlertMessage(cur.session);
    bot
      .sendMessage(cur.session.chat_id, text, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '➕ 연장', callback_data: `sess:ext:${cur.session.id}` },
              { text: '⏹ 종료', callback_data: `sess:end:${cur.session.id}` },
            ],
            [{ text: '👥 인원변경', callback_data: `sess:staff:${cur.session.id}` }],
          ],
        },
      })
      .catch((e) => console.error('알림 실패:', e.message));

    db.markSessionAlertSent(cur.session.id);
  };

  if (delay <= 0) fire();
  else scheduledTimers.set(session.id, setTimeout(fire, delay));
}

function resyncTimers() {
  db.getPendingAlerts().forEach(({ session }) => scheduleAlert(session));
}

function processAutoEnds() {
  for (const { session } of db.getSessionsDueForAutoEnd()) {
    clearTimer(session.id);
    const result = db.endSession(session.id);
    if (!result) continue;

    const rn = fmt.roomName(session.room_id);
    db.appendAudit('room_auto_end', rn, 'system');
    const counts = result.session.assignments
      .filter((a) => !a.removed_at)
      .map((a) => `${fmt.ladyName(a.lady_id)} +1`)
      .join(', ');
    const endAt = formatTimeKST(result.session.end_scheduled);
    const text =
      `⏰ ❤️${rn}\n` +
      `해당방이 종료되었습니다.\n\n` +
      `(종료 예정 ${endAt} + ${db.AUTO_END_GRACE_MINUTES}분 경과)\n\n` +
      `${fmt.sessionLine(result.session)}\n\n` +
      `완료 세션: ${counts || '-'}`;
    bot.sendMessage(session.chat_id, text).catch((e) => console.error('자동종료 알림 실패:', e.message));
  }
}

function tickMaintenance() {
  resyncTimers();
  processAutoEnds();
}

function findActiveSessionByRoomName(date, roomName) {
  const room = db.findRoomByName(roomName);
  if (!room) return null;
  const day = db.getDay(date);
  return day.sessions.find((s) => s.room_id === room.id && s.status === 'active') || null;
}

function parseLadyNames(str) {
  return str
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => {
      const l = db.findLadyByName(name);
      return l ? l.id : null;
    });
}

async function sendBoard(chatId, view = 'all', messageId = null) {
  const date = todayDateStringKST();
  const { text } = fmt.buildView(view, date);
  const keyboard = { inline_keyboard: fmt.navKeyboard(false, false) };

  if (messageId) {
    try {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboard,
      });
      return;
    } catch {
      /* fallback send */
    }
  }
  await bot.sendMessage(chatId, text, { reply_markup: keyboard });
}

function sendBoardWithPerm(chatId, view, from, messageId = null) {
  const date = todayDateStringKST();
  const op = isOperator(from.id);
  const co = canOperate(from.id);
  const { text } = fmt.buildView(view, date, { canOperate: co, isOperator: op });
  let keyboard = fmt.navKeyboard(co, op);

  if (view === 'alert' && co) {
    keyboard = [fmt.alertKeyboard(), ...keyboard];
  }

  const markup = { inline_keyboard: keyboard };

  if (messageId) {
    return bot.editMessageText(text, { chat_id: chatId, message_id: messageId, reply_markup: markup });
  }
  return bot.sendMessage(chatId, text, { reply_markup: markup });
}

// ---------- /출근부 ----------
bot.onText(/^\/출근부(?:@\w+)?$/, (msg) => {
  sendBoardWithPerm(msg.chat.id, 'all', msg.from);
});

bot.onText(/^\/알림확인(?:@\w+)?$/, (msg) => {
  const m = db.getAlertMinutes();
  bot.sendMessage(
    msg.chat.id,
    `📢 현재 알람: ${m}분\n시작 시각 + ${m}분 후 룸 알림이 발송됩니다.`
  );
});

bot.onText(/^\/도움말(?:@\w+)?$/, (msg) => {
  sendBoardWithPerm(msg.chat.id, 'help', msg.from);
});

// ---------- 마스터 등록 ----------
function registerLady(msg, name) {
  const id = db.addLady(name);
  if (!id) return bot.sendMessage(msg.chat.id, `이미 등록된 이름입니다: ${name}`);
  db.appendAudit('lady_add', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 언니 등록: ${name}`);
}

bot.onText(/^\/(?:아가씨등록|언니등록)(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!isOperator(msg.from.id)) return deny(msg.chat.id);
  registerLady(msg, m[1].trim());
});

bot.onText(/^\/(?:아가씨해제|언니해제)(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!isOperator(msg.from.id)) return deny(msg.chat.id);
  const name = m[1].trim();
  if (!db.deactivateLady(name)) return bot.sendMessage(msg.chat.id, `없음: ${name}`);
  db.appendAudit('lady_remove', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 언니 해제: ${name}`);
});

function renameLadyCmd(msg, oldName, newName) {
  const r = db.renameLady(oldName, newName);
  if (r === 'NOT_FOUND') return bot.sendMessage(msg.chat.id, `등록되지 않은 이름: ${oldName}`);
  if (r === 'DUPLICATE') return bot.sendMessage(msg.chat.id, `이미 사용 중인 이름: ${newName}`);
  if (r === 'INVALID' || r === 'SAME') return bot.sendMessage(msg.chat.id, '이름을 확인하세요.');
  db.appendAudit('lady_rename', `${oldName}→${newName}`, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ [🙍${oldName}] → [🙍${newName}] 언니 이름 변경`);
}

bot.onText(/^\/(?:아가씨이름변경|언니이름변경)(?:@\w+)?\s+(\S+)\s+(\S+)$/, (msg, m) => {
  if (!isOperator(msg.from.id)) return deny(msg.chat.id);
  renameLadyCmd(msg, m[1].trim(), m[2].trim());
});

bot.onText(/^\/룸등록(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!isOperator(msg.from.id)) return deny(msg.chat.id);
  const name = m[1].trim();
  const id = db.addRoom(name);
  if (!id) return bot.sendMessage(msg.chat.id, `이미 등록된 룸: ${name}`);
  db.appendAudit('room_add', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 룸 등록: ❤️${name}`);
});

bot.onText(/^\/룸해제(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!isOperator(msg.from.id)) return deny(msg.chat.id);
  const name = m[1].trim();
  if (!db.deactivateRoom(name)) return bot.sendMessage(msg.chat.id, `없음: ${name}`);
  db.appendAudit('room_remove', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 룸 해제: ${name}`);
});

bot.onText(/^\/룸이름변경(?:@\w+)?\s+(\S+)\s+(\S+)$/, (msg, m) => {
  if (!isOperator(msg.from.id)) return deny(msg.chat.id);
  const oldName = m[1].trim();
  const newName = m[2].trim();
  const r = db.renameRoom(oldName, newName);
  if (r === 'NOT_FOUND') return bot.sendMessage(msg.chat.id, `등록되지 않은 룸: ${oldName}`);
  if (r === 'DUPLICATE') return bot.sendMessage(msg.chat.id, `이미 사용 중인 룸: ${newName}`);
  if (r === 'INVALID' || r === 'SAME') return bot.sendMessage(msg.chat.id, '이름을 확인하세요.');
  db.appendAudit('room_rename', `${oldName}→${newName}`, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ [❤️${oldName}] → [❤️${newName}] 룸 이름 변경`);
});

// ---------- 출근 / 퇴근 ----------
bot.onText(/^\/출근(?:@\w+)?\s+(\S+)(?:\s+(\d{1,2}:\d{2}))?$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const name = m[1];
  const date = todayDateStringKST();
  const lady = db.findLadyByName(name);
  if (!lady) return bot.sendMessage(msg.chat.id, `등록되지 않은 이름: ${name}`);
  const st = db.getLadyDayState(date, lady.id);
  if (st && st.checked_in && !st.checked_out) {
    return bot.sendMessage(msg.chat.id, `${name}님은 이미 출근 상태입니다.`);
  }
  let iso = new Date().toISOString();
  if (m[2]) {
    if (!isValidTimeString(m[2])) return bot.sendMessage(msg.chat.id, 'HH:MM 형식');
    iso = parseTimeOnDateKST(date, m[2]);
  }
  db.checkInLady(date, lady.id, iso);
  db.appendAudit('checkin', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ [🙋${name}] 출근 (${formatTimeKST(iso)})`);
});

bot.onText(/^\/퇴근(?:@\w+)?\s+(\S+)(?:\s+(\d{1,2}:\d{2}))?$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const name = m[1];
  const date = todayDateStringKST();
  const lady = db.findLadyByName(name);
  if (!lady) return bot.sendMessage(msg.chat.id, `등록되지 않은 이름: ${name}`);
  let iso = new Date().toISOString();
  if (m[2]) {
    if (!isValidTimeString(m[2])) return bot.sendMessage(msg.chat.id, 'HH:MM 형식');
    iso = parseTimeOnDateKST(date, m[2]);
  }
  const r = db.checkOutLady(date, lady.id, iso);
  if (r === 'IN_SESSION') return bot.sendMessage(msg.chat.id, `${name} — 진행중인 방에서 먼저 빼주세요.`);
  if (r === 'ALREADY') return bot.sendMessage(msg.chat.id, '이미 퇴근 처리됨');
  if (!r) return bot.sendMessage(msg.chat.id, '출근 기록 없음');
  db.appendAudit('checkout', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `🏁 [🤮${name}] 퇴근 (${formatTimeKST(iso)})`);
});

// ---------- 방 세션 ----------
bot.onText(/^\/방시작(?:@\w+)?\s+(\S+)\s+(\d+)\s+([^\s]+)(?:\s+(\d{1,2}:\d{2}))?$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const roomName = m[1];
  const customerCount = parseInt(m[2], 10);
  const ladyStr = m[3];
  const date = todayDateStringKST();
  const room = db.findRoomByName(roomName);
  if (!room) return bot.sendMessage(msg.chat.id, `룸 없음: ${roomName}`);

  const ids = parseLadyNames(ladyStr);
  if (ids.includes(null)) return bot.sendMessage(msg.chat.id, '아가씨 이름을 확인하세요.');
  if (ids.length === 0) return bot.sendMessage(msg.chat.id, '배정 아가씨 필요');

  let startTime = new Date().toISOString();
  if (m[4]) {
    if (!isValidTimeString(m[4])) return bot.sendMessage(msg.chat.id, 'HH:MM 형식');
    startTime = parseTimeOnDateKST(date, m[4]);
  }

  const alertMin = db.getAlertMinutes();
  const session = db.startRoomSession(date, {
    roomId: room.id,
    chatId: msg.chat.id,
    customerCount,
    ladyIds: ids,
    startTime,
    alertMinutes: alertMin,
  });

  if (session === 'ROOM_BUSY') return bot.sendMessage(msg.chat.id, `${roomName} — 이미 진행중`);
  if (session === 'LADY_BUSY') return bot.sendMessage(msg.chat.id, '아가씨가 다른 방 진행중');

  scheduleAlert(session);
  db.appendAudit('room_start', roomName, operatorName(msg.from));
  bot.sendMessage(
    msg.chat.id,
    `▶️ 방 시작\n${fmt.sessionLine(session)}\n\n${alertMin}분 후 알림 예정 (${formatTimeKST(session.alert_time)})`
  );
});

bot.onText(/^\/방종료(?:@\w+)?\s+(\S+)$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const date = todayDateStringKST();
  const sess = findActiveSessionByRoomName(date, m[1].trim());
  if (!sess) return bot.sendMessage(msg.chat.id, '진행중인 방 없음');
  clearTimer(sess.id);
  const result = db.endSession(sess.id);
  db.appendAudit('room_end', m[1], operatorName(msg.from));
  const counts = result.session.assignments
    .filter((a) => !a.removed_at)
    .map((a) => `${fmt.ladyName(a.lady_id)} +1`)
    .join(', ');
  bot.sendMessage(msg.chat.id, `⏹ ${m[1]} 종료\n완료 세션: ${counts || '-'}`);
});

bot.onText(/^\/방연장(?:@\w+)?\s+(\S+)$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const date = todayDateStringKST();
  const sess = findActiveSessionByRoomName(date, m[1].trim());
  if (!sess) return bot.sendMessage(msg.chat.id, '진행중인 방 없음');
  const updated = db.extendSession(sess.id);
  clearTimer(sess.id);
  scheduleAlert(updated.session);
  bot.sendMessage(
    msg.chat.id,
    `➕ ${m[1]} ${updated.session.hour_count}시간째\n${fmt.sessionLine(updated.session)}`
  );
});

bot.onText(/^\/방시작수정(?:@\w+)?\s+(\S+)\s+(\d{1,2}:\d{2})$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const roomName = m[1].trim();
  const timeStr = m[2].trim();
  if (!isValidTimeString(timeStr)) return bot.sendMessage(msg.chat.id, 'HH:MM 형식 (예: 22:33)');
  const date = todayDateStringKST();
  const sess = findActiveSessionByRoomName(date, roomName);
  if (!sess) return bot.sendMessage(msg.chat.id, `${roomName} — 진행중인 방 없음`);
  const newStart = parseTimeOnDateKST(date, timeStr);
  const updated = db.updateSessionStartTime(sess.id, newStart);
  if (!updated) return bot.sendMessage(msg.chat.id, '변경 실패');
  clearTimer(sess.id);
  scheduleAlert(updated.session);
  db.appendAudit('room_start_edit', `${roomName} ${formatTimeKST(updated.oldStart)}→${timeStr}`, operatorName(msg.from));
  bot.sendMessage(
    msg.chat.id,
    `🕐 ${roomName} 시작 시각 변경\n${formatTimeKST(updated.oldStart)} → ${timeStr}\n\n${fmt.sessionLine(updated.session)}\n\n알람: ${formatTimeKST(updated.session.alert_time)}`
  );
});

bot.onText(/^\/방추가(?:@\w+)?\s+(\S+)\s+(\S+)$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const date = todayDateStringKST();
  const sess = findActiveSessionByRoomName(date, m[1].trim());
  if (!sess) return bot.sendMessage(msg.chat.id, '진행중인 방 없음');
  const lady = db.findLadyByName(m[2].trim());
  if (!lady) return bot.sendMessage(msg.chat.id, '아가씨 없음');
  const r = db.addLadyToSession(sess.id, lady.id);
  if (r === 'LADY_BUSY') return bot.sendMessage(msg.chat.id, '다른 방 진행중');
  if (r === 'ALREADY') return bot.sendMessage(msg.chat.id, '이미 배정됨');
  bot.sendMessage(msg.chat.id, `👥 ${m[1]} + [🙅${lady.name}]\n${fmt.sessionLine(r)}`);
});

bot.onText(/^\/방빼(?:@\w+)?\s+(\S+)\s+(\S+)$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const date = todayDateStringKST();
  const sess = findActiveSessionByRoomName(date, m[1].trim());
  if (!sess) return bot.sendMessage(msg.chat.id, '진행중인 방 없음');
  const lady = db.findLadyByName(m[2].trim());
  if (!lady) return bot.sendMessage(msg.chat.id, '아가씨 없음');
  const r = db.removeLadyFromSession(sess.id, lady.id);
  if (!r) return bot.sendMessage(msg.chat.id, '배정되지 않음');
  bot.sendMessage(msg.chat.id, `👥 ${m[1]} - ${lady.name} (이번 방 완료횟수 제외)\n${fmt.sessionLine(r)}`);
});

// ---------- 권한 ----------
bot.onText(/^\/권한추가(?:@\w+)?\s+(\d+)(?:\s+(.+))?$/, (msg, m) => {
  if (!isOperator(msg.from.id)) return deny(msg.chat.id);
  db.addDelegated(m[1], m[2]?.trim() || null);
  bot.sendMessage(msg.chat.id, `✅ 권한 부여: ${m[1]}`);
});

bot.onText(/^\/권한제거(?:@\w+)?\s+(\d+)$/, (msg, m) => {
  if (!isOperator(msg.from.id)) return deny(msg.chat.id);
  db.removeDelegated(m[1]);
  bot.sendMessage(msg.chat.id, `✅ 권한 해제: ${m[1]}`);
});

bot.onText(/^\/권한목록(?:@\w+)?$/, (msg) => {
  if (!isOperator(msg.from.id)) return deny(msg.chat.id);
  const ids = db.getDelegatedIds();
  const labels = db.getDelegatedLabels();
  bot.sendMessage(
    msg.chat.id,
    ids.length ? ids.map((id) => `${id}${labels[id] ? ` (${labels[id]})` : ''}`).join('\n') : '없음'
  );
});

// ---------- 콜백 ----------
bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;
  const data = q.data;
  const from = q.from;

  if (data === 'noop') {
    await bot.answerCallbackQuery(q.id);
    return;
  }

  if (data === 'op:ci_menu') {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const date = todayDateStringKST();
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(flows.checkinMenuText(date), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.checkinKeyboard(date) },
    });
    return;
  }

  if (data === 'op:rs_menu') {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    flows.clearRoomFlow(from.id, chatId);
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('▶️ 방 시작 — 룸을 선택하세요.', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.roomPickKeyboard() },
    });
    return;
  }

  if (data === 'op:rm_menu') {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const date = todayDateStringKST();
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(`${fmt.buildView('act', date).text}\n\n🎛 연장 / 종료`, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.activeRoomKeyboard(date) },
    });
    return;
  }

  if (data.startsWith('ci:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const ladyId = parseInt(data.slice(3), 10);
    const lady = db.findLadyById(ladyId);
    const date = todayDateStringKST();
    if (!lady) {
      await bot.answerCallbackQuery(q.id, { text: '없음', show_alert: true });
      return;
    }
    const iso = new Date().toISOString();
    db.checkInLady(date, ladyId, iso);
    db.appendAudit('checkin', lady.name, operatorName(from));
    await bot.answerCallbackQuery(q.id, { text: `${lady.name} 출근!` });
    await bot.editMessageText(flows.checkinMenuText(date), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.checkinKeyboard(date) },
    });
    return;
  }

  if (data.startsWith('co:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const ladyId = parseInt(data.slice(3), 10);
    const lady = db.findLadyById(ladyId);
    const date = todayDateStringKST();
    if (!lady) {
      await bot.answerCallbackQuery(q.id, { text: '없음', show_alert: true });
      return;
    }
    const r = db.checkOutLady(date, ladyId, new Date().toISOString());
    if (r === 'IN_SESSION') {
      await bot.answerCallbackQuery(q.id, { text: '방에서 먼저 빼주세요', show_alert: true });
      return;
    }
    db.appendAudit('checkout', lady.name, operatorName(from));
    await bot.answerCallbackQuery(q.id, { text: `${lady.name} 퇴근` });
    await bot.editMessageText(flows.checkinMenuText(date), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.checkinKeyboard(date) },
    });
    return;
  }

  if (data.startsWith('rs:rm:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const roomId = parseInt(data.split(':')[2], 10);
    flows.setRoomFlow(from.id, chatId, { roomId, customers: 0, ladies: [] });
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('🤵 손님 몇 명인가요?', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.customerPickKeyboard(roomId) },
    });
    return;
  }

  if (data.startsWith('rs:cu:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , roomId, cust] = data.split(':');
    const rid = parseInt(roomId, 10);
    const customers = parseInt(cust, 10);
    flows.setRoomFlow(from.id, chatId, { roomId: rid, customers, ladies: [] });
    const date = todayDateStringKST();
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(flows.roomStartText(rid, customers, []), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.ladyPickKeyboard(date, rid, customers, []) },
    });
    return;
  }

  if (data.startsWith('rs:ld:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , roomId, cust, ladyId] = data.split(':');
    const rid = parseInt(roomId, 10);
    const customers = parseInt(cust, 10);
    const lid = parseInt(ladyId, 10);
    const flow = flows.getRoomFlow(from.id, chatId) || { roomId: rid, customers, ladies: [] };
    let ladies = [...flow.ladies];
    if (ladies.includes(lid)) ladies = ladies.filter((x) => x !== lid);
    else ladies.push(lid);
    flows.setRoomFlow(from.id, chatId, { roomId: rid, customers, ladies });
    const date = todayDateStringKST();
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(flows.roomStartText(rid, customers, ladies), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.ladyPickKeyboard(date, rid, customers, ladies) },
    });
    return;
  }

  if (data.startsWith('rs:go:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , roomId, cust] = data.split(':');
    const rid = parseInt(roomId, 10);
    const customers = parseInt(cust, 10);
    const flow = flows.getRoomFlow(from.id, chatId);
    if (!flow || flow.ladies.length === 0) {
      await bot.answerCallbackQuery(q.id, { text: '아가씨를 1명 이상 선택', show_alert: true });
      return;
    }
    const date = todayDateStringKST();
    const alertMin = db.getAlertMinutes();
    const startTime = new Date().toISOString();
    const session = db.startRoomSession(date, {
      roomId: rid,
      chatId,
      customerCount: customers,
      ladyIds: flow.ladies,
      startTime,
      alertMinutes: alertMin,
    });
    flows.clearRoomFlow(from.id, chatId);
    if (session === 'ROOM_BUSY') {
      await bot.answerCallbackQuery(q.id, { text: '이미 진행중인 룸', show_alert: true });
      return;
    }
    if (session === 'LADY_BUSY') {
      await bot.answerCallbackQuery(q.id, { text: '다른 방 진행중인 아가씨 있음', show_alert: true });
      return;
    }
    scheduleAlert(session);
    const room = db.findRoomById(rid);
    db.appendAudit('room_start', room?.name || String(rid), operatorName(from));
    await bot.answerCallbackQuery(q.id, { text: '시작!' });
    await bot.editMessageText(
      `✅ ${room?.name || rid} 시작\n${fmt.sessionLine(session)}\n\n${alertMin}분 후 알림`,
      { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: fmt.navKeyboard(true, isOperator(from.id)) } }
    );
    return;
  }

  if (data.startsWith('nav:')) {
    const view = data.slice(4);
    await bot.answerCallbackQuery(q.id);
    await sendBoardWithPerm(chatId, view, from, messageId);
    return;
  }

  if (data.startsWith('alert:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const minutes = parseInt(data.slice(6), 10);
    if (!db.VALID_ALERTS.includes(minutes)) return;
    const prev = db.getAlertMinutes();
    db.setAlertMinutes(minutes, operatorName(from));
    db.appendAudit('alert_change', `${prev}→${minutes}`, operatorName(from));
    await broadcast(
      `📢 [알람설정] ${operatorName(from)}님이 ${minutes}분으로 변경 (시작+${minutes}분 후 알림)`,
      chatId
    );
    await bot.answerCallbackQuery(q.id, { text: `${minutes}분 설정됨` });
    await sendBoardWithPerm(chatId, 'alert', from, messageId);
    return;
  }

  if (data.startsWith('sess:ext:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const sid = parseInt(data.split(':')[2], 10);
    const updated = db.extendSession(sid);
    if (!updated) {
      await bot.answerCallbackQuery(q.id, { text: '세션 없음', show_alert: true });
      return;
    }
    clearTimer(sid);
    scheduleAlert(updated.session);
    await bot.answerCallbackQuery(q.id, { text: '연장됨' });
    bot.sendMessage(chatId, `➕ 연장\n${fmt.sessionLine(updated.session)}`);
    return;
  }

  if (data.startsWith('sess:end:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const sid = parseInt(data.split(':')[2], 10);
    clearTimer(sid);
    const result = db.endSession(sid);
    if (!result) {
      await bot.answerCallbackQuery(q.id, { text: '세션 없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id, { text: '종료됨' });
    bot.sendMessage(chatId, `⏹ 종료\n${fmt.sessionLine(result.session)}`);
    return;
  }

  if (data.startsWith('sess:staff:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const sid = data.split(':')[2];
    await bot.answerCallbackQuery(q.id);
    bot.sendMessage(
      chatId,
      `인원 변경:\n/방추가 룸이름 언니이름\n/방빼 룸이름 언니이름\n\n(중途 제외 시 완료횟수 +0)`
    );
    return;
  }

  if (data.startsWith('sess:time:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const sid = parseInt(data.split(':')[2], 10);
    const found = db.findSessionById(sid);
    if (!found || found.session.status !== 'active') {
      await bot.answerCallbackQuery(q.id, { text: '세션 없음', show_alert: true });
      return;
    }
    const rn = db.findRoomById(found.session.room_id)?.name || found.session.room_id;
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(flows.startTimeMenuText(rn, found.session.start_time), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.startTimeAdjustKeyboard(sid) },
    });
    return;
  }

  if (data.startsWith('sess:back:')) {
    if (!canOperate(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const parts = data.split(':');
    const sid = parseInt(parts[2], 10);
    const minutesAgo = parseInt(parts[3], 10);
    const found = db.findSessionById(sid);
    if (!found || found.session.status !== 'active') {
      await bot.answerCallbackQuery(q.id, { text: '세션 없음', show_alert: true });
      return;
    }
    const newStart = new Date(Date.now() - minutesAgo * 60000).toISOString();
    const updated = db.updateSessionStartTime(sid, newStart);
    if (!updated) {
      await bot.answerCallbackQuery(q.id, { text: '변경 실패', show_alert: true });
      return;
    }
    clearTimer(sid);
    scheduleAlert(updated.session);
    const rn = db.findRoomById(updated.session.room_id)?.name || updated.session.room_id;
    db.appendAudit('room_start_edit', `${rn} -${minutesAgo}분`, operatorName(from));
    await bot.answerCallbackQuery(q.id, { text: `${minutesAgo}분 전으로 변경` });
    await bot.editMessageText(
      `🕐 ${rn} 시작 시각 변경됨\n\n${fmt.sessionLine(updated.session)}\n\n알람: ${formatTimeKST(updated.session.alert_time)}`,
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: flows.activeRoomKeyboard(todayDateStringKST()) },
      }
    );
    return;
  }

  if (data === 'op:renlady') {
    if (!isOperator(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '운영자만', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('✏️ 언니 이름 변경 — 선택', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.ladyRenameKeyboard() },
    });
    return;
  }

  if (data.startsWith('lady:ren:')) {
    if (!isOperator(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '운영자만', show_alert: true });
      return;
    }
    const ladyId = parseInt(data.split(':')[2], 10);
    const lady = db.findLadyById(ladyId);
    if (!lady || !lady.active) {
      await bot.answerCallbackQuery(q.id, { text: '없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    bot.sendMessage(
      chatId,
      `✏️ [🙍${lady.name}] 새 이름 입력:\n/언니이름변경 ${lady.name} 새이름`
    );
    return;
  }

  if (data === 'op:renroom') {
    if (!isOperator(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '운영자만', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('✏️ 룸 이름 변경 — 선택', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.roomRenameKeyboard() },
    });
    return;
  }

  if (data.startsWith('room:ren:')) {
    if (!isOperator(from.id)) {
      await bot.answerCallbackQuery(q.id, { text: '운영자만', show_alert: true });
      return;
    }
    const roomId = parseInt(data.split(':')[2], 10);
    const room = db.findRoomById(roomId);
    if (!room || !room.active) {
      await bot.answerCallbackQuery(q.id, { text: '없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    bot.sendMessage(
      chatId,
      `✏️ [❤️${room.name}] 새 이름 입력:\n/룸이름변경 ${room.name} 새이름`
    );
    return;
  }

  if (data === 'op:addlady') {
    await bot.answerCallbackQuery(q.id);
    bot.sendMessage(chatId, '언니 등록: /언니등록 이름');
    return;
  }

  if (data === 'op:addroom') {
    await bot.answerCallbackQuery(q.id);
    bot.sendMessage(chatId, '룸 등록: /룸등록 1T');
  }
});

tickMaintenance();
setInterval(tickMaintenance, 60000);

console.log(
  `출근부 v2 실행 (DB: ${db.DB_FILE}, 운영자 ${ADMIN_IDS.length}명, 알람 ${db.getAlertMinutes()}분, 자동종료 ${db.AUTO_END_GRACE_MINUTES}분)`
);
