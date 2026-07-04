const fs = require('fs');
const path = require('path');

const DB_FILE =
  process.env.ATTENDANCE_DATA_PATH ||
  path.join(__dirname, '..', 'data', 'attendance-data.json');
const DEFAULT_ALERT_MINUTES = 60;
const MAX_AUDIT = 200;

function initialData() {
  return {
    settings: {
      alert_minutes: DEFAULT_ALERT_MINUTES,
      delegated_ids: [],
      delegated_labels: {},
      last_alert_change: null,
      last_alert_changed_by: null,
    },
    checkins: [],
    nextId: 1,
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
    const data = JSON.parse(raw);
    if (!data.settings) data.settings = initialData().settings;
    if (!Array.isArray(data.settings.delegated_ids)) data.settings.delegated_ids = [];
    if (!data.settings.delegated_labels) data.settings.delegated_labels = {};
    if (!Array.isArray(data.audit_log)) data.audit_log = [];
    return data;
  } catch (e) {
    console.error('데이터 파일 파싱 실패, 백업 후 초기화:', e.message);
    fs.copyFileSync(DB_FILE, `${DB_FILE}.broken-${Date.now()}.bak`);
    const initial = initialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function saveData(data) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2));
  fs.renameSync(tmpFile, DB_FILE);
}

function appendAudit(action, detail, by = 'system') {
  const data = loadData();
  data.audit_log.unshift({
    at: new Date().toISOString(),
    by,
    action,
    detail,
  });
  if (data.audit_log.length > MAX_AUDIT) data.audit_log.length = MAX_AUDIT;
  saveData(data);
}

// ---------- 설정 ----------
function getSettings() {
  const data = loadData();
  return { ...data.settings };
}

function getAlertMinutes() {
  return loadData().settings.alert_minutes || DEFAULT_ALERT_MINUTES;
}

function setAlertMinutes(minutes, changedBy = null) {
  const data = loadData();
  data.settings.alert_minutes = minutes;
  data.settings.last_alert_change = new Date().toISOString();
  data.settings.last_alert_changed_by = changedBy;
  saveData(data);
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
  if (!data.settings.delegated_ids.includes(id)) {
    data.settings.delegated_ids.push(id);
  }
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

// ---------- 출근 ----------
function insertCheckin({ chatId, userId, userName, date, checkinTime }) {
  const data = loadData();
  const id = data.nextId++;
  data.checkins.push({
    id,
    chat_id: chatId,
    user_id: String(userId),
    user_name: userName,
    date,
    checkin_time: checkinTime,
    checkout_time: null,
    status: 'WAITING',
    session: null,
    session_history: [],
  });
  saveData(data);
  return data.checkins.find((c) => c.id === id);
}

function findTodayCheckin(userId, date) {
  const data = loadData();
  return data.checkins.find((c) => c.user_id === String(userId) && c.date === date);
}

function findById(id) {
  const data = loadData();
  return data.checkins.find((c) => c.id === id);
}

function updateCheckinTime(id, checkinTime) {
  const data = loadData();
  const row = data.checkins.find((c) => c.id === id);
  if (!row) return null;
  row.checkin_time = checkinTime;
  saveData(data);
  return row;
}

function deleteCheckin(id) {
  const data = loadData();
  const idx = data.checkins.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const removed = data.checkins.splice(idx, 1)[0];
  saveData(data);
  return removed;
}

// ---------- 세션 ----------
function startSession(id, { startTime, alertMinutes, alertTime }) {
  const data = loadData();
  const row = data.checkins.find((c) => c.id === id);
  if (!row) return null;
  if (row.status === 'IN_SESSION') return 'ALREADY_IN_SESSION';
  if (row.status === 'DONE') return 'ALREADY_DONE';

  row.status = 'IN_SESSION';
  row.session = {
    hour_count: 1,
    start_time: startTime,
    alert_minutes: alertMinutes,
    alert_time: alertTime,
    alert_sent: 0,
  };
  saveData(data);
  return row;
}

function extendSession(id, { alertMinutes, alertTime }) {
  const data = loadData();
  const row = data.checkins.find((c) => c.id === id);
  if (!row || row.status !== 'IN_SESSION') return null;

  row.session.hour_count += 1;
  row.session.alert_minutes = alertMinutes;
  row.session.alert_time = alertTime;
  row.session.alert_sent = 0;
  saveData(data);
  return row;
}

function updateSessionStartTime(id, { startTime, alertMinutes, alertTime }) {
  const data = loadData();
  const row = data.checkins.find((c) => c.id === id);
  if (!row || row.status !== 'IN_SESSION' || !row.session) return null;

  row.session.start_time = startTime;
  row.session.alert_minutes = alertMinutes;
  row.session.alert_time = alertTime;
  row.session.alert_sent = 0;
  saveData(data);
  return row;
}

function endSession(id, endTime) {
  const data = loadData();
  const row = data.checkins.find((c) => c.id === id);
  if (!row || row.status !== 'IN_SESSION') return null;

  row.session_history.push({
    start_time: row.session.start_time,
    end_time: endTime,
    hours: row.session.hour_count,
  });
  row.status = 'WAITING';
  row.session = null;
  saveData(data);
  return row;
}

function setCheckout(id, checkoutTime) {
  const data = loadData();
  const row = data.checkins.find((c) => c.id === id);
  if (!row) return null;
  if (row.status === 'IN_SESSION') return 'IN_SESSION';
  if (row.status === 'DONE') return 'ALREADY';

  row.status = 'DONE';
  row.checkout_time = checkoutTime;
  saveData(data);
  return row;
}

function updateCheckoutTime(id, checkoutTime) {
  const data = loadData();
  const row = data.checkins.find((c) => c.id === id);
  if (!row || row.status !== 'DONE') return null;
  row.checkout_time = checkoutTime;
  saveData(data);
  return row;
}

function markSessionAlertSent(id) {
  const data = loadData();
  const row = data.checkins.find((c) => c.id === id);
  if (row && row.session) {
    row.session.alert_sent = 1;
    saveData(data);
  }
}

function getCheckinsByDate(date) {
  const data = loadData();
  return data.checkins
    .filter((c) => c.date === date)
    .sort((a, b) => new Date(a.checkin_time) - new Date(b.checkin_time));
}

function getPendingSessionAlerts() {
  const data = loadData();
  return data.checkins.filter(
    (c) => c.status === 'IN_SESSION' && c.session && c.session.alert_sent === 0
  );
}

function getAvailableDates() {
  const data = loadData();
  const dates = [...new Set(data.checkins.map((c) => c.date))];
  return dates.sort().reverse().slice(0, 30);
}

function getAllData() {
  return loadData();
}

function replaceSettings(partial) {
  const data = loadData();
  if (partial.alert_minutes != null) {
    data.settings.alert_minutes = partial.alert_minutes;
    data.settings.last_alert_change = new Date().toISOString();
    data.settings.last_alert_changed_by = partial.last_alert_changed_by || 'admin-web';
  }
  if (partial.delegated_ids != null) {
    data.settings.delegated_ids = partial.delegated_ids.map(String);
  }
  if (partial.delegated_labels != null) {
    data.settings.delegated_labels = partial.delegated_labels;
  }
  saveData(data);
  return data.settings;
}

module.exports = {
  DB_FILE,
  getSettings,
  getAlertMinutes,
  setAlertMinutes,
  getDelegatedIds,
  getDelegatedLabels,
  addDelegated,
  removeDelegated,
  isDelegated,
  insertCheckin,
  findTodayCheckin,
  findById,
  updateCheckinTime,
  deleteCheckin,
  startSession,
  extendSession,
  updateSessionStartTime,
  endSession,
  setCheckout,
  updateCheckoutTime,
  markSessionAlertSent,
  getCheckinsByDate,
  getPendingSessionAlerts,
  getAvailableDates,
  getAllData,
  replaceSettings,
  appendAudit,
  DEFAULT_ALERT_MINUTES,
};
