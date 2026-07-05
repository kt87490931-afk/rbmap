const db = require('./db');
const { formatDateHeader, formatTimeKST } = require('./time-utils');
const { escapeHtml: e, bold: b } = require('./text-html');

/** 출근부 대시보드 구분선 (모바일 한 줄 기준) */
const DASH_SEP = '━━━━━━━━━━━━━━━━';
const LADY_TAGS_PER_LINE = 5;

/** 언니 태그 목록 — 한 줄에 5명, 6번째부터 줄바꿈 */
function ladyTagsLines(tags, emptyLabel = '(없음)') {
  if (!tags.length) return emptyLabel;
  const lines = [];
  for (let i = 0; i < tags.length; i += LADY_TAGS_PER_LINE) {
    lines.push(tags.slice(i, i + LADY_TAGS_PER_LINE).join(' '));
  }
  return lines.join('\n');
}

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

/** @deprecated — db.assignmentsInSegment 사용 */
function segmentAssignments(session, seg) {
  return db.assignmentsInSegment(session, seg);
}

function courseTag(session) {
  const c = session.course || 'A';
  return db.courseLabel(c);
}

function sessionDrinksTag(session) {
  const labels = db.sessionDrinkLabels(session);
  if (labels.length === 0) return '';
  return labels.map((d) => `[🥃${e(d.name)} ${d.count}병]`).join(' ');
}

function sessionLine(session, opts = {}) {
  const includeDrinks = opts.includeDrinks !== false;
  const plain = opts.plain === true;
  const rn = e(roomName(session.room_id));
  const ct = e(courseTag(session));
  const start = formatTimeKST(session.start_time);
  const end = formatTimeKST(session.end_scheduled);
  const running = db.isSessionInProgress(session);
  const status = running
    ? plain
      ? `${ct} 진행중`
      : `${ct} ${b('진행중')}`
    : plain
      ? `${ct} 종료`
      : `${ct} ${b('종료')}`;
  const ext = db.sessionExtensionCount(session);
  const extTag = ext > 0 ? `[연장+${ext}]` : '';
  const drinksTag = includeDrinks ? sessionDrinksTag(session) : '';
  const ladyTagList = activeAssignments(session).map(
    (a) => `[💋${e(ladyName(a.lady_id))}]`
  );
  const ladies = ladyTagList.length ? ladyTagsLines(ladyTagList, '(언니 없음)') : '(언니 없음)';
  const drinksLine = drinksTag ? `\n${drinksTag}` : '';
  return (
    `[❤️${rn}][${ct}][🤵손님 ${session.customer_count}명]${extTag}\n` +
    `[⏳${start}][⌛️${end}][${status}]${drinksLine}\n` +
    `${ladies || '(언니 없음)'}`
  );
}

function dashSection(body) {
  return `${DASH_SEP}\n${body}`;
}

/** 금일 전체 세션 술 판매 합산 */
function dayDrinksSalesBlock(date) {
  const day = db.getDay(date);
  const totals = new Map();

  for (const s of day.sessions) {
    for (const item of db.sessionDrinkLabels(s)) {
      totals.set(item.name, (totals.get(item.name) || 0) + item.count);
    }
  }
  if (totals.size === 0) return '';

  const lines = ['🥃술 판매'];
  for (const [name, count] of totals) {
    lines.push(`🥃${e(name)} ${count}병`);
  }
  return lines.join('\n');
}

function dashboardActiveRoomsContent(date) {
  const day = db.getDay(date);
  const active = day.sessions.filter((s) => db.isSessionInProgress(s));
  if (active.length === 0) {
    return `▶️진행중\n\n(없음)`;
  }
  const roomBlocks = active.map((s) => sessionLine(s, { includeDrinks: false, plain: true }));
  return `▶️진행중\n\n${roomBlocks.join(`\n${DASH_SEP}\n`)}`;
}

function dashboardAlertLine() {
  const m = db.getAlertMinutes();
  return `⏰ 현재 알람설정: ${m}분전`;
}

function buildDashboardView(date, header) {
  const { registered, waiting, checkedOut } = classifyLadies(date);
  let checkedInToday = 0;
  const inTags = [];

  for (const lady of registered) {
    const st = db.getLadyDayState(date, lady.id);
    if (!st || !st.checked_in) continue;
    checkedInToday += 1;
    if (st.checked_out) continue;
    inTags.push(`[💋${e(lady.name)}]`);
  }

  const waitTagList = waiting.map((l) => `[💋${e(l.name)}]`);
  const outTagList = checkedOut.map((l) => `[💋${e(l.name)}]`);

  const parts = [
    b(`${header} 출근부`),
    dashSection(`출근인원 : ${checkedInToday}명\n${ladyTagsLines(inTags)}`),
    dashSection(`대기인원 : ${waiting.length}명\n${ladyTagsLines(waitTagList)}`),
    dashSection(`퇴근 ${checkedOut.length}명\n${ladyTagsLines(outTagList)}`),
    dashSection(dashboardActiveRoomsContent(date)),
  ];

  const drinks = dayDrinksSalesBlock(date);
  if (drinks) parts.push(dashSection(drinks));

  parts.push('', dashboardAlertLine());
  return parts.join('\n\n');
}

function ladyCourseCountTag(lady, date) {
  const counts = db.getLadyCourseCounts(date, lady.id);
  const courses = db.getCourses();
  const parts = courses
    .map((co) => `${e(db.courseLabel(co.id))} ${counts[co.id] || 0}개`)
    .join(' / ');
  return `[💋${e(lady.name)} ${parts}]`;
}

function registeredBlock(date) {
  const ladies = db.getActiveLadies();
  const rooms = db.getActiveRooms();
  const nameTags = ladies.map((l) => `[💋${e(l.name)}]`);
  const roomTags = rooms.map((r) => `[❤️${e(r.name)}]`).join(' ');
  return (
    `${b(`언니 등록인원 : ${ladies.length}명`)}\n${ladyTagsLines(nameTags)}\n\n` +
    `${b('룸이름')}\n${roomTags || '(없음)'}`
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
    inTags.push(`[💋${e(lady.name)}]`);
  }

  const absentTagList = absent.map((l) => `[☠️${e(l.name)}]`);
  const waitTagList = waiting.map((l) => `[💋${e(l.name)}]`);

  return (
    `${b(`출근인원 : ${checkedInToday}명`)}\n${ladyTagsLines(inTags)}\n\n` +
    `${b(`미출근인원 : ${absent.length}명`)}\n${ladyTagsLines(absentTagList)}\n\n` +
    `${b(`대기인원 : ${waiting.length}명`)}\n${ladyTagsLines(waitTagList)}`
  );
}

function checkoutBlock(date) {
  const { checkedOut } = classifyLadies(date);
  const tags = checkedOut.map((l) => `[💋${e(l.name)}]`);
  return `${b(`퇴근 ${checkedOut.length}명`)}\n${ladyTagsLines(tags)}`;
}

function activeRoomsBlock(date) {
  const day = db.getDay(date);
  const active = day.sessions.filter((s) => db.isSessionInProgress(s));
  if (active.length === 0) return `${b('▶️진행중')}\n(없음)`;
  return `${b('▶️진행중')}\n\n${active.map(sessionLine).join('\n\n')}`;
}

function endedRoomsBlock(date) {
  const day = db.getDay(date);
  const ended = day.sessions.filter((s) => db.isSessionEndedForDisplay(s));
  if (ended.length === 0) return `${b('🏁종료된 방')}\n(없음)`;
  return `${b('🏁종료된 방')}\n\n${ended.map(sessionLine).join('\n\n')}`;
}

function segmentLine(session, seg) {
  const rn = e(roomName(session.room_id));
  const start = formatTimeKST(seg.start_time);
  const end = formatTimeKST(seg.ended_at || seg.end_scheduled);
  const label = e(db.courseLabel(seg.course));
  const ladies = activeAssignments(session)
    .map((a) => `💋${e(ladyName(a.lady_id))}`)
    .join(', ');
  const st =
    session.status === 'active' &&
    !seg.ended_at &&
    Date.now() < new Date(seg.end_scheduled).getTime()
      ? b('진행중')
      : b('종료');
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

/** 금일진행현황 — 코스별 언니 참여 인원 (세그먼트×언니) */
function courseDayCountBlock(date) {
  const day = db.getDay(date);
  const counts = {};
  for (const s of day.sessions) {
    const segments = db.sessionSegments(s);
    for (const seg of segments) {
      const label = db.courseLabel(seg.course);
      const n = db.assignmentsInSegment(s, seg).length;
      counts[label] = (counts[label] || 0) + n;
    }
  }
  if (Object.keys(counts).length === 0) return '';

  const lines = [];
  for (const c of db.getCourses()) {
    const label = db.courseLabel(c.id);
    if (counts[label]) {
      lines.push(b(`${label}=${counts[label]}`));
      delete counts[label];
    }
  }
  for (const [label, n] of Object.entries(counts)) {
    lines.push(b(`${label}=${n}`));
  }
  return lines.join('\n');
}

function ladyStatsBlock(date) {
  return `${b('🏃‍♀️ 금일진행현황')}\n${dailyProgressBlock(date)}`;
}

function ladyStatusBlock(date) {
  const { checkedIn, waiting } = classifyLadies(date);
  const inTags = checkedIn.map((l) => ladyCourseCountTag(l, date)).join('\n');
  const waitTags = waiting.map((l) => ladyCourseCountTag(l, date)).join('\n');
  return (
    `${b(`🙆 진행중 ${checkedIn.length}명`)}\n${inTags || '(없음)'}\n\n` +
    `${b(`🙋 대기중 ${waiting.length}명`)}\n${waitTags || '(없음)'}`
  );
}

function alertInfoBlock() {
  const m = db.getAlertMinutes();
  return `${b(`⏰ 현재 알람설정: ${m}분전`)}\n(코스 종료 ${m}분 전 텔레그램 알림)`;
}

function buildView(view, date, perm = { canOperate: false, isSuperAdmin: false }) {
  const store = db.getSettings().store_name || '간지';
  const header = formatDateHeader(date, store);

  switch (view) {
    case 'all':
      return { text: buildDashboardView(date, header) };
    case 'in':
      return {
        text: `${b(`${header} 출근 인원`)}\n\n${checkinBlock(date)}\n\n${alertInfoBlock()}`,
      };
    case 'abs': {
      const out = classifyLadies(date).checkedOut;
      const outTagList = out.map((l) => `[💋${e(l.name)}]`);
      return {
        text: `${b(`${header} 미출근`)}\n\n${b(`퇴근 ${out.length}명`)}\n${ladyTagsLines(outTagList)}\n\n${alertInfoBlock()}`,
      };
    }
    case 'act':
      return { text: `${b(header)}\n\n${activeRoomsBlock(date)}\n\n${alertInfoBlock()}` };
    case 'end':
      return { text: `${b(header)}\n\n${endedRoomsBlock(date)}\n\n${alertInfoBlock()}` };
    case 'stats': {
      const counter = courseDayCountBlock(date);
      const counterPart = counter ? `\n${counter}` : '';
      return {
        text: `${b(header)}${counterPart}\n\n${ladyStatsBlock(date)}\n\n${alertInfoBlock()}`,
      };
    }
    case 'status':
      return {
        text: `${b(header)}\n\n${b('👀언니상태')}\n\n${ladyStatusBlock(date)}\n\n${alertInfoBlock()}`,
      };
    case 'alert':
      return { text: `${b(header)}\n\n${alertInfoBlock()}\n\n변경할 알람을 선택하세요.` };
    case 'help':
      return { text: buildHelpText(perm.canOperate, perm.isSuperAdmin) };
    default:
      return buildView('all', date);
  }
}

function buildHelpText(canOperate, isSuperAdmin) {
  const lines = [b('📖 버튼 도움말'), ''];

  lines.push(b('【조회 — 누구나 / 스탭】'));
  lines.push('🚀진행중인방 — 지금 돌아가는 방 (코스·손님·시간·언니)');
  lines.push('👀언니상태 — A/B 코스별 완료·진행 건수');
  lines.push('🏃‍♀️금일진행현황 — 방·코스·시간·언니 상세');
  lines.push('🛑종료된방 — 오늘 끝난 방 기록');
  lines.push('✔️출근인원 — 오늘 출근·대기 인원');
  lines.push('❌미출근인원 — 퇴근 처리된 언니');
  lines.push('👪전체인원 — 등록·출근·진행·퇴근 한눈에');

  if (canOperate) {
    lines.push('', b('【코스 관리】'));
    lines.push('코스 — 코스추가/수정/삭제 (이름·시간 직접 입력)');
    lines.push('/코스추가 A코스 60 · /코스수정 A A코스 60 · /코스삭제 A');
    lines.push('🥃술 목록 — 등록 술 조회 · /술추가 12년산 · /술삭제 12년산');
    lines.push('', b('【운영자 — 조작 권한】'));
    lines.push('▶️방시작 — 룸 → 코스 → 손님 → 언니(0명 가능)');
    lines.push('💡방관리(연장) — 진행 중 방 → 연장·종료·언니·손님·🥃술·시간');
    lines.push('🚀진행중인방 — 지금 돌아가는 방 목록 (조회)');
    lines.push('🚨바쁨 — 전체에 바쁨 알림 (운영자)');
    lines.push('📝출근처리 — 전체 언니 출근/퇴근 (토글 가능)');
    lines.push('⏰알람설정 — 종료 5·10·15분 전 알림');
    lines.push('+언니 / +룸 / ✏️이름변경 — 등록·이름 변경');
    lines.push('', '※ 영업일: 15:00~익일 15:00 = 같은 날짜');
    lines.push('※ 연장 시 코스 재선택 (A→B 등 변경 가능)');
    lines.push('※ 종료 예정 시각에 자동 마감 (재개 시 ▶️방시작)');
  }

  if (isSuperAdmin) {
    lines.push('', b('【슈퍼관리자 — 권한 부여】'));
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
    rows.push([
      { text: '▶️방시작', callback_data: 'op:rs_menu' },
      { text: '💡방관리(연장)', callback_data: 'op:rm_menu' },
    ]);
  }

  rows.push([
    { text: '🏃‍♀️금일진행현황', callback_data: 'nav:stats' },
    { text: '🚀진행중인방', callback_data: 'nav:act' },
    { text: '🛑종료된방', callback_data: 'nav:end' },
  ]);

  if (canOperate) {
    rows.push([{ text: '📝출근처리', callback_data: 'op:ci_menu' }]);
  }

  rows.push([
    { text: '✔️출근인원', callback_data: 'nav:in' },
    { text: '❌미출근인원', callback_data: 'nav:abs' },
    { text: '👪전체인원', callback_data: 'nav:all' },
  ]);

  if (canOperate) {
    rows.push([
      { text: '⏰알람설정', callback_data: 'nav:alert' },
      { text: '🚨바쁨', callback_data: 'op:busy' },
    ]);
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
    ...(canOperate
      ? [
          { text: '코스', callback_data: 'op:course_menu' },
          { text: '🥃술 목록', callback_data: 'op:drink_menu' },
        ]
      : []),
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
  const rn = e(roomName(session.room_id));
  return `${b(`⏰ [❤️${rn}] 종료 ${before}분 전`)}\n\n${sessionLine(session)}`;
}

function formatRoomStartNotice(session, by, alertMin) {
  const endAlert = formatTimeKST(session.alert_time);
  return (
    `${b('▶️ 방 시작')} — ${e(by)}\n\n${sessionLine(session)}\n\n` +
    `(종료 ${alertMin}분 전 알림 예정 · ${endAlert})`
  );
}

function formatRoomExtendNotice(session, by) {
  const endAlert = formatTimeKST(session.alert_time);
  return `${b('➕ 방 연장')} — ${e(by)}\n\n${sessionLine(session)}\n\n(다음 알림: ${endAlert})`;
}

function formatRoomEndNotice(session, by, countsText) {
  let text = `${b('⏹ 방 종료')} — ${e(by)}\n\n${sessionLine(session)}`;
  if (countsText) text += `\n\n${b('완료')}: ${e(countsText)}`;
  return text;
}

function formatBusyNotice(storeName) {
  return `${b('🚨 바쁨')} — ${e(storeName)}\n\n지금 바쁩니다. 확인해 주세요.`;
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
  sessionDrinksTag,
  ladyTagsLines,
  ladyName,
  roomName,
  activeAssignments,
  dailyProgressBlock,
  ladyCourseCountTag,
};
