const db = require('./db');
const { bold: b, escapeHtml: e } = require('./text-html');

/** @type {Map<string, { roomId: number, course: string, customers: number, ladies: number[], chatId: number }>} */
const roomFlows = new Map();

function flowKey(userId, chatId) {
  return `${chatId}:${userId}`;
}

function getRoomFlow(userId, chatId) {
  return roomFlows.get(flowKey(userId, chatId)) || null;
}

function setRoomFlow(userId, chatId, data) {
  roomFlows.set(flowKey(userId, chatId), { ...data, chatId });
}

function clearRoomFlow(userId, chatId) {
  roomFlows.delete(flowKey(userId, chatId));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** 출근/퇴근 — 전체 인원, 출근·퇴근 2버튼 */
function checkinKeyboard(date) {
  const ladies = db.getActiveLadies();
  if (ladies.length === 0) {
    return [[{ text: '← 출근부', callback_data: 'nav:all' }]];
  }
  const rows = ladies.map((lady) => [
    { text: `${lady.name} (출근)`, callback_data: `ci:${lady.id}` },
    { text: `${lady.name} (퇴근)`, callback_data: `co:${lady.id}` },
  ]);
  rows.push([{ text: '← 출근부', callback_data: 'nav:all' }]);
  return rows;
}

function checkinMenuText(date) {
  const ladies = db.getActiveLadies();
  const checkedInList = [];
  const checkedOutList = [];

  for (const lady of ladies) {
    const st = db.getLadyDayState(date, lady.id);
    if (st && st.checked_in && !st.checked_out) checkedInList.push(lady.name);
    else if (st && st.checked_out) checkedOutList.push(lady.name);
  }

  return (
    `${b('📝 출근 / 퇴근 처리')}\n\n` +
    `출근 ${checkedInList.length}명 · 퇴근 ${checkedOutList.length}명\n\n` +
    `${b('출근')}\n${checkedInList.map((n) => `[💋${e(n)}]`).join(' ') || '(없음)'}\n\n` +
    `${b('퇴근')}\n${checkedOutList.map((n) => `[💋${e(n)}]`).join(' ') || '(없음)'}\n\n` +
    '아래 버튼을 눌러주세요.'
  );
}

function roomPickKeyboard() {
  const rooms = db.getActiveRooms();
  if (rooms.length === 0) {
    return [
      [{ text: '등록된 룸 없음 (/룸등록 1T)', callback_data: 'noop' }],
      [{ text: '← 출근부', callback_data: 'nav:all' }],
    ];
  }
  const btns = rooms.map((r) => ({
    text: `❤️ ${r.name}`,
    callback_data: `rs:rm:${r.id}`,
  }));
  return [...chunk(btns, 3), [{ text: '← 취소', callback_data: 'nav:all' }]];
}

function coursePickKeyboard(roomId) {
  const courses = db.getCourses();
  const btns = courses.map((c) => ({
    text: `${c.name}(${c.minutes}분)`,
    callback_data: `rs:cr:${roomId}:${c.id}`,
  }));
  return [
    ...chunk(btns, 2),
    [{ text: '← 룸 다시', callback_data: 'op:rs_menu' }],
  ];
}

function extendCourseKeyboard(sessionId) {
  const courses = db.getCourses();
  const btns = courses.map((c) => ({
    text: `${c.name}(${c.minutes}분)`,
    callback_data: `sess:extc:${sessionId}:${c.id}`,
  }));
  return [
    ...chunk(btns, 2),
    [{ text: '← 취소', callback_data: `sess:mgmt:${sessionId}` }],
  ];
}

function courseMenuText() {
  return (
    `${b('📋 코스 관리')}\n\n` +
    `${db.coursesListText()}\n\n` +
    '아래에서 선택하거나 명령어로 입력하세요.\n' +
    '· /코스추가 이름 분\n' +
    '· /코스수정 ID 이름 분\n' +
    '· /코스삭제 ID'
  );
}

function courseMenuKeyboard() {
  return [
    [
      { text: '코스추가', callback_data: 'op:course_add' },
      { text: '코스수정', callback_data: 'op:course_edit' },
    ],
    [
      { text: '코스삭제', callback_data: 'op:course_del' },
    ],
    [{ text: '← 출근부', callback_data: 'nav:all' }],
  ];
}

function coursePickForEditKeyboard(mode) {
  const courses = db.getCourses();
  const prefix = mode === 'del' ? 'course:del' : 'course:edit';
  const btns = courses.map((c) => ({
    text: `${c.name}(${c.minutes}분)`,
    callback_data: `${prefix}:${c.id}`,
  }));
  return [...chunk(btns, 2), [{ text: '← 코스', callback_data: 'op:course_menu' }]];
}

function customerPickKeyboard(roomId, course) {
  const btns = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    text: `🤵 ${n}명`,
    callback_data: `rs:cu:${roomId}:${course}:${n}`,
  }));
  return [
    ...chunk(btns, 3),
    [{ text: '← 코스', callback_data: `rs:rm:${roomId}` }],
  ];
}

function ladyPickKeyboard(date, roomId, course, customers, selectedIds) {
  const ladies = db.getActiveLadies();
  const selected = new Set(selectedIds);
  const btns = [];

  for (const lady of ladies) {
    const st = db.getLadyDayState(date, lady.id);
    const checkedIn = st && st.checked_in && !st.checked_out;
    const busy = db.isLadyInActiveSession(date, lady.id);
    if (!checkedIn || busy) continue;

    const on = selected.has(lady.id);
    btns.push({
      text: `${on ? '☑' : '☐'} ${lady.name}`,
      callback_data: `rs:ld:${roomId}:${course}:${customers}:${lady.id}`,
    });
  }

  const startLabel = selected.size > 0 ? `▶️ 시작 (${selected.size}명)` : '▶️ 시작 (0명)';
  const startRow = [{ text: startLabel, callback_data: `rs:go:${roomId}:${course}:${customers}` }];

  if (btns.length === 0) {
    return [startRow, [{ text: '← 손님 수', callback_data: `rs:cr:${roomId}:${course}` }]];
  }

  return [...chunk(btns, 2), startRow, [{ text: '← 취소', callback_data: 'nav:all' }]];
}

function activeRoomListKeyboard(date) {
  const day = db.getDay(date);
  const active = day.sessions.filter((s) => db.isSessionInProgress(s));
  if (active.length === 0) {
    return [[{ text: '← 출근부', callback_data: 'nav:all' }]];
  }
  const rows = active.map((s) => {
    const rn = db.findRoomById(s.room_id)?.name || s.room_id;
    const c = s.course || 'A';
    return [{ text: `🎛 ${rn} · ${c}코스`, callback_data: `sess:mgmt:${s.id}` }];
  });
  rows.push([{ text: '← 출근부', callback_data: 'nav:all' }]);
  return rows;
}

function sessionManageKeyboard(sessionId) {
  return [
    [
      { text: '⏳ 시작시간', callback_data: `sess:time:${sessionId}` },
      { text: '➕ 연장', callback_data: `sess:ext:${sessionId}` },
    ],
    [
      { text: '👥 언니추가', callback_data: `sess:add:${sessionId}` },
      { text: '👥 언니빼기', callback_data: `sess:sub:${sessionId}` },
    ],
    [
      { text: '🤵 손님수', callback_data: `sess:cust:${sessionId}` },
      { text: '⏹ 종료', callback_data: `sess:end:${sessionId}` },
    ],
    [{ text: '← 목록', callback_data: 'nav:act' }],
  ];
}

function sessionLadyAddKeyboard(date, sessionId) {
  const ladies = db.getActiveLadies();
  const found = db.findSessionById(sessionId);
  if (!found) return [[{ text: '← 돌아가기', callback_data: `sess:mgmt:${sessionId}` }]];
  const inSession = new Set(
    found.session.assignments.filter((a) => !a.removed_at).map((a) => a.lady_id)
  );
  const btns = [];
  for (const lady of ladies) {
    const st = db.getLadyDayState(date, lady.id);
    const checkedIn = st && st.checked_in && !st.checked_out;
    const busy = db.isLadyInActiveSession(date, lady.id);
    if (!checkedIn || busy || inSession.has(lady.id)) continue;
    btns.push({
      text: `+ ${lady.name}`,
      callback_data: `sess:pickadd:${sessionId}:${lady.id}`,
    });
  }
  if (btns.length === 0) {
    return [
      [{ text: '추가 가능한 언니 없음', callback_data: 'noop' }],
      [{ text: '← 돌아가기', callback_data: `sess:mgmt:${sessionId}` }],
    ];
  }
  return [...chunk(btns, 2), [{ text: '← 돌아가기', callback_data: `sess:mgmt:${sessionId}` }]];
}

function sessionLadySubKeyboard(sessionId) {
  const found = db.findSessionById(sessionId);
  if (!found) return [[{ text: '← 돌아가기', callback_data: `sess:mgmt:${sessionId}` }]];
  const active = found.session.assignments.filter((a) => !a.removed_at);
  if (active.length === 0) {
    return [
      [{ text: '배정된 언니 없음', callback_data: 'noop' }],
      [{ text: '← 돌아가기', callback_data: `sess:mgmt:${sessionId}` }],
    ];
  }
  const btns = active.map((a) => {
    const name = db.findLadyById(a.lady_id)?.name || a.lady_id;
    return { text: `- ${name}`, callback_data: `sess:picksub:${sessionId}:${a.lady_id}` };
  });
  return [...chunk(btns, 2), [{ text: '← 돌아가기', callback_data: `sess:mgmt:${sessionId}` }]];
}

function customerAdjustKeyboard(sessionId, current) {
  const btns = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    text: n === current ? `✓ ${n}명` : `${n}명`,
    callback_data: `sess:setcust:${sessionId}:${n}`,
  }));
  return [...chunk(btns, 3), [{ text: '← 돌아가기', callback_data: `sess:mgmt:${sessionId}` }]];
}

function startTimeAdjustKeyboard(sessionId) {
  const mins = [10, 20, 30, 45, 60, 90];
  const btns = mins.map((m) => ({
    text: `${m}분 전`,
    callback_data: `sess:back:${sessionId}:${m}`,
  }));
  return [
    ...chunk(btns, 3),
    [{ text: '← 관리', callback_data: `sess:mgmt:${sessionId}` }],
  ];
}

function startTimeMenuText(roomLabel, currentStartIso, course) {
  const { formatTimeKST } = require('./time-utils');
  return (
    `${b(`⏳ ${roomLabel} 시작 시각 변경 (${course || 'A'}코스`)}\n\n` +
    `${b('현재')}: ${formatTimeKST(currentStartIso)}\n\n` +
    '아래 버튼 또는\n' +
    '/방시작수정 룸이름 22:33'
  );
}

function ladyRenameKeyboard() {
  const ladies = db.getActiveLadies();
  if (ladies.length === 0) {
    return [[{ text: '← 출근부', callback_data: 'nav:all' }]];
  }
  const btns = ladies.map((l) => ({
    text: `✏️ ${l.name}`,
    callback_data: `lady:ren:${l.id}`,
  }));
  return [...chunk(btns, 2), [{ text: '← 출근부', callback_data: 'nav:all' }]];
}

function roomRenameKeyboard() {
  const rooms = db.getActiveRooms();
  if (rooms.length === 0) {
    return [[{ text: '← 출근부', callback_data: 'nav:all' }]];
  }
  const btns = rooms.map((r) => ({
    text: `✏️ ${r.name}`,
    callback_data: `room:ren:${r.id}`,
  }));
  return [...chunk(btns, 3), [{ text: '← 출근부', callback_data: 'nav:all' }]];
}

function roomStartText(roomId, course, customers, selectedIds) {
  const room = db.findRoomById(roomId);
  const names = selectedIds.map((id) => e(db.findLadyById(id)?.name || id)).join(', ');
  return (
    `${b('▶️ 방 시작')}\n\n` +
    `${b('룸')}: ❤️${e(room?.name || roomId)}\n` +
    `${b('코스')}: ${e(db.courseLabel(course))}\n` +
    `${b('손님')}: 🤵 ${customers}명\n` +
    `${b('언니')}: ${names || '(없음 — 0명 시작 가능)'}`
  );
}

function sessionManageText(session) {
  const fmt = require('./format');
  return `${b('🎛 방 관리')}\n\n${fmt.sessionLine(session)}\n\n원하는 항목을 선택하세요.`;
}

/** @deprecated — activeRoomListKeyboard 사용 */
function activeRoomKeyboard(date) {
  return activeRoomListKeyboard(date);
}

module.exports = {
  getRoomFlow,
  setRoomFlow,
  clearRoomFlow,
  checkinKeyboard,
  checkinMenuText,
  courseMenuText,
  courseMenuKeyboard,
  coursePickForEditKeyboard,
  roomPickKeyboard,
  coursePickKeyboard,
  extendCourseKeyboard,
  customerPickKeyboard,
  ladyPickKeyboard,
  activeRoomListKeyboard,
  activeRoomKeyboard,
  sessionManageKeyboard,
  sessionLadyAddKeyboard,
  sessionLadySubKeyboard,
  customerAdjustKeyboard,
  startTimeAdjustKeyboard,
  startTimeMenuText,
  ladyRenameKeyboard,
  roomRenameKeyboard,
  roomStartText,
  sessionManageText,
};
