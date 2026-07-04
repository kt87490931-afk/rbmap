require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.production') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');
const fmt = require('./format');
const {
  todayDateStringKST,
  formatTimeKST,
  isValidTimeString,
  parseTimeOnDateKST,
} = require('./time-utils');

const TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
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
  const { text } = fmt.buildView(view, date);
  const op = isOperator(from.id);
  const co = canOperate(from.id);
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
  const co = canOperate(msg.from.id);
  const lines = [
    '📌 출근부 봇',
    '/출근부 — 출근부 보드 + 버튼',
    '/알림확인 — 알람 45/50/55분 조회',
  ];
  if (co) {
    lines.push(
      '',
      '【운영】',
      '/아가씨등록 이름 · /아가씨해제 이름',
      '/룸등록 1T · /룸해제 1T',
      '/출근 하나 [HH:MM] · /퇴근 하나 [HH:MM]',
      '/방시작 1T 3 하나,사랑,이슬 [HH:MM]',
      '/방종료 1T · /방연장 1T',
      '/방추가 1T 사월 · /방빼 1T 이슬',
      '/권한추가 ID [별칭] · /권한제거 ID · /권한목록'
    );
  }
  bot.sendMessage(msg.chat.id, lines.join('\n'));
});

// ---------- 마스터 등록 ----------
bot.onText(/^\/아가씨등록(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const name = m[1].trim();
  const id = db.addLady(name);
  if (!id) return bot.sendMessage(msg.chat.id, `이미 등록된 이름입니다: ${name}`);
  db.appendAudit('lady_add', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 아가씨 등록: ${name}`);
});

bot.onText(/^\/아가씨해제(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const name = m[1].trim();
  if (!db.deactivateLady(name)) return bot.sendMessage(msg.chat.id, `없음: ${name}`);
  db.appendAudit('lady_remove', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 아가씨 해제: ${name}`);
});

bot.onText(/^\/룸등록(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const name = m[1].trim();
  const id = db.addRoom(name);
  if (!id) return bot.sendMessage(msg.chat.id, `이미 등록된 룸: ${name}`);
  db.appendAudit('room_add', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 룸 등록: ❤️${name}`);
});

bot.onText(/^\/룸해제(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!canOperate(msg.from.id)) return deny(msg.chat.id);
  const name = m[1].trim();
  if (!db.deactivateRoom(name)) return bot.sendMessage(msg.chat.id, `없음: ${name}`);
  db.appendAudit('room_remove', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 룸 해제: ${name}`);
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
      `인원 변경:\n/방추가 룸이름 아가씨\n/방빼 룸이름 아가씨\n\n(중途 제외 시 완료횟수 +0)`
    );
    return;
  }

  if (data === 'op:addlady') {
    await bot.answerCallbackQuery(q.id);
    bot.sendMessage(chatId, '아가씨 등록: /아가씨등록 이름');
    return;
  }

  if (data === 'op:addroom') {
    await bot.answerCallbackQuery(q.id);
    bot.sendMessage(chatId, '룸 등록: /룸등록 1T');
  }
});

resyncTimers();
setInterval(resyncTimers, 60000);

console.log(`출근부 v2 실행 (DB: ${db.DB_FILE}, 운영자 ${ADMIN_IDS.length}명, 알람 ${db.getAlertMinutes()}분)`);
