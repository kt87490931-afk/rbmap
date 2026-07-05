const db = require('./db');
const { formatDateHeader, formatTimeKST } = require('./time-utils');

function ladyName(id) {
  const l = db.findLadyById(id);
  return l ? l.name : `#${id}`;
}

function roomName(id) {
  const r = db.findRoomById(id);
  return r ? r.name : `#${id}`;
}

function activeAssignments(session) {
  return session.assignments.filter((a) => !a.removed_at);
}

function sessionLine(session) {
  const rn = roomName(session.room_id);
  const start = formatTimeKST(session.start_time);
  const end = formatTimeKST(session.end_scheduled);
  const status =
    session.status === 'active' ? `${session.hour_count}시간 진행중` : '종료';
  const ladies = activeAssignments(session)
    .map((a) => {
      const emoji = a.from_start ? '🙆' : '🙅';
      return `[${emoji}${ladyName(a.lady_id)}]`;
    })
    .join(' ');
  return `[❤️${rn}][🤵손님 ${session.customer_count}명][💘시작 ${start}][💔종료 ${end}][${status}]\n${ladies}`;
}

function registeredBlock(date) {
  const ladies = db.getActiveLadies();
  const rooms = db.getActiveRooms();
  const names = ladies.map((l) => `[🙍${l.name}]`).join('');
  const roomTags = rooms.map((r) => `[❤️${r.name}]`).join(' ');
  return (
    `*언니 등록인원 : ${ladies.length}명\n${names || '(없음)'}\n\n` +
    `*룸이름\n${roomTags || '(없음)'}`
  );
}

function classifyLadies(date) {
  const registered = db.getActiveLadies();
  const day = db.getDay(date);
  const checkedIn = [];
  const absent = [];
  const waiting = [];
  const checkedOut = [];

  for (const lady of registered) {
    const st = day.ladies[String(lady.id)];
    if (!st || !st.checked_in) {
      absent.push(lady);
      continue;
    }
    if (st.checked_out) {
      checkedOut.push(lady);
      continue;
    }
    if (db.isLadyInActiveSession(date, lady.id)) {
      checkedIn.push(lady);
    } else {
      waiting.push(lady);
    }
  }
  return { registered, checkedIn, absent, waiting, checkedOut, day };
}

function checkinBlock(date) {
  const { registered, absent, waiting } = classifyLadies(date);
  const day = db.getDay(date);
  let checkedInToday = 0;
  const inTags = [];

  for (const lady of registered) {
    const st = day.ladies[String(lady.id)];
    if (!st || !st.checked_in) continue;
    checkedInToday += 1;
    if (st.checked_out) continue;
    if (db.isLadyInActiveSession(date, lady.id)) {
      inTags.push(`[🙆${lady.name}]`);
    } else {
      inTags.push(`[🙋${lady.name}]`);
    }
  }

  const absentTags = absent.map((l) => `[☠️${l.name}]`).join(' ');
  const waitTags = waiting.map((l) => `[🙋${l.name}]`).join(' ');

  return (
    `*출근인원 : ${checkedInToday}명\n${inTags.join(' ') || '(없음)'}\n\n` +
    `*미출근인원 : ${absent.length}명\n${absentTags || '(없음)'}\n\n` +
    `대기인원 : ${waiting.length}명\n${waitTags || '(없음)'}`
  );
}

function checkoutBlock(date) {
  const { checkedOut } = classifyLadies(date);
  const tags = checkedOut.map((l) => `[🤮${l.name}]`).join(' ');
  return `퇴근인원 : ${checkedOut.length}명\n${tags || '(없음)'}`;
}

function activeRoomsBlock(date) {
  const day = db.getDay(date);
  const active = day.sessions.filter((s) => s.status === 'active');
  if (active.length === 0) return '💋진행중\n(없음)';
  return `💋진행중\n\n${active.map(sessionLine).join('\n\n')}`;
}

function endedRoomsBlock(date) {
  const day = db.getDay(date);
  const ended = day.sessions.filter((s) => s.status === 'ended');
  if (ended.length === 0) return '🏁종료된 방\n(없음)';
  return `🏁종료된 방\n\n${ended.map(sessionLine).join('\n\n')}`;
}

function ladyStatsBlock(date) {
  const { registered, day } = classifyLadies(date);
  const inSessionIds = new Set();
  for (const s of day.sessions.filter((x) => x.status === 'active')) {
    for (const a of activeAssignments(s)) {
      inSessionIds.add(a.lady_id);
    }
  }
  const tags = registered
    .map((l) => {
      const cnt = db.getCompletedCount(date, l.id);
      const emoji = inSessionIds.has(l.id) ? '🙆' : '🙅';
      return `[${emoji}${l.name} ${cnt}]`;
    })
    .join(' ');
  return `[금일언니진행현황]\n${tags || '(등록 없음)'}`;
}

function ladyStatusBlock(date) {
  const { checkedIn, waiting } = classifyLadies(date);
  const inTags = checkedIn.map((l) => `[🙆${l.name}]`).join(' ');
  const waitTags = waiting.map((l) => `[🙋${l.name}]`).join(' ');
  return (
    `🙆 진행중 ${checkedIn.length}명\n${inTags || '(없음)'}\n\n` +
    `🙋 대기중 ${waiting.length}명\n${waitTags || '(없음)'}`
  );
}

function alertInfoBlock() {
  const m = db.getAlertMinutes();
  return `⏰ 현재 알람설정: ${m}분\n(시작 시각 + ${m}분 후 텔레그램 알림)`;
}

function buildView(view, date) {
  const store = db.getSettings().store_name || '간지';
  const header = formatDateHeader(date, store);

  switch (view) {
    case 'all':
      return {
        text: [
          `${header} 출근부\n`,
          registeredBlock(date),
          `\n\n${formatDateHeader(date, store)} 출근 인원`,
          checkinBlock(date),
          `\n\n${formatDateHeader(date, store)} 퇴근 인원`,
          checkoutBlock(date),
          `\n\n${activeRoomsBlock(date)}`,
          `\n\n${alertInfoBlock()}`,
        ].join('\n'),
      };
    case 'in':
      return {
        text: `${header} 출근 인원\n\n${checkinBlock(date)}\n\n${alertInfoBlock()}`,
      };
    case 'abs':
      return {
        text: `${header} 미출근\n\n${classifyLadies(date).absent.map((l) => `[☠️${l.name}]`).join(' ') || '(없음)'}\n\n${alertInfoBlock()}`,
      };
    case 'act':
      return { text: `${header}\n\n${activeRoomsBlock(date)}\n\n${alertInfoBlock()}` };
    case 'end':
      return { text: `${header}\n\n${endedRoomsBlock(date)}\n\n${alertInfoBlock()}` };
    case 'stats':
      return { text: `${header}\n\n${ladyStatsBlock(date)}\n\n${alertInfoBlock()}` };
    case 'status':
      return { text: `${header}\n\n👀언니상태\n\n${ladyStatusBlock(date)}\n\n${alertInfoBlock()}` };
    case 'alert':
      return { text: `${header}\n\n${alertInfoBlock()}\n\n변경할 알람 시간을 선택하세요.` };
    default:
      return buildView('all', date);
  }
}

function keyboardSpacer() {
  return [{ text: '────────', callback_data: 'noop' }];
}

function navKeyboard(canOperate, isOperator) {
  const rows = [];

  if (canOperate) {
    rows.push([{ text: '▶️방시작', callback_data: 'op:rs_menu' }]);
    rows.push(keyboardSpacer());
  }

  rows.push(
    [
      { text: '🚀진행중인방', callback_data: 'nav:act' },
      { text: '👀언니상태', callback_data: 'nav:status' },
    ],
    [
      { text: '🏃‍♀️금일진행현황', callback_data: 'nav:stats' },
      { text: '🛑종료된방', callback_data: 'nav:end' },
    ]
  );

  if (canOperate) {
    rows.push(keyboardSpacer());
    rows.push([{ text: '💡방관리(연장)', callback_data: 'op:rm_menu' }]);
    rows.push(keyboardSpacer());
    rows.push([{ text: '📝출근처리', callback_data: 'op:ci_menu' }]);
  }

  rows.push([
    { text: '✔️출근인원', callback_data: 'nav:in' },
    { text: '❌미출근인원', callback_data: 'nav:abs' },
    { text: '👪전체인원', callback_data: 'nav:all' },
  ]);

  if (canOperate) {
    rows.push(keyboardSpacer());
    rows.push([{ text: '⏰알람설정', callback_data: 'nav:alert' }]);
  }

  if (isOperator) {
    rows.push(keyboardSpacer());
    rows.push([
      { text: '+언니', callback_data: 'op:addlady' },
      { text: '✏️언니이름변경', callback_data: 'op:renlady' },
    ]);
    rows.push([
      { text: '+룸', callback_data: 'op:addroom' },
      { text: '✏️룸이름변경', callback_data: 'op:renroom' },
    ]);
  }

  return rows;
}

function alertKeyboard() {
  return db.VALID_ALERTS.map((m) => ({
    text: `${m}분`,
    callback_data: `alert:${m}`,
  }));
}

function formatAlertMessage(session) {
  return `⏰ ${session.hour_count}시간째 — 곧 종료 예정\n\n${sessionLine(session)}`;
}

module.exports = {
  buildView,
  navKeyboard,
  alertKeyboard,
  formatAlertMessage,
  sessionLine,
  ladyName,
  roomName,
  activeAssignments,
};
