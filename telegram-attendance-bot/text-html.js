/** Telegram HTML parse_mode — 동적 텍스트는 escapeHtml 후 사용 */

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function bold(text) {
  return `<b>${escapeHtml(text)}</b>`;
}

const PARSE_MODE_HTML = { parse_mode: 'HTML' };

function htmlOpts(extra = {}) {
  return { ...PARSE_MODE_HTML, ...extra };
}

module.exports = { escapeHtml, bold, PARSE_MODE_HTML, htmlOpts };
