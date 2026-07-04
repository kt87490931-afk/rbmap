// KST 날짜/시각 + 보드용 포맷

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function nowKST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60000);
}

function todayDateStringKST() {
  const d = nowKST();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKST(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function weekdayKST(dateStr) {
  const d = parseDateKST(dateStr);
  return WEEKDAYS[d.getUTCDay()];
}

function formatDateHeader(dateStr, storeName) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const wd = weekdayKST(dateStr);
  return `${m}월 ${d}일(${wd}) ${storeName}`;
}

function formatTimeKST(isoOrDate) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 60 * 60000);
  const hh = String(kst.getHours()).padStart(2, '0');
  const mm = String(kst.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function isValidDateString(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function isValidTimeString(str) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(str);
}

function parseTimeOnDateKST(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const kstMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0) - 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString();
}

function addMinutesIso(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

function addHoursIso(iso, hours) {
  return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
}

module.exports = {
  nowKST,
  todayDateStringKST,
  weekdayKST,
  formatDateHeader,
  formatTimeKST,
  isValidDateString,
  isValidTimeString,
  parseTimeOnDateKST,
  addMinutesIso,
  addHoursIso,
};
