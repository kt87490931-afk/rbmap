const db = require('./db');
const { formatDateHeader, formatTimeKST } = require('./time-utils');
const { escapeHtml: e, bold: b } = require('./text-html');

/** 출근부 대시보드 구분선 (모바일 한 줄 기준) */
const DASH_SEP = '━━━━━━━━━━━━━━━━';
const LADY_TAGS_PER_LINE = 5;

/** 언니 태그 목록 — 한 줄에 5명, 6번째부터 줄바꿈 */
function ladyTagsLines(tags, emptyLabel = '(없음)', spaced = true) {
  if (!tags.length) return emptyLabel;
  const sep = spaced ? ' ' : '';
  const lines = [];
  for (let i = 0; i < tags.length; i += LADY_TAGS_PER_LINE) {
    lines.push(tags.slice(i, i + LADY_TAGS_PER_LINE).join(sep));
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

function sessionDrinkBracketTags(session) {
  return db.sessionDrinkLabels(session).map((d) => `[🥃${e(d.name)} ${d.count}병]`);
}

function sessionDrinksTag(session) {
  const tags = sessionDrinkBracketTags(session);
  if (tags.length === 0) return '';
  return tags.join(' ');
}

function sessionPeopleLine(session, includeDrinks = true) {
  const tags = activeAssignments(session).map((a) => `[💋${e(ladyName(a.lady_id))}]`);
  if (includeDrinks) tags.push(...sessionDrinkBracketTags(session));
  if (!tags.length) return '(언니 없음)';
  return ladyTagsLines(tags, '(언니 없음)', false);
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
  const people = sessionPeopleLine(session, includeDrinks);
  return (
    `[❤️${rn}][${ct}][🤵손님 ${session.customer_count}명]${extTag}\n` +
    `[⏳${start}][⌛️${end}][${status}]\n` +
    `${people}`
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

function activeRoomsFormattedBody(date) {
  const day = db.getDay(date);
  const active = day.sessions.filter((s) => db.isSessionInProgress(s));
  if (active.length === 0) {
    return `▶️진행중\n${DASH_SEP}\n(없음)`;
  }
  const roomBlocks = active.map((s) => sessionLine(s, { plain: true }));
  return `▶️진행중\n${DASH_SEP}\n\n${roomBlocks.join(`\n\n${DASH_SEP}\n\n`)}`;
}

function buildActiveRoomsView(date, header) {
  return `${header}\n\n${activeRoomsFormattedBody(date)}\n\n${DASH_SEP}\n\n${dashboardAlertLine()}`;
}

function dashboardActiveRoomsContent(date) {
  return activeRoomsFormattedBody(date);
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
  return activeRoomsFormattedBody(date);
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
      return { text: buildActiveRoomsView(date, header) };
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
  const lines = [b('📖 출근부 도움말'), ''];

  lines.push(b('【공통 — 조회】'));
  lines.push('/출근부 — 오늘 대시보드 (출근·대기·퇴근·진행중·술판매)');
  lines.push('/알림확인 — 현재 알람 설정 (종료 N분 전)');
  lines.push('/도움말 — 이 설명');
  lines.push('');
  lines.push(b('【버튼 — 조회】'));
  lines.push('👪전체인원 — /출근부 대시보드');
  lines.push('🚀진행중인방 — 진행 중 방 목록·상세');
  lines.push('🛑종료된방 — 오늘 종료된 방');
  lines.push('🏃‍♀️금일진행현황 — 방·코스·시간·언니 상세');
  lines.push('👀언니상태 — 언니별 A/B 코스 완료 건수');
  lines.push('✔️출근인원 — 출근·미출근·대기');
  lines.push('❌미출근인원 — 퇴근 처리된 언니');

  if (canOperate) {
    lines.push('', b('【버튼 — 운영】'));
    lines.push('▶️방시작 — 룸 → 코스 → 손님 → 언니(0명 가능)');
    lines.push('💡방관리(연장) — 연장·종료·언니·손님·🥃술·시작시간');
    lines.push('📝출근처리 — 언니 출근/퇴근');
    lines.push('⏰알람설정 — 종료 5·10·15분 전');
    lines.push('🚨바쁨 — 바쁨 알림');
    lines.push('코스 / 🥃술 목록 — 코스·술 마스터 관리');
    lines.push('+언니 · ✏️언니이름변경 · +룸 · ✏️룸이름변경');

    lines.push('', b('【명령 — 출근·퇴근】'));
    lines.push('/출근 이름 [HH:MM]');
    lines.push('/퇴근 이름 [HH:MM]');

    lines.push('', b('【명령 — 방】'));
    lines.push('/방시작 룸 손님수 언니1,언니2 [HH:MM] [코스]');
    lines.push('  · 언니 없음: - 또는 없음');
    lines.push('/방종료 룸');
    lines.push('/방연장 룸 [코스]');
    lines.push('/방시작수정 룸 HH:MM');
    lines.push('/방추가 룸 언니 — 진행 중 방에 언니');
    lines.push('/방빼 룸 언니 — 진행 중 방에서 언니 제외');
    lines.push('/방술빼 룸 술이름 — 실수로 추가한 술 1병 차감');

    lines.push('', b('【명령 — 코스】'));
    lines.push('/코스목록');
    lines.push('/코스추가 이름 분  (예: /코스추가 A코스 60)');
    lines.push('/코스수정 ID 이름 분');
    lines.push('/코스삭제 ID');

    lines.push('', b('【명령 — 술】'));
    lines.push('/술추가 12년산 — 매장 술 목록 등록');
    lines.push('/술삭제 12년산 — 매장 술 목록 삭제');
    lines.push('방 술 추가: 💡방관리(연장) → 🥃술 추가');
    lines.push('/방술빼 5T 12년산 — 방 기록에서 1병 제거');

    lines.push('', b('【명령 — 등록】'));
    lines.push('/언니등록 이름 · /언니해제 이름');
    lines.push('/언니이름변경 옛이름 새이름');
    lines.push('/룸등록 1T · /룸해제 1T');
    lines.push('/룸이름변경 옛이름 새이름');

    lines.push('', b('【운영 메모】'));
    lines.push('※ 영업일: 15:00~익일 15:00');
    lines.push('※ 연장 시 코스 재선택 가능');
    lines.push('※ 종료 예정 시각에 자동 마감 (재개: ▶️방시작)');
    lines.push('※ 시작시간: 방관리 → ⏳시작시간 → HH:MM 입력');
  }

  if (isSuperAdmin) {
    lines.push('', b('【슈퍼관리자 — 권한】'));
    lines.push('/내id — 본인 텔레그램 ID');
    lines.push('/운영자추가 ID [별칭] · /운영자제거 ID');
    lines.push('/스탭추가 ID [별칭] · /스탭제거 ID');
    lines.push('/권한목록');
  }

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
