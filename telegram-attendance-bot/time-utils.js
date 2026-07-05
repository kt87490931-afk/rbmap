// KST 날짜/시각 + 보드용 포맷

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function nowKST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60000);
}

/** 영업일 전환: 15:00 미만이면 전날 영업일 (18:00~익일 15:00 = 같은 영업일) */
const BUSINESS_ROLLOVER_HOUR = 15;

function calendarDateStringKST(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function businessDateStringKST() {
  const d = nowKST();
  if (d.getHours() < BUSINESS_ROLLOVER_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  return calendarDateStringKST(d);
}

function todayDateStringKST() {
  return businessDateStringKST();
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

/** 영업일 + HH:MM → ISO (00:00~14:59는 익일 새벽으로 해석) */
function parseTimeOnBusinessDate(businessDateStr, timeStr) {
  const [hh] = timeStr.split(':').map(Number);
  let calDate = businessDateStr;
  if (hh < BUSINESS_ROLLOVER_HOUR) {
    const [y, m, d] = businessDateStr.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    calDate = calendarDateStringKST(
      new Date(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate())
    );
  }
  return parseTimeOnDateKST(calDate, timeStr);
}

function addMinutesIso(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

function addHoursIso(iso, hours) {
  return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
}

module.exports = {
  nowKST,
  businessDateStringKST,
  todayDateStringKST,
  BUSINESS_ROLLOVER_HOUR,
  weekdayKST,
  formatDateHeader,
  formatTimeKST,
  isValidDateString,
  isValidTimeString,
  parseTimeOnDateKST,
  parseTimeOnBusinessDate,
  addMinutesIso,
  addHoursIso,
};
