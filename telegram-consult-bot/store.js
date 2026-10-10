const fs = require('fs');
const path = require('path');
const { defaultContent } = require('./default-content');

const DATA_FILE =
  process.env.CONSULT_DATA_PATH || path.join(__dirname, '..', 'data', 'consult', 'consult-data.json');
const MAX_MSG_MAP = 5000;
const MAX_REPORTS = 500;

function initialData() {
  return {
    version: 1,
    content: defaultContent(),
    users: {},
    sessions: {},
    admin_sessions: {},
    msg_map: {},
    msg_map_order: [],
    reports: [],
    next_report_id: 1,
    stats: {
      inquiries: 0,
      reports: 0,
      replies: 0,
      last_start: null,
      last_error: null,
      last_error_at: null,
    },
  };
}

/** 저장 파일에 빠진 키만 기본값으로 채운다 (기존 값은 건드리지 않음) */
function fillMissing(target, defaults) {
  for (const key of Object.keys(defaults)) {
    if (target[key] === undefined || target[key] === null) {
      target[key] = defaults[key];
    } else if (
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key]) &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      fillMissing(target[key], defaults[key]);
    }
  }
}

function normalize(data) {
  fillMissing(data, initialData());
  return data;
}

let data = null;

function save() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

function load() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    data = initialData();
    save();
    return data;
  }
  try {
    data = normalize(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
  } catch (e) {
    console.error('상담봇 데이터 파싱 실패:', e.message);
    fs.copyFileSync(DATA_FILE, `${DATA_FILE}.broken-${Date.now()}.bak`);
    data = initialData();
    save();
  }
  return data;
}

function get() {
  if (!data) load();
  return data;
}

function mapMessage(chatId, messageId, userId) {
  const d = get();
  const key = `${chatId}:${messageId}`;
  d.msg_map[key] = String(userId);
  d.msg_map_order.push(key);
  while (d.msg_map_order.length > MAX_MSG_MAP) {
    delete d.msg_map[d.msg_map_order.shift()];
  }
}

function lookupMessage(chatId, messageId) {
  return get().msg_map[`${chatId}:${messageId}`] || null;
}

function addReport(report) {
  const d = get();
  d.reports.push(report);
  if (d.reports.length > MAX_REPORTS) d.reports.splice(0, d.reports.length - MAX_REPORTS);
}

module.exports = { DATA_FILE, load, get, save, mapMessage, lookupMessage, addReport };
