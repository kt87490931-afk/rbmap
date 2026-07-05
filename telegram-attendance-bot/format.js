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

function courseTag(session) {
  const c = session.course || 'A';
  return db.courseLabel(c);
}

function sessionLine(session) {
  const rn = roomName(session.room_id);
  const start = formatTimeKST(session.start_time);
  const end = formatTimeKST(session.end_scheduled);
  const status =
    session.status === 'active'
      ? `${courseTag(session)} 진행중`
      : `${courseTag(session)} 종료`;
  const ladies = activeAssignments(session)
    .map((a) => {
      const emoji = a.from_start ? '🙆' : '🙅';
      return `[${emoji}${ladyName(a.lady_id)}]`;
    })
    .join(' ');
  return (
    `[❤️${rn}][${courseTag(session)}][🤵손님 ${session.customer_count}명]\n` +
    `[💘${start}][💔${end}][${status}]\n` +
    `${ladies || '(언니 없음)'}`
  );
}

function ladyCourseCountTag(lady, date) {
  const counts = db.getLadyCourseCounts(date, lady.id);
  const courses = db.getCourses();
  const parts = courses.map((co) => `${co.id}${counts[co.id] || 0}개`).join(' / ');
  return `[${lady.name} ${parts}]`;
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
  let checkedInToday = 0;
  const inTags = [];

  for (const lady of registered) {
    const st = db.getLadyDayState(date, lady.id);
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
  const tags = checkedOut.map((l) => `[${l.name}]`).join(' ');
  return `*퇴근\n${checkedOut.length}명\n${tags || '(없음)'}`;
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

function segmentLine(session, seg) {
  const rn = roomName(session.room_id);
  const start = formatTimeKST(seg.start_time);
  const end = formatTimeKST(seg.ended_at || seg.end_scheduled);
  const label = db.courseLabel(seg.course);
  const ladies = activeAssignments(session)
    .map((a) => ladyName(a.lady_id))
    .join(', ');
  const st =
    session.status === 'active' && !seg.ended_at
      ? '진행중'
      : '종료';
  return `❤️${rn} · ${label} · ${start}~${end} · ${ladies || '-'} · ${st}`;
}

function dailyProgressBlock(date) {
  const day = db.getDay(date);
  if (day.sessions.length === 0) return '(오늘 기록 없음)';

  const lines = [];
  for (const s of day.sessions) {
    const segments = s.course_segments || [
      {
        course: s.course || 'A',
        start_time: s.start_time,
        end_scheduled: s.end_scheduled,
        ended_at: s.ended_at,
      },
    ];
    for (const seg of segments) {
      lines.push(segmentLine(s, seg));
    }
  }
  return lines.join('\n');
}

function ladyStatsBlock(date) {
  return `[금일진행현황]\n${dailyProgressBlock(date)}`;
}

function ladyStatusBlock(date) {
  const { checkedIn, waiting } = classifyLadies(date);
  const inTags = checkedIn.map((l) => ladyCourseCountTag(l, date)).join(' ');
  const waitTags = waiting.map((l) => ladyCourseCountTag(l, date)).join(' ');
  return (
    `🙆 진행중 ${checkedIn.length}명\n${inTags || '(없음)'}\n\n` +
    `🙋 대기중 ${waiting.length}명\n${waitTags || '(없음)'}`
  );
}

function alertInfoBlock() {
  const m = db.getAlertMinutes();
  return `⏰ 현재 알람설정: ${m}분전\n(코스 종료 ${m}분 전 텔레그램 알림)`;
}

function buildView(view, date, perm = { canOperate: false, isSuperAdmin: false }) {
  const store = db.getSettings().store_name || '간지';
  const header = formatDateHeader(date, store);

  switch (view) {
    case 'all':
      return {
        text: [
          `${header} 출근부\n`,
          `${formatDateHeader(date, store)} 출근 인원`,
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
        text: `${header} 미출근\n\n*퇴근\n${classifyLadies(date).checkedOut.map((l) => `[${l.name}]`).join(' ') || '(없음)'}\n\n${alertInfoBlock()}`,
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
      return { text: `${header}\n\n${alertInfoBlock()}\n\n변경할 알람을 선택하세요.` };
    case 'help':
      return { text: buildHelpText(perm.canOperate, perm.isSuperAdmin) };
    default:
      return buildView('all', date);
  }
}

function buildHelpText(canOperate, isSuperAdmin) {
  const lines = ['📖 버튼 도움말', ''];

  lines.push('【조회 — 누구나 / 스탭】');
  lines.push('🚀진행중인방 — 지금 돌아가는 방 (코스·손님·시간·언니)');
  lines.push('👀언니상태 — A/B 코스별 완료·진행 건수');
  lines.push('🏃‍♀️금일진행현황 — 방·코스·시간·언니 상세');
  lines.push('🛑종료된방 — 오늘 끝난 방 기록');
  lines.push('✔️출근인원 — 오늘 출근·대기 인원');
  lines.push('❌미출근인원 — 퇴근 처리된 언니');
  lines.push('👪전체인원 — 등록·출근·진행·퇴근 한눈에');

  if (canOperate) {
    lines.push('', '【코스 관리】');
    lines.push('코스 — 코스추가/수정/삭제 (이름·시간 직접 입력)');
    lines.push('/코스추가 A코스 60 · /코스수정 A A코스 60 · /코스삭제 A');
    lines.push('', '【운영자 — 조작 권한】');
    lines.push('▶️방시작 — 룸 → 코스 → 손님 → 언니(0명 가능)');
    lines.push('🚀진행중인방 — 방별 관리 (시간·연장·언니·손님·종료)');
    lines.push('🚨바쁨 — 전체에 바쁨 알림 (운영자)');
    lines.push('📝출근처리 — 전체 언니 출근/퇴근 (토글 가능)');
    lines.push('⏰알람설정 — 종료 5·10·15분 전 알림');
    lines.push('+언니 / +룸 / ✏️이름변경 — 등록·이름 변경');
    lines.push('', '※ 영업일: 15:00~익일 15:00 = 같은 날짜');
    lines.push('※ 연장 시 코스 재선택 (A→B 등 변경 가능)');
    lines.push('※ 종료 예정 +30분 후 자동 종료');
  }

  if (isSuperAdmin) {
    lines.push('', '【슈퍼관리자 — 권한 부여】');
    lines.push('/운영자추가 @username · /스탭추가 @username · /권한목록');
    lines.push('/내id — 본인 숫자 ID 확인');
  }

  lines.push('', '/출근부 — 출근부 다시 열기');
  lines.push('/알림확인 — 현재 알람 조회');

  return lines.join('\n');
}

function navKeyboard(canOperate, isOperator) {
  const rows = [];
  const showManage = canOperate || isOperator;

  if (canOperate) {
    rows.push([{ text: '▶️방시작', callback_data: 'op:rs_menu' }]);
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
    rows.push([{ text: '🚨바쁨', callback_data: 'op:busy' }]);
    rows.push([{ text: '📝출근처리', callback_data: 'op:ci_menu' }]);
  }

  rows.push([
    { text: '✔️출근인원', callback_data: 'nav:in' },
    { text: '❌미출근인원', callback_data: 'nav:abs' },
    { text: '👪전체인원', callback_data: 'nav:all' },
  ]);

  if (canOperate) {
    rows.push([{ text: '⏰알람설정', callback_data: 'nav:alert' }]);
  }

  if (showManage) {
    rows.push([
      { text: '+언니', callback_data: 'op:addlady' },
      { text: '✏️언니이름변경', callback_data: 'op:renlady' },
    ]);
    rows.push([
      { text: '+룸', callback_data: 'op:addroom' },
      { text: '✏️룸이름변경', callback_data: 'op:renroom' },
    ]);
  }

  rows.push([
    ...(canOperate ? [{ text: '코스', callback_data: 'op:course_menu' }] : []),
    { text: '📖도움말', callback_data: 'nav:help' },
  ]);

  return rows;
}

function alertKeyboard() {
  return db.VALID_ALERTS.map((m) => ({
    text: `${m}분전`,
    callback_data: `alert:${m}`,
  }));
}

function formatAlertMessage(session) {
  const before = session.alert_before_minutes || db.getAlertMinutes();
  const rn = roomName(session.room_id);
  return `⏰ [❤️${rn}] 종료 ${before}분 전\n\n${sessionLine(session)}`;
}

function formatRoomStartNotice(session, by, alertMin) {
  const endAlert = formatTimeKST(session.alert_time);
  return (
    `▶️ 방 시작 — ${by}\n\n${sessionLine(session)}\n\n` +
    `(종료 ${alertMin}분 전 알림 예정 · ${endAlert})`
  );
}

function formatRoomExtendNotice(session, by) {
  const endAlert = formatTimeKST(session.alert_time);
  return `➕ 방 연장 — ${by}\n\n${sessionLine(session)}\n\n(다음 알림: ${endAlert})`;
}

function formatRoomEndNotice(session, by, countsText) {
  let text = `⏹ 방 종료 — ${by}\n\n${sessionLine(session)}`;
  if (countsText) text += `\n\n완료: ${countsText}`;
  return text;
}

function formatBusyNotice(storeName, by) {
  return `🚨 바쁨 — ${storeName}\n\n지금 바쁩니다. 확인해 주세요.\n(${by})`;
}

module.exports = {
  buildView,
  buildHelpText,
  navKeyboard,
  alertKeyboard,
  formatAlertMessage,
  formatRoomStartNotice,
  formatRoomExtendNotice,
  formatRoomEndNotice,
  formatBusyNotice,
  sessionLine,
  ladyName,
  roomName,
  activeAssignments,
  dailyProgressBlock,
  ladyCourseCountTag,
};
