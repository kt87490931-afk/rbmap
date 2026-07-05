require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.production'), override: true });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local'), override: true });
require('dotenv').config({ override: true });

const { loadStoreRuntime, getStoreId } = require('./store-config');
const runtime = loadStoreRuntime();

const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');
const fmt = require('./format');
const flows = require('./flows');
const {
  todayDateStringKST,
  formatTimeKST,
  isValidTimeString,
  parseTimeOnBusinessDate,
} = require('./time-utils');

const TOKEN = runtime.token;
const ADMIN_IDS = runtime.adminIds;
const CHANNEL_ID = runtime.channelId;
const STORE_ID = runtime.storeId;

if (!TOKEN) {
  console.error(`[${STORE_ID}] 봇 토큰 미설정 — ${runtime.store.botTokenEnv} 또는 (ganji) ATTENDANCE_BOT_TOKEN`);
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const scheduledTimers = new Map();

function isSuperAdmin(userId) {
  return ADMIN_IDS.includes(String(userId));
}

function isOperator(userId) {
  return isSuperAdmin(userId) || db.isOperatorUser(userId);
}

function isStaff(userId) {
  return db.isStaffUser(userId) && !isOperator(userId);
}

function canOperate(userId) {
  return isOperator(userId);
}

/** 채널명으로 게시 시 from 없음 → 채널 관리자만 글쓰기 가능하므로 운영 권한 부여 */
function isChannelActor(from) {
  return Boolean(from?._channelPost);
}

function canOperateFrom(from) {
  if (!from) return false;
  if (isChannelActor(from)) return true;
  return canOperate(from.id);
}

function isOperatorFrom(from) {
  if (!from) return false;
  if (isChannelActor(from)) return true;
  return isOperator(from.id);
}

function isSuperAdminFrom(from) {
  if (!from) return false;
  if (isChannelActor(from)) return true;
  return isSuperAdmin(from.id);
}

function operatorName(from) {
  if (!from) return 'unknown';
  if (isChannelActor(from)) return '채널관리자';
  return from.first_name + (from.last_name ? ` ${from.last_name}` : '');
}

function deny(chatId, text = '⛔ 권한이 없습니다.') {
  bot.sendMessage(chatId, text);
}

function denyOperate(chatId) {
  deny(chatId, '⛔ 운영자만 사용할 수 있습니다.');
}

function denySuper(chatId) {
  deny(chatId, '⛔ 슈퍼관리자만 사용할 수 있습니다.');
}

/** 숫자 ID 또는 @username → { id, name } | { error } */
async function resolveUserTarget(raw) {
  const token = String(raw || '').trim();
  if (!token) return { error: 'ID 또는 @username을 입력하세요.' };
  if (/^\d+$/.test(token)) return { id: token, name: null };

  const handle = token.startsWith('@') ? token : `@${token}`;
  const cached = db.findUserByUsername(handle);
  if (cached) return cached;

  try {
    const chat = await bot.getChat(handle);
    if (chat.type !== 'private') {
      return { error: `${handle} — 개인 @username만 등록할 수 있습니다.` };
    }
    const name = [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || handle;
    return { id: String(chat.id), name };
  } catch {
    return {
      error: [
        `${handle} — 봇이 사용자를 찾지 못했습니다.`,
        '',
        '※ 프로필 표시이름(크리스 등) ≠ 사용자명(@Qqaa09091)',
        '  → 설정 → 사용자명 에 보이는 @… 를 써야 합니다.',
        '',
        '✅ 가장 쉬운 방법:',
        '1. 직원에게 @ganji_attendance_bot 에 /내id 보내달라고 하세요',
        '2. 나온 숫자 ID로: /운영자추가 1234567890',
        '',
        '직원이 봇에 /내id를 보낸 뒤 @username 으로 다시 시도할 수도 있습니다.',
      ].join('\n'),
    };
  }
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
  const op = isOperatorFrom(from);
  const co = canOperateFrom(from);
  const sa = isSuperAdminFrom(from);
  const { text } = fmt.buildView(view, date, { canOperate: co, isOperator: op, isSuperAdmin: sa });
  let keyboard = fmt.navKeyboard(co, op);

  if (view === 'act' && co) {
    keyboard = flows.activeRoomListKeyboard(date);
  }
  if (view === 'alert' && co) {
    keyboard = [fmt.alertKeyboard(), ...keyboard];
  }

  const markup = { inline_keyboard: keyboard };

  if (messageId) {
    return bot
      .editMessageText(text, { chat_id: chatId, message_id: messageId, reply_markup: markup })
      .catch((e) => console.error('editMessageText 실패:', e.message));
  }
  return bot
    .sendMessage(chatId, text, { reply_markup: markup })
    .catch((e) => console.error('sendMessage 실패:', e.message));
}

// ---------- /출근부 ----------
bot.onText(/^\/출근부(?:@\w+)?$/, (msg) => {
  sendBoardWithPerm(msg.chat.id, 'all', msg.from);
});

bot.onText(/^\/알림확인(?:@\w+)?$/, (msg) => {
  const m = db.getAlertMinutes();
  bot.sendMessage(
    msg.chat.id,
    `📢 현재 알람: ${m}분전\n각 방 코스 종료 ${m}분 전에 알림이 발송됩니다.`
  );
});

bot.onText(/^\/도움말(?:@\w+)?$/, (msg) => {
  sendBoardWithPerm(msg.chat.id, 'help', msg.from);
});

bot.onText(/^\/내(?:ID|id|아이디)(?:@\w+)?$/, (msg) => {
  db.rememberTelegramUser(msg.from);
  const u = msg.from;
  const un = u.username ? `@${u.username}` : null;
  const lines = [
    '🆔 본인 텔레그램 ID',
    '',
    `숫자 ID: ${u.id}`,
    un ? `사용자명: ${un}` : '사용자명: (미설정)',
    '',
    '※ 표시이름(닉네임)이 아니라 위 「사용자명 @…」 입니다.',
    '  (설정 → 사용자명 에서 확인)',
    '',
    '관리자에게 숫자 ID를 알려주거나,',
    '관리자가 아래 명령으로 등록합니다:',
    `/운영자추가 ${u.id}`,
  ];
  if (un) lines.push(`/운영자추가 ${un}  ← /내id 보낸 뒤에만 가능`);
  bot.sendMessage(msg.chat.id, lines.join('\n'));
});

// ---------- 마스터 등록 (운영자) ----------
function registerLady(msg, name) {
  const id = db.addLady(name);
  if (!id) return bot.sendMessage(msg.chat.id, `이미 등록된 이름입니다: ${name}`);
  db.appendAudit('lady_add', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 언니 등록: ${name}`);
}

bot.onText(/^\/(?:아가씨등록|언니등록)(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  registerLady(msg, m[1].trim());
});

bot.onText(/^\/(?:아가씨해제|언니해제)(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
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
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  renameLadyCmd(msg, m[1].trim(), m[2].trim());
});

bot.onText(/^\/룸등록(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const name = m[1].trim();
  const id = db.addRoom(name);
  if (!id) return bot.sendMessage(msg.chat.id, `이미 등록된 룸: ${name}`);
  db.appendAudit('room_add', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 룸 등록: ❤️${name}`);
});

bot.onText(/^\/룸해제(?:@\w+)?\s+(.+)$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const name = m[1].trim();
  if (!db.deactivateRoom(name)) return bot.sendMessage(msg.chat.id, `없음: ${name}`);
  db.appendAudit('room_remove', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 룸 해제: ${name}`);
});

bot.onText(/^\/룸이름변경(?:@\w+)?\s+(\S+)\s+(\S+)$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
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
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
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
    iso = parseTimeOnBusinessDate(date, m[2]);
  }
  db.checkInLady(date, lady.id, iso);
  db.appendAudit('checkin', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ [🙋${name}] 출근 (${formatTimeKST(iso)})`);
});

bot.onText(/^\/퇴근(?:@\w+)?\s+(\S+)(?:\s+(\d{1,2}:\d{2}))?$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const name = m[1];
  const date = todayDateStringKST();
  const lady = db.findLadyByName(name);
  if (!lady) return bot.sendMessage(msg.chat.id, `등록되지 않은 이름: ${name}`);
  let iso = new Date().toISOString();
  if (m[2]) {
    if (!isValidTimeString(m[2])) return bot.sendMessage(msg.chat.id, 'HH:MM 형식');
    iso = parseTimeOnBusinessDate(date, m[2]);
  }
  const r = db.checkOutLady(date, lady.id, iso);
  if (r === 'IN_SESSION') return bot.sendMessage(msg.chat.id, `${name} — 진행중인 방에서 먼저 빼주세요.`);
  if (r === 'ALREADY') return bot.sendMessage(msg.chat.id, '이미 퇴근 처리됨');
  if (!r) return bot.sendMessage(msg.chat.id, '출근 기록 없음');
  db.appendAudit('checkout', name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `🏁 [🤮${name}] 퇴근 (${formatTimeKST(iso)})`);
});

// ---------- 방 세션 ----------
bot.onText(/^\/방시작(?:@\w+)?\s+(\S+)\s+(\d+)\s+(\S+)(?:\s+(\d{1,2}:\d{2}))?(?:\s+([ABab]))?$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const roomName = m[1];
  const customerCount = parseInt(m[2], 10);
  const ladyStr = m[3];
  const courseKey = m[5] || 'A';
  const courseDef = db.findCourse(courseKey);
  if (!courseDef) return bot.sendMessage(msg.chat.id, `코스 없음: ${courseKey}`);
  const date = todayDateStringKST();
  const room = db.findRoomByName(roomName);
  if (!room) return bot.sendMessage(msg.chat.id, `룸 없음: ${roomName}`);

  let ids = [];
  if (ladyStr !== '-' && ladyStr !== '없음') {
    ids = parseLadyNames(ladyStr);
    if (ids.includes(null)) return bot.sendMessage(msg.chat.id, '아가씨 이름을 확인하세요.');
  }

  let startTime = new Date().toISOString();
  if (m[4]) {
    if (!isValidTimeString(m[4])) return bot.sendMessage(msg.chat.id, 'HH:MM 형식');
    startTime = parseTimeOnBusinessDate(date, m[4]);
  }

  const session = db.startRoomSession(date, {
    roomId: room.id,
    chatId: msg.chat.id,
    customerCount,
    ladyIds: ids,
    startTime,
    course: courseDef.id,
  });

  if (session === 'ROOM_BUSY') return bot.sendMessage(msg.chat.id, `${roomName} — 이미 진행중`);
  if (session === 'LADY_BUSY') return bot.sendMessage(msg.chat.id, '아가씨가 다른 방 진행중');

  scheduleAlert(session);
  const alertMin = db.getAlertMinutes();
  db.appendAudit('room_start', `${roomName} ${courseDef.id}`, operatorName(msg.from));
  bot.sendMessage(
    msg.chat.id,
    `▶️ 방 시작\n${fmt.sessionLine(session)}\n\n종료 ${alertMin}분 전 알림 (${formatTimeKST(session.alert_time)})`
  );
});

bot.onText(/^\/방종료(?:@\w+)?\s+(\S+)$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
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

bot.onText(/^\/방연장(?:@\w+)?\s+(\S+)(?:\s+([ABab]))?$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const date = todayDateStringKST();
  const sess = findActiveSessionByRoomName(date, m[1].trim());
  if (!sess) return bot.sendMessage(msg.chat.id, '진행중인 방 없음');
  const courseDef = m[2] ? db.findCourse(m[2].trim()) : null;
  if (!courseDef) {
    return bot.sendMessage(msg.chat.id, `연장 코스 선택: /방연장 ${m[1]} A  (또는 코스 ID/이름)`);
  }
  const updated = db.extendSession(sess.id, courseDef.id);
  clearTimer(sess.id);
  scheduleAlert(updated.session);
  bot.sendMessage(
    msg.chat.id,
    `➕ ${m[1]} ${courseDef.name} 연장\n${fmt.sessionLine(updated.session)}\n\n알람: ${formatTimeKST(updated.session.alert_time)}`
  );
});

bot.onText(/^\/방시작수정(?:@\w+)?\s+(\S+)\s+(\d{1,2}:\d{2})$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const roomName = m[1].trim();
  const timeStr = m[2].trim();
  if (!isValidTimeString(timeStr)) return bot.sendMessage(msg.chat.id, 'HH:MM 형식 (예: 22:33)');
  const date = todayDateStringKST();
  const sess = findActiveSessionByRoomName(date, roomName);
  if (!sess) return bot.sendMessage(msg.chat.id, `${roomName} — 진행중인 방 없음`);
  const newStart = parseTimeOnBusinessDate(date, timeStr);
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
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
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
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const date = todayDateStringKST();
  const sess = findActiveSessionByRoomName(date, m[1].trim());
  if (!sess) return bot.sendMessage(msg.chat.id, '진행중인 방 없음');
  const lady = db.findLadyByName(m[2].trim());
  if (!lady) return bot.sendMessage(msg.chat.id, '아가씨 없음');
  const r = db.removeLadyFromSession(sess.id, lady.id);
  if (!r) return bot.sendMessage(msg.chat.id, '배정되지 않음');
  bot.sendMessage(msg.chat.id, `👥 ${m[1]} - ${lady.name} (이번 방 완료횟수 제외)\n${fmt.sessionLine(r)}`);
});

bot.onText(/^\/코스목록(?:@\w+)?$/, (msg) => {
  bot.sendMessage(msg.chat.id, `📋 등록 코스\n\n${db.coursesListText()}`);
});

bot.onText(/^\/코스추가(?:@\w+)?\s+(\S+)\s+(\d+)$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const r = db.addCourse(m[1].trim(), m[2]);
  if (r === 'INVALID') return bot.sendMessage(msg.chat.id, '형식: /코스추가 이름 분 (예: /코스추가 VIP 120)');
  if (r === 'DUPLICATE') return bot.sendMessage(msg.chat.id, '이미 같은 이름의 코스가 있습니다.');
  db.appendAudit('course_add', `${r.name} ${r.minutes}분`, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 코스 추가: ${r.name} (${r.minutes}분) [ID: ${r.id}]`);
});

bot.onText(/^\/코스수정(?:@\w+)?\s+(\S+)\s+(\S+)\s+(\d+)$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const r = db.updateCourse(m[1].trim(), m[2].trim(), m[3]);
  if (r === 'NOT_FOUND') return bot.sendMessage(msg.chat.id, `코스 없음: ${m[1]}`);
  if (r === 'DUPLICATE') return bot.sendMessage(msg.chat.id, '이미 사용 중인 코스 이름입니다.');
  if (r === 'INVALID') return bot.sendMessage(msg.chat.id, '형식: /코스수정 ID 이름 분');
  db.appendAudit('course_edit', `${m[1]}→${r.name} ${r.minutes}분`, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 코스 수정: [${r.id}] ${r.name} (${r.minutes}분)`);
});

bot.onText(/^\/코스삭제(?:@\w+)?\s+(\S+)$/, (msg, m) => {
  if (!canOperateFrom(msg.from)) return denyOperate(msg.chat.id);
  const r = db.removeCourse(m[1].trim());
  if (r === 'NOT_FOUND') return bot.sendMessage(msg.chat.id, `코스 없음: ${m[1]}`);
  if (r === 'LAST_ONE') return bot.sendMessage(msg.chat.id, '마지막 코스는 삭제할 수 없습니다.');
  db.appendAudit('course_remove', r.name, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 코스 삭제: ${r.name}`);
});

// ---------- 권한 (슈퍼관리자 전용) ----------
function formatRoleList() {
  const labels = db.getRoleLabels();
  const ops = db.getOperatorIds();
  const staff = db.getStaffIds();
  const lines = ['👑 슈퍼관리자 (서버 설정)', ADMIN_IDS.join(', ') || '(없음)', '', '🔧 운영자'];
  if (ops.length === 0) lines.push('(없음)');
  else ops.forEach((id) => lines.push(`· ${id}${labels[id] ? ` (${labels[id]})` : ''}`));
  lines.push('', '👀 스탭 (보기만)');
  if (staff.length === 0) lines.push('(없음)');
  else staff.forEach((id) => lines.push(`· ${id}${labels[id] ? ` (${labels[id]})` : ''}`));
  return lines.join('\n');
}

bot.onText(/^\/운영자추가(?:@\w+)?\s+(@?\S+)(?:\s+(.+))?$/, async (msg, m) => {
  if (!isSuperAdminFrom(msg.from)) return denySuper(msg.chat.id);
  const resolved = await resolveUserTarget(m[1]);
  if (resolved.error) return bot.sendMessage(msg.chat.id, resolved.error);
  const label = m[2]?.trim() || resolved.name || null;
  db.addOperator(resolved.id, label);
  db.appendAudit('operator_add', resolved.id, operatorName(msg.from));
  bot.sendMessage(
    msg.chat.id,
    `✅ 운영자 등록\n· ID: ${resolved.id}${label ? `\n· 이름: ${label}` : ''}`
  );
});

bot.onText(/^\/운영자제거(?:@\w+)?\s+(@?\S+)$/, async (msg, m) => {
  if (!isSuperAdminFrom(msg.from)) return denySuper(msg.chat.id);
  const resolved = await resolveUserTarget(m[1]);
  if (resolved.error) return bot.sendMessage(msg.chat.id, resolved.error);
  db.removeOperator(resolved.id);
  db.appendAudit('operator_remove', resolved.id, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 운영자 해제: ${resolved.id}`);
});

bot.onText(/^\/스탭추가(?:@\w+)?\s+(@?\S+)(?:\s+(.+))?$/, async (msg, m) => {
  if (!isSuperAdminFrom(msg.from)) return denySuper(msg.chat.id);
  const resolved = await resolveUserTarget(m[1]);
  if (resolved.error) return bot.sendMessage(msg.chat.id, resolved.error);
  const label = m[2]?.trim() || resolved.name || null;
  db.addStaff(resolved.id, label);
  db.appendAudit('staff_add', resolved.id, operatorName(msg.from));
  bot.sendMessage(
    msg.chat.id,
    `✅ 스탭 등록 (조회만)\n· ID: ${resolved.id}${label ? `\n· 이름: ${label}` : ''}`
  );
});

bot.onText(/^\/스탭제거(?:@\w+)?\s+(@?\S+)$/, async (msg, m) => {
  if (!isSuperAdminFrom(msg.from)) return denySuper(msg.chat.id);
  const resolved = await resolveUserTarget(m[1]);
  if (resolved.error) return bot.sendMessage(msg.chat.id, resolved.error);
  db.removeStaff(resolved.id);
  db.appendAudit('staff_remove', resolved.id, operatorName(msg.from));
  bot.sendMessage(msg.chat.id, `✅ 스탭 해제: ${resolved.id}`);
});

bot.onText(/^\/권한목록(?:@\w+)?$/, (msg) => {
  if (!isSuperAdminFrom(msg.from)) return denySuper(msg.chat.id);
  bot.sendMessage(msg.chat.id, formatRoleList());
});

/** 하위 호환 — 운영자로 등록 */
bot.onText(/^\/권한추가(?:@\w+)?\s+(@?\S+)(?:\s+(.+))?$/, async (msg, m) => {
  if (!isSuperAdminFrom(msg.from)) return denySuper(msg.chat.id);
  const resolved = await resolveUserTarget(m[1]);
  if (resolved.error) return bot.sendMessage(msg.chat.id, resolved.error);
  db.addOperator(resolved.id, m[2]?.trim() || resolved.name || null);
  bot.sendMessage(msg.chat.id, `✅ 운영자 등록: ${resolved.id} (/운영자추가 사용 권장)`);
});

bot.onText(/^\/권한제거(?:@\w+)?\s+(@?\S+)$/, async (msg, m) => {
  if (!isSuperAdminFrom(msg.from)) return denySuper(msg.chat.id);
  const resolved = await resolveUserTarget(m[1]);
  if (resolved.error) return bot.sendMessage(msg.chat.id, resolved.error);
  db.removeOperator(resolved.id);
  db.removeStaff(resolved.id);
  bot.sendMessage(msg.chat.id, `✅ 권한 해제: ${resolved.id}`);
});

// ---------- 콜백 ----------
bot.on('callback_query', async (q) => {
  if (q.from) db.rememberTelegramUser(q.from);
  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;
  const data = q.data;
  const from = q.from;

  if (data === 'noop') {
    await bot.answerCallbackQuery(q.id);
    return;
  }

  if (data === 'op:ci_menu') {
    if (!canOperateFrom(from)) {
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
    if (!canOperateFrom(from)) {
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
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const date = todayDateStringKST();
    await bot.answerCallbackQuery(q.id);
    await sendBoardWithPerm(chatId, 'act', from, messageId);
    return;
  }

  if (data.startsWith('sess:mgmt:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const sid = parseInt(data.split(':')[2], 10);
    const found = db.findSessionById(sid);
    if (!found || found.session.status !== 'active') {
      await bot.answerCallbackQuery(q.id, { text: '세션 없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(flows.sessionManageText(found.session), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.sessionManageKeyboard(sid) },
    });
    return;
  }

  if (data.startsWith('ci:')) {
    if (!canOperateFrom(from)) {
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
    if (!canOperateFrom(from)) {
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
    if (r === 'NOT_CHECKED_IN') {
      await bot.answerCallbackQuery(q.id, { text: '출근 기록 없음', show_alert: true });
      return;
    }
    if (r === 'ALREADY') {
      await bot.answerCallbackQuery(q.id, { text: '이미 퇴근 상태', show_alert: true });
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
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const roomId = parseInt(data.split(':')[2], 10);
    flows.setRoomFlow(from.id, chatId, { roomId, course: 'A', customers: 0, ladies: [] });
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('코스를 선택하세요.', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.coursePickKeyboard(roomId) },
    });
    return;
  }

  if (data.startsWith('rs:cr:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , roomId, course] = data.split(':');
    const rid = parseInt(roomId, 10);
    const c = course;
    flows.setRoomFlow(from.id, chatId, { roomId: rid, course: c, customers: 0, ladies: [] });
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('🤵 손님 몇 명인가요?', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.customerPickKeyboard(rid, c) },
    });
    return;
  }

  if (data.startsWith('rs:cu:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , roomId, course, cust] = data.split(':');
    const rid = parseInt(roomId, 10);
    const c = course;
    const customers = parseInt(cust, 10);
    flows.setRoomFlow(from.id, chatId, { roomId: rid, course: c, customers, ladies: [] });
    const date = todayDateStringKST();
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(flows.roomStartText(rid, c, customers, []), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.ladyPickKeyboard(date, rid, c, customers, []) },
    });
    return;
  }

  if (data.startsWith('rs:ld:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , roomId, course, cust, ladyId] = data.split(':');
    const rid = parseInt(roomId, 10);
    const c = course;
    const customers = parseInt(cust, 10);
    const lid = parseInt(ladyId, 10);
    const flow = flows.getRoomFlow(from.id, chatId) || { roomId: rid, course: c, customers, ladies: [] };
    let ladies = [...flow.ladies];
    if (ladies.includes(lid)) ladies = ladies.filter((x) => x !== lid);
    else ladies.push(lid);
    flows.setRoomFlow(from.id, chatId, { roomId: rid, course: c, customers, ladies });
    const date = todayDateStringKST();
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(flows.roomStartText(rid, c, customers, ladies), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.ladyPickKeyboard(date, rid, c, customers, ladies) },
    });
    return;
  }

  if (data.startsWith('rs:go:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , roomId, course, cust] = data.split(':');
    const rid = parseInt(roomId, 10);
    const c = course;
    const customers = parseInt(cust, 10);
    const flow = flows.getRoomFlow(from.id, chatId);
    const ladies = flow ? flow.ladies : [];
    const date = todayDateStringKST();
    const alertMin = db.getAlertMinutes();
    const startTime = new Date().toISOString();
    const session = db.startRoomSession(date, {
      roomId: rid,
      chatId,
      customerCount: customers,
      ladyIds: ladies,
      startTime,
      course: c,
    });
    flows.clearRoomFlow(from.id, chatId);
    if (session === 'INVALID_COURSE') {
      await bot.answerCallbackQuery(q.id, { text: '코스 없음', show_alert: true });
      return;
    }
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
    db.appendAudit('room_start', `${room?.name || rid} ${c}`, operatorName(from));
    await bot.answerCallbackQuery(q.id, { text: '시작!' });
    await bot.editMessageText(
      `✅ ${room?.name || rid} ${c}코스 시작\n${fmt.sessionLine(session)}\n\n종료 ${alertMin}분 전 알림 (${formatTimeKST(session.alert_time)})`,
      { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: fmt.navKeyboard(true, isOperatorFrom(from)) } }
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
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const minutes = parseInt(data.slice(6), 10);
    if (!db.VALID_ALERTS.includes(minutes)) return;
    const prev = db.getAlertMinutes();
    db.setAlertMinutes(minutes, operatorName(from));
    db.appendAudit('alert_change', `${prev}→${minutes}`, operatorName(from));
    await broadcast(
      `📢 [알람설정] ${operatorName(from)}님이 종료 ${minutes}분전으로 변경`,
      chatId
    );
    await bot.answerCallbackQuery(q.id, { text: `${minutes}분전 설정됨` });
    await sendBoardWithPerm(chatId, 'alert', from, messageId);
    return;
  }

  if (data.startsWith('sess:ext:') && !data.startsWith('sess:extc:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const sid = parseInt(data.split(':')[2], 10);
    const found = db.findSessionById(sid);
    if (!found || found.session.status !== 'active') {
      await bot.answerCallbackQuery(q.id, { text: '세션 없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('➕ 연장 — 코스를 선택하세요.', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.extendCourseKeyboard(sid) },
    });
    return;
  }

  if (data.startsWith('sess:extc:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , sidStr, course] = data.split(':');
    const sid = parseInt(sidStr, 10);
    const c = course;
    const updated = db.extendSession(sid, c);
    if (!updated) {
      await bot.answerCallbackQuery(q.id, { text: '세션 없음', show_alert: true });
      return;
    }
    clearTimer(sid);
    scheduleAlert(updated.session);
    await bot.answerCallbackQuery(q.id, { text: `${c}코스 연장됨` });
    await bot.editMessageText(
      `➕ ${db.courseLabel(c)} 연장\n${fmt.sessionLine(updated.session)}\n\n알람: ${formatTimeKST(updated.session.alert_time)}`,
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: flows.sessionManageKeyboard(sid) },
      }
    );
    return;
  }

  if (data.startsWith('sess:end:')) {
    if (!canOperateFrom(from)) {
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

  if (data.startsWith('sess:add:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const sid = parseInt(data.split(':')[2], 10);
    const date = todayDateStringKST();
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('👥 추가할 언니를 선택하세요.', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.sessionLadyAddKeyboard(date, sid) },
    });
    return;
  }

  if (data.startsWith('sess:sub:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const sid = parseInt(data.split(':')[2], 10);
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('👥 빼낼 언니를 선택하세요.', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.sessionLadySubKeyboard(sid) },
    });
    return;
  }

  if (data.startsWith('sess:pickadd:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , sidStr, ladyIdStr] = data.split(':');
    const sid = parseInt(sidStr, 10);
    const ladyId = parseInt(ladyIdStr, 10);
    const r = db.addLadyToSession(sid, ladyId);
    if (r === 'LADY_BUSY') {
      await bot.answerCallbackQuery(q.id, { text: '다른 방 진행중', show_alert: true });
      return;
    }
    if (r === 'ALREADY') {
      await bot.answerCallbackQuery(q.id, { text: '이미 배정됨', show_alert: true });
      return;
    }
    if (!r) {
      await bot.answerCallbackQuery(q.id, { text: '실패', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id, { text: '추가됨' });
    await bot.editMessageText(flows.sessionManageText(r), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.sessionManageKeyboard(sid) },
    });
    return;
  }

  if (data.startsWith('sess:picksub:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , sidStr, ladyIdStr] = data.split(':');
    const sid = parseInt(sidStr, 10);
    const ladyId = parseInt(ladyIdStr, 10);
    const r = db.removeLadyFromSession(sid, ladyId);
    if (!r) {
      await bot.answerCallbackQuery(q.id, { text: '배정 없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id, { text: '제외됨' });
    await bot.editMessageText(flows.sessionManageText(r), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.sessionManageKeyboard(sid) },
    });
    return;
  }

  if (data.startsWith('sess:cust:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const sid = parseInt(data.split(':')[2], 10);
    const found = db.findSessionById(sid);
    if (!found) {
      await bot.answerCallbackQuery(q.id, { text: '세션 없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(
      `🤵 손님 수 변경 (현재 ${found.session.customer_count}명)`,
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: flows.customerAdjustKeyboard(sid, found.session.customer_count) },
      }
    );
    return;
  }

  if (data.startsWith('sess:setcust:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const [, , sidStr, countStr] = data.split(':');
    const sid = parseInt(sidStr, 10);
    const count = parseInt(countStr, 10);
    const r = db.updateSessionCustomerCount(sid, count);
    if (r === 'INVALID' || !r) {
      await bot.answerCallbackQuery(q.id, { text: '변경 실패', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id, { text: `손님 ${count}명` });
    await bot.editMessageText(flows.sessionManageText(r), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.sessionManageKeyboard(sid) },
    });
    return;
  }

  if (data.startsWith('sess:staff:')) {
    if (!canOperateFrom(from)) {
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
    if (!canOperateFrom(from)) {
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
    await bot.editMessageText(flows.startTimeMenuText(rn, found.session.start_time, found.session.course), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.startTimeAdjustKeyboard(sid) },
    });
    return;
  }

  if (data.startsWith('sess:back:')) {
    if (!canOperateFrom(from)) {
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
        reply_markup: { inline_keyboard: flows.sessionManageKeyboard(sid) },
      }
    );
    return;
  }

  if (data === 'op:course_menu') {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText(flows.courseMenuText(), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.courseMenuKeyboard() },
    });
    return;
  }

  if (data === 'op:course_add') {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    bot.sendMessage(
      chatId,
      '📝 코스 추가\n\n/코스추가 이름 분\n예: /코스추가 VIP코스 120\n예: /코스추가 C코스 45'
    );
    return;
  }

  if (data === 'op:course_edit') {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('✏️ 수정할 코스를 선택하세요.', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.coursePickForEditKeyboard('edit') },
    });
    return;
  }

  if (data === 'op:course_del') {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(q.id);
    await bot.editMessageText('🗑 삭제할 코스를 선택하세요.', {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.coursePickForEditKeyboard('del') },
    });
    return;
  }

  if (data.startsWith('course:edit:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const id = data.split(':')[2];
    const c = db.findCourse(id);
    await bot.answerCallbackQuery(q.id);
    bot.sendMessage(
      chatId,
      `✏️ [${c?.name || id}] 수정\n\n/코스수정 ID 이름 분\n예: /코스수정 ${id} ${c?.name || 'A코스'} 60`
    );
    return;
  }

  if (data.startsWith('course:del:')) {
    if (!canOperateFrom(from)) {
      await bot.answerCallbackQuery(q.id, { text: '권한 없음', show_alert: true });
      return;
    }
    const id = data.split(':')[2];
    const c = db.findCourse(id);
    const r = db.removeCourse(id);
    if (r === 'LAST_ONE') {
      await bot.answerCallbackQuery(q.id, { text: '마지막 코스는 삭제 불가', show_alert: true });
      return;
    }
    if (r === 'NOT_FOUND') {
      await bot.answerCallbackQuery(q.id, { text: '없음', show_alert: true });
      return;
    }
    db.appendAudit('course_remove', c?.name || id, operatorName(from));
    await bot.answerCallbackQuery(q.id, { text: '삭제됨' });
    await bot.editMessageText(flows.courseMenuText(), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: flows.courseMenuKeyboard() },
    });
    return;
  }

  if (data === 'op:renlady') {
    if (!canOperateFrom(from)) {
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
    if (!canOperateFrom(from)) {
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
    if (!canOperateFrom(from)) {
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
    if (!canOperateFrom(from)) {
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

/** 초대·입장 시 기본 스탭 등록 */
function autoRegisterStaff(member) {
  const uid = String(member.id);
  if (member.is_bot || isSuperAdmin(uid) || db.isOperatorUser(uid)) return;
  if (db.isStaffUser(uid)) return;
  const name = member.first_name + (member.last_name ? ` ${member.last_name}` : '');
  db.addStaff(uid, name);
  db.appendAudit('staff_auto_join', uid, 'system');
}

bot.on('message', (msg) => {
  if (msg.from) db.rememberTelegramUser(msg.from);
  if (!msg.new_chat_members?.length) return;
  for (const member of msg.new_chat_members) {
    autoRegisterStaff(member);
  }
});

/** 채널은 channel_post로만 전달됨 — onText는 processUpdate(message)에서만 실행됨 */
let channelUpdateSeq = 0;

function normalizeChannelPost(msg) {
  const from = msg.from || {
    id: 0,
    first_name: 'Channel',
    is_bot: false,
    _channelPost: true,
  };
  return { ...msg, from };
}

function routeChannelPostToCommands(msg) {
  if (!msg?.text) return;
  const normalized = normalizeChannelPost(msg);
  console.log(`[channel_post] ${normalized.chat?.id} ${normalized.text}`);
  bot.processUpdate({
    update_id: 9_000_000_000 + ++channelUpdateSeq,
    message: normalized,
  });
}

bot.on('channel_post', routeChannelPostToCommands);
bot.on('edited_channel_post', routeChannelPostToCommands);

console.log(
  `출근부 v2 [${STORE_ID}] 실행 (DB: ${db.DB_FILE}, 운영자 ${ADMIN_IDS.length}명, 알람 ${db.getAlertMinutes()}분전, 자동종료 ${db.AUTO_END_GRACE_MINUTES}분)`
);
