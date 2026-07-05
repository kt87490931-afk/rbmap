const fs = require('fs');
const path = require('path');
const { addMinutesIso } = require('./time-utils');

const DB_FILE =
  process.env.ATTENDANCE_DATA_PATH ||
  path.join(__dirname, '..', 'data', 'attendance-data.json');
const VALID_ALERTS = [5, 10, 15];
const DEFAULT_ALERT_MINUTES = 5;
/** @deprecated — settings.courses 사용 */
const COURSE_DURATIONS = { A: 60, B: 90 };
/** 종료 예정(end_scheduled) 후 자동 마감까지 대기 (분) */
const AUTO_END_GRACE_MINUTES = 30;
const MAX_AUDIT = 200;
const LEGACY_ALERT_MAP = { 55: 5, 50: 10, 45: 15 };

function defaultCourses() {
  return [
    { id: 'A', name: 'A코스', minutes: 60 },
    { id: 'B', name: 'B코스', minutes: 90 },
  ];
}

function ensureCourses(settings) {
  if (!settings.courses || settings.courses.length === 0) {
    settings.courses = defaultCourses();
  }
}

function getCourses() {
  const data = loadData();
  ensureCourses(data.settings);
  return [...data.settings.courses];
}

function findCourse(courseKey) {
  if (!courseKey) return null;
  const k = String(courseKey).trim();
  const courses = getCourses();
  return courses.find((c) => c.id === k || c.name === k) || null;
}

function makeCourseId(name, existing) {
  let base = String(name).replace(/\s+/g, '').slice(0, 12) || 'C';
  let id = base;
  let n = 1;
  while (existing.some((c) => c.id === id)) {
    id = `${base}${n++}`;
  }
  return id;
}

function courseDuration(courseId) {
  const c = findCourse(courseId);
  if (c) return c.minutes;
  if (COURSE_DURATIONS[courseId]) return COURSE_DURATIONS[courseId];
  return 60;
}

function courseLabel(courseId) {
  const c = findCourse(courseId);
  if (c) return `${c.name}(${c.minutes}분)`;
  const mins = courseDuration(courseId);
  return `${courseId}코스(${mins}분)`;
}

function minutesBetween(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

function repairMislabeledLegacySession(sess) {
  if (sess.course_user_set) return false;
  const seg = sess.course_segments?.[0];
  const start = seg?.start_time || sess.start_time;
  const end = seg?.end_scheduled || sess.end_scheduled;
  const schedMins = minutesBetween(start, end);
  if (schedMins <= 0) return false;
  const catMins = courseDuration(sess.course);
  const isLegacyHourly =
    (sess.hour_count > 1 || [45, 50, 55].includes(sess.alert_minutes)) &&
    (!sess.course_segments || sess.course_segments.length <= 1) &&
    Math.abs(schedMins - catMins) > 10;
  if (!isLegacyHourly) return false;
  sess.course = 'A';
  sess.duration_minutes = schedMins;
  sess.legacy_repaired = true;
  if (seg) seg.course = 'A';
  return true;
}

function calcEndScheduled(startIso, course) {
  return addMinutesIso(startIso, courseDuration(course));
}

function calcAlertTime(endScheduledIso, alertBeforeMin) {
  return addMinutesIso(endScheduledIso, -alertBeforeMin);
}

function initialData() {
  return {
    version: 2,
    settings: {
      store_name: '간지',
      alert_minutes: DEFAULT_ALERT_MINUTES,
      operator_ids: [],
      staff_ids: [],
      role_labels: {},
      delegated_ids: [],
      delegated_labels: {},
      last_alert_change: null,
      last_alert_changed_by: null,
      courses: defaultCourses(),
    },
    ladies: [],
    rooms: [],
    days: {},
    next_lady_id: 1,
    next_room_id: 1,
    next_session_id: 1,
    audit_log: [],
  };
}

function migrateAlertMinutes(m) {
  if (VALID_ALERTS.includes(m)) return m;
  if (LEGACY_ALERT_MAP[m] != null) return LEGACY_ALERT_MAP[m];
  return DEFAULT_ALERT_MINUTES;
}

function normalizeCompletedEntry(val, courseIds) {
  const ids = courseIds || getCourses().map((c) => c.id);
  const out = {};
  for (const id of ids) out[id] = 0;
  if (val && typeof val === 'object') {
    for (const [k, v] of Object.entries(val)) {
      if (typeof v === 'number') out[k] = v;
    }
  } else if (typeof val === 'number') {
    out[ids[0] || 'A'] = val;
  }
  return out;
}

function normalizeSession(sess) {
  if (!sess.course) sess.course = 'A';
  repairMislabeledLegacySession(sess);
  if (!sess.duration_minutes) {
    const segMins = minutesBetween(sess.start_time, sess.end_scheduled);
    sess.duration_minutes = segMins > 0 ? segMins : courseDuration(sess.course);
  }
  if (!sess.alert_before_minutes) {
    sess.alert_before_minutes = migrateAlertMinutes(sess.alert_minutes);
  }
  if (!sess.course_segments || sess.course_segments.length === 0) {
    sess.course_segments = [
      {
        course: sess.course,
        start_time: sess.start_time,
        end_scheduled: sess.end_scheduled,
        ended_at: sess.status === 'ended' ? sess.ended_at || sess.end_scheduled : null,
      },
    ];
  }
  if (sess.status === 'active') {
    const before = sess.alert_before_minutes || getAlertMinutes();
    sess.alert_time = calcAlertTime(sess.end_scheduled, before);
  }
  if (!sess.hour_count) {
    sess.hour_count = Math.max(1, Math.ceil(sess.duration_minutes / 60));
  }
  return sess;
}

function normalizeDay(day, settings) {
  ensureCourses(settings || loadData().settings);
  const courseIds = (settings?.courses || defaultCourses()).map((c) => c.id);
  if (!day.completed_counts) day.completed_counts = {};
  for (const key of Object.keys(day.completed_counts)) {
    day.completed_counts[key] = normalizeCompletedEntry(day.completed_counts[key], courseIds);
  }
  if (!day.sessions) day.sessions = [];
  day.sessions = day.sessions.map(normalizeSession);
  return day;
}

function loadData() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initial = initialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  try {
    let data = JSON.parse(raw);
    if (!data.version || data.version < 2) {
      fs.copyFileSync(DB_FILE, `${DB_FILE}.v1-backup-${Date.now()}.json`);
      const migrated = initialData();
      if (data.settings) {
        migrated.settings.alert_minutes = migrateAlertMinutes(data.settings.alert_minutes);
        migrated.settings.delegated_ids = data.settings.delegated_ids || [];
        migrated.settings.delegated_labels = data.settings.delegated_labels || {};
      }
      data = migrated;
      saveData(data);
    }
    return normalize(data);
  } catch (e) {
    console.error('데이터 파싱 실패:', e.message);
    fs.copyFileSync(DB_FILE, `${DB_FILE}.broken-${Date.now()}.bak`);
    const initial = initialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function syncLegacyDelegated(settings) {
  settings.delegated_ids = [...(settings.operator_ids || [])];
  settings.delegated_labels = { ...(settings.role_labels || {}) };
}

function ensureRoleSettings(settings) {
  if (!settings.operator_ids) {
    settings.operator_ids = [...(settings.delegated_ids || [])];
  }
  if (!settings.staff_ids) settings.staff_ids = [];
  if (!settings.role_labels) {
    settings.role_labels = { ...(settings.delegated_labels || {}) };
  }
  syncLegacyDelegated(settings);
}

function normalize(data) {
  if (!data.settings.delegated_ids) data.settings.delegated_ids = [];
  if (!data.settings.delegated_labels) data.settings.delegated_labels = {};
  ensureRoleSettings(data.settings);
  ensureCourses(data.settings);
  data.settings.alert_minutes = migrateAlertMinutes(data.settings.alert_minutes);
  if (!data.ladies) data.ladies = [];
  if (!data.rooms) data.rooms = [];
  if (!data.days) data.days = {};
  if (!data.audit_log) data.audit_log = [];
  let dirty = false;
  for (const date of Object.keys(data.days)) {
    const before = JSON.stringify(data.days[date].sessions);
    data.days[date] = normalizeDay(data.days[date], data.settings);
    if (JSON.stringify(data.days[date].sessions) !== before) dirty = true;
  }
  if (dirty) saveData(data);
  return data;
}

function saveData(data) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function appendAudit(action, detail, by = 'system') {
  const data = loadData();
  data.audit_log.unshift({ at: new Date().toISOString(), by, action, detail });
  if (data.audit_log.length > MAX_AUDIT) data.audit_log.length = MAX_AUDIT;
  saveData(data);
}

function getSettings() {
  return { ...loadData().settings };
}

function getAlertMinutes() {
  return migrateAlertMinutes(loadData().settings.alert_minutes);
}

function recalcActiveAlerts(data, minutes) {
  for (const date of Object.keys(data.days)) {
    for (const s of data.days[date].sessions) {
      if (s.status === 'active' && !s.alert_sent) {
        s.alert_before_minutes = minutes;
        s.alert_minutes = minutes;
        s.alert_time = calcAlertTime(s.end_scheduled, minutes);
      }
    }
  }
}

function setAlertMinutes(minutes, changedBy = null) {
  if (!VALID_ALERTS.includes(minutes)) return false;
  const data = loadData();
  data.settings.alert_minutes = minutes;
  data.settings.last_alert_change = new Date().toISOString();
  data.settings.last_alert_changed_by = changedBy;
  recalcActiveAlerts(data, minutes);
  saveData(data);
  return true;
}

function getOperatorIds() {
  return loadData().settings.operator_ids.map(String);
}

function getStaffIds() {
  return loadData().settings.staff_ids.map(String);
}

function getRoleLabels() {
  return { ...loadData().settings.role_labels };
}

function isOperatorUser(userId) {
  return getOperatorIds().includes(String(userId));
}

function isStaffUser(userId) {
  return getStaffIds().includes(String(userId));
}

function getDelegatedIds() {
  return getOperatorIds();
}

function getDelegatedLabels() {
  return getRoleLabels();
}

function addOperator(userId, label = null) {
  const id = String(userId);
  const data = loadData();
  ensureRoleSettings(data.settings);
  data.settings.staff_ids = data.settings.staff_ids.filter((x) => x !== id);
  if (!data.settings.operator_ids.includes(id)) data.settings.operator_ids.push(id);
  if (label) data.settings.role_labels[id] = label;
  syncLegacyDelegated(data.settings);
  saveData(data);
}

function removeOperator(userId) {
  const id = String(userId);
  const data = loadData();
  ensureRoleSettings(data.settings);
  data.settings.operator_ids = data.settings.operator_ids.filter((x) => x !== id);
  delete data.settings.role_labels[id];
  syncLegacyDelegated(data.settings);
  saveData(data);
}

function addStaff(userId, label = null) {
  const id = String(userId);
  const data = loadData();
  ensureRoleSettings(data.settings);
  data.settings.operator_ids = data.settings.operator_ids.filter((x) => x !== id);
  if (!data.settings.staff_ids.includes(id)) data.settings.staff_ids.push(id);
  if (label) data.settings.role_labels[id] = label;
  syncLegacyDelegated(data.settings);
  saveData(data);
}

function removeStaff(userId) {
  const id = String(userId);
  const data = loadData();
  ensureRoleSettings(data.settings);
  data.settings.staff_ids = data.settings.staff_ids.filter((x) => x !== id);
  delete data.settings.role_labels[id];
  syncLegacyDelegated(data.settings);
  saveData(data);
}

function addDelegated(userId, label = null) {
  addOperator(userId, label);
}

function removeDelegated(userId) {
  removeOperator(userId);
}

function isDelegated(userId) {
  return isOperatorUser(userId);
}

function getActiveLadies() {
  return loadData().ladies.filter((l) => l.active).sort((a, b) => a.id - b.id);
}

function getActiveRooms() {
  return loadData().rooms.filter((r) => r.active).sort((a, b) => a.id - b.id);
}

function findLadyByName(name) {
  return loadData().ladies.find((l) => l.active && l.name === name);
}

function findLadyById(id) {
  return loadData().ladies.find((l) => l.id === id);
}

function findRoomByName(name) {
  return loadData().rooms.find((r) => r.active && r.name === name);
}

function findRoomById(id) {
  return loadData().rooms.find((r) => r.id === id);
}

function addLady(name) {
  const data = loadData();
  if (data.ladies.some((l) => l.active && l.name === name)) return null;
  const id = data.next_lady_id++;
  data.ladies.push({ id, name, active: true });
  saveData(data);
  return id;
}

function deactivateLady(name) {
  const data = loadData();
  const lady = data.ladies.find((l) => l.active && l.name === name);
  if (!lady) return false;
  lady.active = false;
  saveData(data);
  return true;
}

function renameLady(oldName, newName) {
  const from = oldName.trim();
  const to = newName.trim();
  if (!from || !to) return 'INVALID';
  if (from === to) return 'SAME';
  const data = loadData();
  const lady = data.ladies.find((l) => l.active && l.name === from);
  if (!lady) return 'NOT_FOUND';
  if (data.ladies.some((l) => l.active && l.name === to)) return 'DUPLICATE';
  lady.name = to;
  saveData(data);
  return lady;
}

function addRoom(name) {
  const data = loadData();
  if (data.rooms.some((r) => r.active && r.name === name)) return null;
  const id = data.next_room_id++;
  data.rooms.push({ id, name, active: true });
  saveData(data);
  return id;
}

function deactivateRoom(name) {
  const data = loadData();
  const room = data.rooms.find((r) => r.active && r.name === name);
  if (!room) return false;
  room.active = false;
  saveData(data);
  return true;
}

function renameRoom(oldName, newName) {
  const from = oldName.trim();
  const to = newName.trim();
  if (!from || !to) return 'INVALID';
  if (from === to) return 'SAME';
  const data = loadData();
  const room = data.rooms.find((r) => r.active && r.name === from);
  if (!room) return 'NOT_FOUND';
  if (data.rooms.some((r) => r.active && r.name === to)) return 'DUPLICATE';
  room.name = to;
  saveData(data);
  return room;
}

function ensureDay(date) {
  const data = loadData();
  if (!data.days[date]) {
    data.days[date] = {
      ladies: {},
      sessions: [],
      completed_counts: {},
    };
    saveData(data);
  }
  return loadData().days[date];
}

function getDay(date) {
  const data = loadData();
  const day = data.days[date] || { ladies: {}, sessions: [], completed_counts: {} };
  return normalizeDay(JSON.parse(JSON.stringify(day)), data.settings);
}

function getLadyDayState(date, ladyId) {
  const day = getDay(date);
  return day.ladies[String(ladyId)] || null;
}

function checkInLady(date, ladyId, timeIso) {
  const data = loadData();
  if (!data.days[date]) {
    data.days[date] = { ladies: {}, sessions: [], completed_counts: {} };
  }
  const key = String(ladyId);
  const prev = data.days[date].ladies[key];
  data.days[date].ladies[key] = {
    checked_in: true,
    checked_out: false,
    checkin_time: timeIso,
    checkout_time: null,
  };
  if (prev && prev.checkin_time && !prev.checked_out) {
    data.days[date].ladies[key].checkin_time = prev.checkin_time;
  }
  saveData(data);
}

function checkOutLady(date, ladyId, timeIso) {
  const data = loadData();
  const day = data.days[date];
  if (!day || !day.ladies[String(ladyId)]) return 'NOT_CHECKED_IN';
  const st = day.ladies[String(ladyId)];
  if (st.checked_out) return 'ALREADY';
  if (isLadyInActiveSession(date, ladyId)) return 'IN_SESSION';
  st.checked_out = true;
  st.checkout_time = timeIso;
  saveData(data);
  return true;
}

function isLadyInActiveSession(date, ladyId) {
  const day = getDay(date);
  return day.sessions.some(
    (s) =>
      s.status === 'active' &&
      s.assignments.some((a) => a.lady_id === ladyId && !a.removed_at)
  );
}

function incrementCompletedCount(day, ladyId, courseId, courseIds) {
  const key = String(ladyId);
  const ids = courseIds || getCourses().map((c) => c.id);
  day.completed_counts[key] = normalizeCompletedEntry(day.completed_counts[key], ids);
  const c = findCourse(courseId)?.id || courseId || 'A';
  if (day.completed_counts[key][c] == null) day.completed_counts[key][c] = 0;
  day.completed_counts[key][c] += 1;
}

function getLadyCourseCounts(date, ladyId) {
  const day = getDay(date);
  const key = String(ladyId);
  const courseIds = getCourses().map((c) => c.id);
  const counts = normalizeCompletedEntry(day.completed_counts[key], courseIds);
  for (const s of day.sessions) {
    if (s.status !== 'active') continue;
    if (!s.assignments.some((a) => a.lady_id === ladyId && !a.removed_at)) continue;
    const c = s.course || 'A';
    if (counts[c] == null) counts[c] = 0;
    counts[c] += 1;
  }
  return counts;
}

/** @deprecated — getLadyCourseCounts 사용 */
function getCompletedCount(date, ladyId) {
  const c = getLadyCourseCounts(date, ladyId);
  return Object.values(c).reduce((a, b) => a + b, 0);
}

function findSessionById(sessionId) {
  const data = loadData();
  for (const date of Object.keys(data.days)) {
    const sess = data.days[date].sessions.find((s) => s.id === sessionId);
    if (sess) return { date, session: normalizeSession(sess) };
  }
  return null;
}

function startRoomSession(date, { roomId, chatId, customerCount, ladyIds, startTime, course }) {
  const data = loadData();
  if (!data.days[date]) {
    data.days[date] = { ladies: {}, sessions: [], completed_counts: {} };
  }
  const activeOnRoom = data.days[date].sessions.find(
    (s) => s.room_id === roomId && s.status === 'active'
  );
  if (activeOnRoom) return 'ROOM_BUSY';

  for (const lid of ladyIds) {
    if (isLadyInActiveSession(date, lid)) return 'LADY_BUSY';
  }

  const foundCourse = findCourse(course);
  if (!foundCourse) return 'INVALID_COURSE';
  const c = foundCourse.id;
  const duration = foundCourse.minutes;
  const alertBefore = getAlertMinutes();
  const endScheduled = calcEndScheduled(startTime, c);
  const alertTime = calcAlertTime(endScheduled, alertBefore);
  const id = data.next_session_id++;

  const session = {
    id,
    room_id: roomId,
    chat_id: chatId,
    customer_count: customerCount,
    start_time: startTime,
    course: c,
    duration_minutes: duration,
    hour_count: Math.ceil(duration / 60),
    end_scheduled: endScheduled,
    status: 'active',
    ended_at: null,
    alert_before_minutes: alertBefore,
    alert_minutes: alertBefore,
    alert_time: alertTime,
    alert_sent: false,
    course_user_set: true,
    assignments: ladyIds.map((ladyId) => ({
      lady_id: ladyId,
      from_start: true,
      joined_at: startTime,
      removed_at: null,
    })),
    course_segments: [
      {
        course: c,
        start_time: startTime,
        end_scheduled: endScheduled,
        ended_at: null,
      },
    ],
  };

  data.days[date].sessions.push(session);
  saveData(data);
  return session;
}

function updateSessionStartTime(sessionId, newStartTime) {
  const found = findSessionById(sessionId);
  if (!found || found.session.status !== 'active') return null;
  const data = loadData();
  const sess = data.days[found.date].sessions.find((s) => s.id === sessionId);
  const oldStart = sess.start_time;
  const duration = sess.duration_minutes || courseDuration(sess.course);
  const alertBefore = sess.alert_before_minutes || getAlertMinutes();

  sess.start_time = newStartTime;
  sess.end_scheduled = addMinutesIso(newStartTime, duration);
  sess.alert_time = calcAlertTime(sess.end_scheduled, alertBefore);

  const curSeg = sess.course_segments[sess.course_segments.length - 1];
  if (curSeg) {
    curSeg.start_time = newStartTime;
    curSeg.end_scheduled = sess.end_scheduled;
  }

  for (const a of sess.assignments) {
    if (a.from_start && !a.removed_at) a.joined_at = newStartTime;
  }
  saveData(data);
  return { date: found.date, session: normalizeSession(sess), oldStart };
}

function extendSession(sessionId, course) {
  const found = findSessionById(sessionId);
  if (!found || found.session.status !== 'active') return null;
  const data = loadData();
  const sess = data.days[found.date].sessions.find((s) => s.id === sessionId);
  const foundCourse = findCourse(course);
  if (!foundCourse) return null;
  const c = foundCourse.id;
  const segmentStart = sess.end_scheduled;
  const duration = foundCourse.minutes;
  const alertBefore = getAlertMinutes();
  const newEnd = addMinutesIso(segmentStart, duration);

  const curSeg = sess.course_segments[sess.course_segments.length - 1];
  if (curSeg && !curSeg.ended_at) {
    curSeg.ended_at = segmentStart;
  }

  sess.course = c;
  sess.duration_minutes = duration;
  sess.hour_count = (sess.hour_count || 1) + 1;
  sess.end_scheduled = newEnd;
  sess.alert_before_minutes = alertBefore;
  sess.alert_minutes = alertBefore;
  sess.alert_time = calcAlertTime(newEnd, alertBefore);
  sess.alert_sent = false;
  sess.course_segments.push({
    course: c,
    start_time: segmentStart,
    end_scheduled: newEnd,
    ended_at: null,
  });

  saveData(data);
  return { date: found.date, session: normalizeSession(sess) };
}

function endSession(sessionId) {
  const found = findSessionById(sessionId);
  if (!found || found.session.status !== 'active') return null;
  const data = loadData();
  const day = data.days[found.date];
  const sess = day.sessions.find((s) => s.id === sessionId);
  const now = new Date().toISOString();
  const course = sess.course || 'A';
  const courseIds = getCourses().map((co) => co.id);

  sess.status = 'ended';
  sess.ended_at = now;

  const lastSeg = sess.course_segments[sess.course_segments.length - 1];
  if (lastSeg && !lastSeg.ended_at) lastSeg.ended_at = now;

  for (const a of sess.assignments) {
    if (!a.removed_at) incrementCompletedCount(day, a.lady_id, course, courseIds);
  }

  saveData(data);
  return { date: found.date, session: normalizeSession(sess) };
}

function updateSessionCustomerCount(sessionId, customerCount) {
  const found = findSessionById(sessionId);
  if (!found || found.session.status !== 'active') return null;
  if (customerCount < 1 || customerCount > 20) return 'INVALID';
  const data = loadData();
  const sess = data.days[found.date].sessions.find((s) => s.id === sessionId);
  sess.customer_count = customerCount;
  saveData(data);
  return sess;
}

function addLadyToSession(sessionId, ladyId) {
  const found = findSessionById(sessionId);
  if (!found || found.session.status !== 'active') return null;
  if (isLadyInActiveSession(found.date, ladyId)) return 'LADY_BUSY';
  const data = loadData();
  const sess = data.days[found.date].sessions.find((s) => s.id === sessionId);
  if (sess.assignments.some((a) => a.lady_id === ladyId && !a.removed_at)) return 'ALREADY';
  const now = new Date().toISOString();
  sess.assignments.push({
    lady_id: ladyId,
    from_start: false,
    joined_at: now,
    removed_at: null,
  });
  saveData(data);
  return sess;
}

function removeLadyFromSession(sessionId, ladyId) {
  const found = findSessionById(sessionId);
  if (!found || found.session.status !== 'active') return null;
  const data = loadData();
  const sess = data.days[found.date].sessions.find((s) => s.id === sessionId);
  const a = sess.assignments.find((x) => x.lady_id === ladyId && !x.removed_at);
  if (!a) return null;
  a.removed_at = new Date().toISOString();
  saveData(data);
  return sess;
}

function markSessionAlertSent(sessionId) {
  const found = findSessionById(sessionId);
  if (!found) return;
  const data = loadData();
  const sess = data.days[found.date].sessions.find((s) => s.id === sessionId);
  if (sess) {
    sess.alert_sent = true;
    saveData(data);
  }
}

function getPendingAlerts() {
  const data = loadData();
  const pending = [];
  for (const date of Object.keys(data.days)) {
    for (const s of data.days[date].sessions) {
      if (s.status === 'active' && !s.alert_sent) {
        pending.push({ date, session: normalizeSession(s) });
      }
    }
  }
  return pending;
}

function getSessionsDueForAutoEnd() {
  const data = loadData();
  const now = Date.now();
  const graceMs = AUTO_END_GRACE_MINUTES * 60000;
  const due = [];
  for (const date of Object.keys(data.days)) {
    for (const s of data.days[date].sessions) {
      if (s.status !== 'active') continue;
      const deadline = new Date(s.end_scheduled).getTime() + graceMs;
      if (now >= deadline) due.push({ date, session: s });
    }
  }
  return due;
}

function getAllData() {
  return loadData();
}

function replaceSettings(partial) {
  const data = loadData();
  if (partial.store_name != null) data.settings.store_name = partial.store_name;
  if (partial.alert_minutes != null) {
    const m = migrateAlertMinutes(partial.alert_minutes);
    if (VALID_ALERTS.includes(m)) {
      data.settings.alert_minutes = m;
      data.settings.last_alert_change = new Date().toISOString();
      data.settings.last_alert_changed_by = partial.last_alert_changed_by || 'admin-web';
      recalcActiveAlerts(data, m);
    }
  }
  if (partial.delegated_ids != null) partial.operator_ids = partial.delegated_ids;
  if (partial.delegated_labels != null) partial.role_labels = partial.delegated_labels;
  if (partial.operator_ids != null) {
    data.settings.operator_ids = partial.operator_ids.map(String);
    ensureRoleSettings(data.settings);
  }
  if (partial.staff_ids != null) {
    data.settings.staff_ids = partial.staff_ids.map(String);
    ensureRoleSettings(data.settings);
  }
  if (partial.role_labels != null) {
    data.settings.role_labels = partial.role_labels;
    ensureRoleSettings(data.settings);
  }
  saveData(data);
  return data.settings;
}

function addLadyFromAdmin(name) {
  return addLady(name);
}

function addRoomFromAdmin(name) {
  return addRoom(name);
}

function coursesListText() {
  const courses = getCourses();
  if (courses.length === 0) return '(등록된 코스 없음)';
  return courses.map((c) => `· ${c.id}: ${c.name} (${c.minutes}분)`).join('\n');
}

function addCourse(name, minutes) {
  const mins = parseInt(minutes, 10);
  if (!name || !mins || mins < 1 || mins > 600) return 'INVALID';
  const data = loadData();
  ensureCourses(data.settings);
  if (data.settings.courses.some((c) => c.name === name)) return 'DUPLICATE';
  const id = makeCourseId(name, data.settings.courses);
  data.settings.courses.push({ id, name, minutes: mins });
  saveData(data);
  return { id, name, minutes: mins };
}

function updateCourse(courseKey, name, minutes) {
  const mins = parseInt(minutes, 10);
  if (!name || !mins || mins < 1 || mins > 600) return 'INVALID';
  const data = loadData();
  ensureCourses(data.settings);
  const idx = data.settings.courses.findIndex(
    (c) => c.id === courseKey || c.name === courseKey
  );
  if (idx < 0) return 'NOT_FOUND';
  const id = data.settings.courses[idx].id;
  if (data.settings.courses.some((c) => c.name === name && c.id !== id)) return 'DUPLICATE';
  data.settings.courses[idx] = { id, name, minutes: mins };
  saveData(data);
  return data.settings.courses[idx];
}

function removeCourse(courseKey) {
  const data = loadData();
  ensureCourses(data.settings);
  if (data.settings.courses.length <= 1) return 'LAST_ONE';
  const idx = data.settings.courses.findIndex(
    (c) => c.id === courseKey || c.name === courseKey
  );
  if (idx < 0) return 'NOT_FOUND';
  const removed = data.settings.courses.splice(idx, 1)[0];
  saveData(data);
  return removed;
}

module.exports = {
  DB_FILE,
  VALID_ALERTS,
  DEFAULT_ALERT_MINUTES,
  COURSE_DURATIONS,
  AUTO_END_GRACE_MINUTES,
  courseDuration,
  courseLabel,
  getCourses,
  findCourse,
  coursesListText,
  addCourse,
  updateCourse,
  removeCourse,
  defaultCourses,
  getSettings,
  getAlertMinutes,
  setAlertMinutes,
  getOperatorIds,
  getStaffIds,
  getRoleLabels,
  isOperatorUser,
  isStaffUser,
  addOperator,
  removeOperator,
  addStaff,
  removeStaff,
  getDelegatedIds,
  getDelegatedLabels,
  addDelegated,
  removeDelegated,
  isDelegated,
  getActiveLadies,
  getActiveRooms,
  findLadyByName,
  findLadyById,
  findRoomByName,
  findRoomById,
  addLady,
  deactivateLady,
  renameLady,
  addRoom,
  deactivateRoom,
  renameRoom,
  ensureDay,
  getDay,
  getLadyDayState,
  checkInLady,
  checkOutLady,
  isLadyInActiveSession,
  getCompletedCount,
  getLadyCourseCounts,
  findSessionById,
  startRoomSession,
  updateSessionStartTime,
  extendSession,
  endSession,
  updateSessionCustomerCount,
  addLadyToSession,
  removeLadyFromSession,
  markSessionAlertSent,
  getPendingAlerts,
  getSessionsDueForAutoEnd,
  getAllData,
  replaceSettings,
  appendAudit,
  addLadyFromAdmin,
  addRoomFromAdmin,
};
