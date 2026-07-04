// 한국 시간(KST, UTC+9) 기준 날짜/시각 처리

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

/** YYYY-MM-DD + HH:MM(KST) → ISO UTC 문자열 */
function parseTimeOnDateKST(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const kstMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0) - 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString();
}

function formatDurationMinutes(startIso, endIso) {
  const mins = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

module.exports = {
  nowKST,
  todayDateStringKST,
  formatTimeKST,
  isValidDateString,
  isValidTimeString,
  parseTimeOnDateKST,
  formatDurationMinutes,
};
