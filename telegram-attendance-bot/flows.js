const db = require('./db');

/** @type {Map<string, { roomId: number, customers: number, ladies: number[], chatId: number }>} */
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

/** 출근/퇴근 버튼 */
function checkinKeyboard(date) {
  const ladies = db.getActiveLadies();
  if (ladies.length === 0) {
    return [[{ text: '← 돌아가기', callback_data: 'nav:all' }]];
  }

  const buttons = [];
  for (const lady of ladies) {
    const st = db.getLadyDayState(date, lady.id);
    if (!st || !st.checked_in) {
      buttons.push({ text: `✅ ${lady.name} 출근`, callback_data: `ci:${lady.id}` });
    } else if (!st.checked_out) {
      if (db.isLadyInActiveSession(date, lady.id)) {
        buttons.push({ text: `🙆 ${lady.name} (방중)`, callback_data: `noop` });
      } else {
        buttons.push({ text: `🏁 ${lady.name} 퇴근`, callback_data: `co:${lady.id}` });
      }
    }
  }

  if (buttons.length === 0) {
    return [
      [{ text: '오늘 처리할 출근/퇴근 없음', callback_data: 'noop' }],
      [{ text: '← 출근부', callback_data: 'nav:all' }],
    ];
  }

  return [...chunk(buttons, 2), [{ text: '← 출근부', callback_data: 'nav:all' }]];
}

/** 1단계: 룸 선택 */
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

/** 2단계: 손님 수 */
function customerPickKeyboard(roomId) {
  const btns = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    text: `🤵 ${n}명`,
    callback_data: `rs:cu:${roomId}:${n}`,
  }));
  return [...chunk(btns, 3), [{ text: '← 룸 다시', callback_data: 'op:rs_menu' }]];
}

/** 3단계: 아가씨 선택 (토글) */
function ladyPickKeyboard(date, roomId, customers, selectedIds) {
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
      callback_data: `rs:ld:${roomId}:${customers}:${lady.id}`,
    });
  }

  if (btns.length === 0) {
    return [
      [{ text: '출근·대기 중인 아가씨 없음', callback_data: 'noop' }],
      [{ text: '← 손님 수', callback_data: `rs:rm:${roomId}` }],
    ];
  }

  const rows = chunk(btns, 2);
  rows.push([
    { text: `▶️ 시작 (${selected.size}명)`, callback_data: `rs:go:${roomId}:${customers}` },
    { text: '← 취소', callback_data: 'nav:all' },
  ]);
  return rows;
}

/** 진행 중 방 관리 */
function activeRoomKeyboard(date) {
  const day = db.getDay(date);
  const active = day.sessions.filter((s) => s.status === 'active');
  if (active.length === 0) {
    return [[{ text: '← 출근부', callback_data: 'nav:all' }]];
  }
  const rows = active.map((s) => {
    const rn = db.findRoomById(s.room_id)?.name || s.room_id;
    return [
      { text: `➕ ${rn} 연장`, callback_data: `sess:ext:${s.id}` },
      { text: `⏹ ${rn} 종료`, callback_data: `sess:end:${s.id}` },
    ];
  });
  rows.push([{ text: '← 출근부', callback_data: 'nav:all' }]);
  return rows;
}

function checkinMenuText(date) {
  const ladies = db.getActiveLadies();
  let absent = 0;
  let waiting = 0;
  let checkedOut = 0;
  for (const lady of ladies) {
    const st = db.getLadyDayState(date, lady.id);
    if (!st || !st.checked_in) absent += 1;
    else if (st.checked_out) checkedOut += 1;
    else if (!db.isLadyInActiveSession(date, lady.id)) waiting += 1;
  }
  return (
    '📝 출근 / 퇴근 처리\n\n' +
    `미출근 ${absent}명 · 대기 ${waiting}명 · 퇴근 ${checkedOut}명\n\n` +
    '아래 버튼을 눌러주세요.'
  );
}

function roomStartText(roomId, customers, selectedIds) {
  const room = db.findRoomById(roomId);
  const names = selectedIds.map((id) => db.findLadyById(id)?.name || id).join(', ');
  return (
    `▶️ 방 시작\n\n` +
    `룸: ❤️${room?.name || roomId}\n` +
    `손님: 🤵 ${customers}명\n` +
    `아가씨: ${names || '(아래에서 선택)'}`
  );
}

module.exports = {
  getRoomFlow,
  setRoomFlow,
  clearRoomFlow,
  checkinKeyboard,
  roomPickKeyboard,
  customerPickKeyboard,
  ladyPickKeyboard,
  activeRoomKeyboard,
  checkinMenuText,
  roomStartText,
};
