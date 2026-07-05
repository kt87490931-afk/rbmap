const fs = require('fs');
const path = require('path');
const { addMinutesIso, addHoursIso } = require('./time-utils');

const DB_FILE =
  process.env.ATTENDANCE_DATA_PATH ||
  path.join(__dirname, '..', 'data', 'attendance-data.json');
const DEFAULT_ALERT_MINUTES = 55;
const VALID_ALERTS = [45, 50, 55];
const MAX_AUDIT = 200;

function initialData() {
  return {
    version: 2,
    settings: {
      store_name: '간지',
      alert_minutes: DEFAULT_ALERT_MINUTES,
      delegated_ids: [],
      delegated_labels: {},
      last_alert_change: null,
      last_alert_changed_by: null,
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
        migrated.settings.alert_minutes = VALID_ALERTS.includes(data.settings.alert_minutes)
          ? data.settings.alert_minutes
          : DEFAULT_ALERT_MINUTES;
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

function normalize(data) {
  if (!data.settings.delegated_ids) data.settings.delegated_ids = [];
  if (!data.settings.delegated_labels) data.settings.delegated_labels = {};
  if (!data.ladies) data.ladies = [];
  if (!data.rooms) data.rooms = [];
  if (!data.days) data.days = {};
  if (!data.audit_log) data.audit_log = [];
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
  const m = loadData().settings.alert_minutes;
  return VALID_ALERTS.includes(m) ? m : DEFAULT_ALERT_MINUTES;
}

function setAlertMinutes(minutes, changedBy = null) {
  if (!VALID_ALERTS.includes(minutes)) return false;
  const data = loadData();
  data.settings.alert_minutes = minutes;
  data.settings.last_alert_change = new Date().toISOString();
  data.settings.last_alert_changed_by = changedBy;
  saveData(data);
  return true;
}

function getDelegatedIds() {
  return loadData().settings.delegated_ids.map(String);
}

function getDelegatedLabels() {
  return { ...loadData().settings.delegated_labels };
}

function addDelegated(userId, label = null) {
  const id = String(userId);
  const data = loadData();
  if (!data.settings.delegated_ids.includes(id)) data.settings.delegated_ids.push(id);
  if (label) data.settings.delegated_labels[id] = label;
  saveData(data);
}

function removeDelegated(userId) {
  const id = String(userId);
  const data = loadData();
  data.settings.delegated_ids = data.settings.delegated_ids.filter((x) => x !== id);
  delete data.settings.delegated_labels[id];
  saveData(data);
}

function isDelegated(userId) {
  return getDelegatedIds().includes(String(userId));
}

// ---------- 아가씨 / 룸 마스터 ----------
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

// ---------- 일별 데이터 ----------
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
  return data.days[date] || { ladies: {}, sessions: [], completed_counts: {} };
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
  data.days[date].ladies[key] = {
    checked_in: true,
    checked_out: false,
    checkin_time: timeIso,
    checkout_time: null,
  };
  saveData(data);
}

function checkOutLady(date, ladyId, timeIso) {
  const data = loadData();
  const day = data.days[date];
  if (!day || !day.ladies[String(ladyId)]) return false;
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

function getCompletedCount(date, ladyId) {
  const day = getDay(date);
  return day.completed_counts[String(ladyId)] || 0;
}

function findSessionById(sessionId) {
  const data = loadData();
  for (const date of Object.keys(data.days)) {
    const sess = data.days[date].sessions.find((s) => s.id === sessionId);
    if (sess) return { date, session: sess };
  }
  return null;
}

function startRoomSession(date, { roomId, chatId, customerCount, ladyIds, startTime, alertMinutes }) {
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

  const id = data.next_session_id++;
  const hourCount = 1;
  const endScheduled = addHoursIso(startTime, hourCount);
  const alertTime = addMinutesIso(startTime, alertMinutes);

  const session = {
    id,
    room_id: roomId,
    chat_id: chatId,
    customer_count: customerCount,
    start_time: startTime,
    hour_count: hourCount,
    end_scheduled: endScheduled,
    status: 'active',
    ended_at: null,
    alert_minutes: alertMinutes,
    alert_time: alertTime,
    alert_sent: false,
    assignments: ladyIds.map((ladyId) => ({
      lady_id: ladyId,
      from_start: true,
      joined_at: startTime,
      removed_at: null,
    })),
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
  sess.start_time = newStartTime;
  sess.end_scheduled = addHoursIso(newStartTime, sess.hour_count);
  if (!sess.alert_sent) {
    sess.alert_time = addMinutesIso(newStartTime, sess.alert_minutes);
  }
  for (const a of sess.assignments) {
    if (a.from_start && !a.removed_at) a.joined_at = newStartTime;
  }
  saveData(data);
  return { date: found.date, session: sess, oldStart };
}

function extendSession(sessionId) {
  const found = findSessionById(sessionId);
  if (!found || found.session.status !== 'active') return null;
  const data = loadData();
  const sess = data.days[found.date].sessions.find((s) => s.id === sessionId);
  const now = new Date().toISOString();
  sess.hour_count += 1;
  sess.end_scheduled = addHoursIso(sess.start_time, sess.hour_count);
  sess.alert_minutes = getAlertMinutes();
  sess.alert_time = addMinutesIso(now, sess.alert_minutes);
  sess.alert_sent = false;
  saveData(data);
  return { date: found.date, session: sess };
}

function endSession(sessionId) {
  const found = findSessionById(sessionId);
  if (!found || found.session.status !== 'active') return null;
  const data = loadData();
  const day = data.days[found.date];
  const sess = day.sessions.find((s) => s.id === sessionId);
  const now = new Date().toISOString();
  sess.status = 'ended';
  sess.ended_at = now;

  for (const a of sess.assignments) {
    if (!a.removed_at) {
      const key = String(a.lady_id);
      day.completed_counts[key] = (day.completed_counts[key] || 0) + 1;
    }
  }

  saveData(data);
  return { date: found.date, session: sess };
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
        pending.push({ date, session: s });
      }
    }
  }
  return pending;
}

function getAllData() {
  return loadData();
}

function replaceSettings(partial) {
  const data = loadData();
  if (partial.store_name != null) data.settings.store_name = partial.store_name;
  if (partial.alert_minutes != null && VALID_ALERTS.includes(partial.alert_minutes)) {
    data.settings.alert_minutes = partial.alert_minutes;
    data.settings.last_alert_change = new Date().toISOString();
    data.settings.last_alert_changed_by = partial.last_alert_changed_by || 'admin-web';
  }
  if (partial.delegated_ids != null) data.settings.delegated_ids = partial.delegated_ids.map(String);
  if (partial.delegated_labels != null) data.settings.delegated_labels = partial.delegated_labels;
  saveData(data);
  return data.settings;
}

function addLadyFromAdmin(name) {
  return addLady(name);
}

function addRoomFromAdmin(name) {
  return addRoom(name);
}

module.exports = {
  DB_FILE,
  VALID_ALERTS,
  DEFAULT_ALERT_MINUTES,
  getSettings,
  getAlertMinutes,
  setAlertMinutes,
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
  ensureDay,
  getDay,
  getLadyDayState,
  checkInLady,
  checkOutLady,
  isLadyInActiveSession,
  getCompletedCount,
  findSessionById,
  startRoomSession,
  updateSessionStartTime,
  extendSession,
  endSession,
  addLadyToSession,
  removeLadyFromSession,
  markSessionAlertSent,
  getPendingAlerts,
  getAllData,
  replaceSettings,
  appendAudit,
  addLadyFromAdmin,
  addRoomFromAdmin,
};
