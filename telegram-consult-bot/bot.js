const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production'), override: true });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true });
require('dotenv').config({ override: true });

const TelegramBot = require('node-telegram-bot-api');
const store = require('./store');

const TOKEN = process.env.CONSULT_BOT_TOKEN || '';
const ADMIN_IDS = (process.env.CONSULT_ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const ACK_COOLDOWN_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const ERROR_SAVE_INTERVAL_MS = 60 * 1000;
const NONE_WORDS = /^(없음|없어요|없습니다|x|X|❌|no|NO|패스|스킵)$/;

const TEXT_ITEMS = {
  welcome: {
    title: '👋 환영 문구 (/start)',
    get: (c) => c.welcome,
    set: (c, v) => {
      c.welcome = v;
    },
  },
  inquiry: {
    title: '💬 문의 안내 문구',
    get: (c) => c.inquiry_prompt,
    set: (c, v) => {
      c.inquiry_prompt = v;
    },
  },
  ack: {
    title: '✅ 문의 접수 자동답장',
    get: (c) => c.ack,
    set: (c, v) => {
      c.ack = v;
    },
  },
  rintro: {
    title: '🚨 피해접수 시작 문구',
    get: (c) => c.report.intro,
    set: (c, v) => {
      c.report.intro = v;
    },
  },
  rdone: {
    title: '🎉 피해접수 완료 문구',
    get: (c) => c.report.done,
    set: (c, v) => {
      c.report.done = v;
    },
  },
};

const LABEL_ITEMS = {
  report: '피해 접수 버튼',
  inquiry: '문의 남기기 버튼',
  home: '처음으로 버튼',
};

const TYPE_LABELS = { text: '글 입력형', choice: '선택형', media: '사진 첨부형' };

if (!TOKEN) {
  console.error('[consult-bot] CONSULT_BOT_TOKEN 미설정 — 대기 모드. .env.production 에 토큰 추가 후 pm2 restart consult-bot');
  setInterval(() => {}, 60 * 60 * 1000);
} else {
  start();
}

function start() {
  const data = store.load();
  data.stats.last_start = new Date().toISOString();
  store.save();

  const bot = new TelegramBot(TOKEN, { polling: true });
  let lastErrorSavedAt = 0;
  let lastErrorLoggedAt = 0;

  // ───────── 공통 도우미 ─────────

  const content = () => store.get().content;
  const isAdmin = (userId) => ADMIN_IDS.includes(String(userId));
  const nowKst = () => new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });

  function richFromMsg(msg) {
    const text = msg.text || msg.caption || '';
    const entities = msg.entities || msg.caption_entities;
    return entities && entities.length ? { text, entities } : { text };
  }

  async function sendRich(chatId, rich, extra = {}) {
    const text = rich && rich.text ? rich.text : '(내용 없음)';
    const opts = { ...extra };
    if (rich && rich.entities && rich.entities.length) opts.entities = rich.entities;
    try {
      return await bot.sendMessage(chatId, text, opts);
    } catch (err) {
      if (!opts.entities) throw err;
      delete opts.entities;
      return bot.sendMessage(chatId, text, opts);
    }
  }

  function send(chatId, text, extra = {}) {
    return bot.sendMessage(chatId, text, extra).catch((err) => {
      console.error('[consult-bot] 전송 실패:', chatId, err.message);
      return null;
    });
  }

  function userLabel(from) {
    const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || '(이름 없음)';
    const un = from.username ? ` @${from.username}` : '';
    return `${name}${un} (ID ${from.id})`;
  }

  function rememberUser(from) {
    if (!from) return null;
    const d = store.get();
    const id = String(from.id);
    const u = d.users[id] || { first_seen: new Date().toISOString(), blocked: false, last_ack: 0 };
    u.name = [from.first_name, from.last_name].filter(Boolean).join(' ');
    u.username = from.username || null;
    u.last_seen = new Date().toISOString();
    d.users[id] = u;
    return u;
  }

  function recordError(err) {
    const d = store.get();
    const msg = err && err.message ? err.message : String(err);
    d.stats.last_error = msg.slice(0, 300);
    d.stats.last_error_at = new Date().toISOString();
    const now = Date.now();
    if (now - lastErrorSavedAt > ERROR_SAVE_INTERVAL_MS) {
      lastErrorSavedAt = now;
      store.save();
    }
  }

  // ───────── 고객 화면 ─────────

  function homeKeyboard() {
    return { inline_keyboard: [[{ text: content().labels.home, callback_data: 'home' }]] };
  }

  function mainMenuKeyboard() {
    const c = content();
    const rows = [];
    for (let i = 0; i < c.faqs.length; i += 2) {
      rows.push(c.faqs.slice(i, i + 2).map((f) => ({ text: f.label, callback_data: `faq:${f.id}` })));
    }
    rows.push([{ text: c.labels.report, callback_data: 'rep:start' }]);
    rows.push([{ text: c.labels.inquiry, callback_data: 'inq' }]);
    return { inline_keyboard: rows };
  }

  async function sendMainMenu(chatId) {
    await sendRich(chatId, content().welcome, { reply_markup: mainMenuKeyboard() });
  }

  // ───────── 피해 접수 흐름 ─────────

  function getSession(userId) {
    const d = store.get();
    const sess = d.sessions[String(userId)];
    if (!sess) return null;
    if (Date.now() - new Date(sess.started_at).getTime() > SESSION_TTL_MS) {
      delete d.sessions[String(userId)];
      store.save();
      return null;
    }
    return sess;
  }

  function clearSession(userId) {
    const d = store.get();
    if (d.sessions[String(userId)]) {
      delete d.sessions[String(userId)];
      store.save();
    }
  }

  function currentQuestion(sess) {
    const qid = sess.qids[sess.step];
    const q = content().report.questions.find((x) => x.id === qid);
    if (q) return q;
    return { id: qid, name: sess.qnames[qid] || qid, type: 'text', prompt: { text: `${sess.qnames[qid] || qid}을(를) 입력해주세요` } };
  }

  async function startReport(chatId, userId) {
    const questions = content().report.questions;
    if (questions.length === 0) {
      await send(chatId, '현재 피해 접수 질문이 설정되어 있지 않습니다. 문의 남기기를 이용해주세요.', {
        reply_markup: mainMenuKeyboard(),
      });
      return;
    }
    const d = store.get();
    const qnames = {};
    for (const q of questions) qnames[q.id] = q.name;
    d.sessions[String(userId)] = {
      mode: 'report',
      step: 0,
      qids: questions.map((q) => q.id),
      qnames,
      answers: {},
      media: [],
      last_group: null,
      started_at: new Date().toISOString(),
    };
    store.save();
    await sendRich(chatId, content().report.intro);
    await askQuestion(chatId, userId);
  }

  function questionKeyboard(sess, q) {
    const rows = [];
    if (q.type === 'choice') {
      const opts = q.options || [];
      for (let i = 0; i < opts.length; i += 2) {
        rows.push(
          opts.slice(i, i + 2).map((label, j) => ({ text: label, callback_data: `ans:${q.id}:${i + j}` })),
        );
      }
    }
    if (q.type === 'media') {
      rows.push([
        { text: '✅ 다음', callback_data: `med:next:${q.id}` },
        { text: '❌ 첨부 없음', callback_data: `med:none:${q.id}` },
      ]);
    }
    const nav = [];
    if (sess.step > 0) nav.push({ text: '⬅️ 이전', callback_data: 'rep:back' });
    nav.push({ text: '❌ 접수 취소', callback_data: 'rep:cancel' });
    rows.push(nav);
    return { inline_keyboard: rows };
  }

  async function askQuestion(chatId, userId) {
    const sess = getSession(userId);
    if (!sess) return;
    if (sess.step >= sess.qids.length) {
      await finishReport(chatId, userId);
      return;
    }
    const q = currentQuestion(sess);
    sess.last_group = null;
    store.save();
    await sendRich(chatId, q.prompt, { reply_markup: questionKeyboard(sess, q) });
  }

  async function advance(chatId, userId) {
    const sess = getSession(userId);
    if (!sess) return;
    sess.step += 1;
    store.save();
    await askQuestion(chatId, userId);
  }

  function extractMedia(msg) {
    if (msg.photo && msg.photo.length) return { type: 'photo', file_id: msg.photo[msg.photo.length - 1].file_id };
    if (msg.video) return { type: 'video', file_id: msg.video.file_id };
    if (msg.document) return { type: 'document', file_id: msg.document.file_id };
    return null;
  }

  async function handleReportInput(msg, sess) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const q = currentQuestion(sess);
    const media = extractMedia(msg);

    if (q.type === 'media') {
      if (media) {
        sess.media.push({ ...media, q: q.id });
        const firstOfGroup = !msg.media_group_id || msg.media_group_id !== sess.last_group;
        sess.last_group = msg.media_group_id || null;
        store.save();
        if (firstOfGroup) {
          await send(chatId, '📎 받았습니다. 더 보내시거나 [✅ 다음]을 눌러주세요.', {
            reply_markup: questionKeyboard(sess, q),
          });
        }
        return;
      }
      if (msg.text && NONE_WORDS.test(msg.text.trim())) {
        await advance(chatId, userId);
        return;
      }
      await send(chatId, '📎 사진을 보내주시거나 [✅ 다음] / [❌ 첨부 없음]을 눌러주세요.', {
        reply_markup: questionKeyboard(sess, q),
      });
      return;
    }

    if (media) {
      sess.media.push({ ...media, q: q.id });
      sess.answers[q.id] = msg.caption ? `${msg.caption} (첨부 있음)` : '(사진 첨부)';
      store.save();
      await advance(chatId, userId);
      return;
    }
    if (!msg.text) {
      await send(chatId, '✏️ 글로 입력해주세요.', { reply_markup: questionKeyboard(sess, q) });
      return;
    }
    sess.answers[q.id] = msg.text.trim();
    store.save();
    await advance(chatId, userId);
  }

  async function finishReport(chatId, userId) {
    const d = store.get();
    const sess = getSession(userId);
    if (!sess) return;
    const reportId = d.next_report_id++;
    const user = d.users[String(userId)] || {};
    const pairs = sess.qids.map((qid) => {
      const q = content().report.questions.find((x) => x.id === qid);
      const name = (q && q.name) || sess.qnames[qid] || qid;
      const type = (q && q.type) || 'text';
      const mediaCount = sess.media.filter((m) => m.q === qid).length;
      let value;
      if (type === 'media') value = mediaCount ? `${mediaCount}개 첨부` : '첨부 없음';
      else value = sess.answers[qid] || '(미입력)';
      return { qid, name, value };
    });

    store.addReport({
      id: reportId,
      user_id: String(userId),
      user_name: user.name || '',
      username: user.username || null,
      created_at: new Date().toISOString(),
      answers: pairs,
      media_count: sess.media.length,
    });
    d.stats.reports += 1;
    const media = sess.media;
    delete d.sessions[String(userId)];
    store.save();

    await sendRich(chatId, content().report.done, { reply_markup: homeKeyboard() });

    const unLine = user.username ? ` @${user.username}` : '';
    const lines = [
      `🚨 새 피해 접수 #${reportId}`,
      `👤 ${user.name || '(이름 없음)'}${unLine} (ID ${userId})`,
      `🕒 ${nowKst()}`,
      '━━━━━━━━━━━━━━',
      ...pairs.map((p) => `▪️ ${p.name}: ${p.value}`),
      '━━━━━━━━━━━━━━',
      '↩️ 이 메시지에 답장하면 고객에게 전달됩니다.',
    ];
    await notifyAdmins(userId, lines.join('\n'), media, reportId);
  }

  async function notifyAdmins(userId, summary, media, reportId) {
    if (ADMIN_IDS.length === 0) {
      console.warn('[consult-bot] CONSULT_ADMIN_IDS 미설정 — 접수 내용을 전달할 관리자가 없습니다.');
      return;
    }
    const qnames = {};
    for (const q of content().report.questions) qnames[q.id] = q.name;

    for (const adminId of ADMIN_IDS) {
      try {
        const m = await bot.sendMessage(adminId, summary);
        store.mapMessage(adminId, m.message_id, userId);

        const visual = media.filter((x) => x.type === 'photo' || x.type === 'video');
        for (let i = 0; i < visual.length; i += 10) {
          const chunk = visual.slice(i, i + 10).map((x, j) => ({
            type: x.type,
            media: x.file_id,
            ...(j === 0 ? { caption: `#${reportId} 첨부 (${i + 1}~${i + Math.min(10, visual.length - i)})` } : {}),
          }));
          const sent = await bot.sendMediaGroup(adminId, chunk);
          for (const s of sent) store.mapMessage(adminId, s.message_id, userId);
        }
        for (const doc of media.filter((x) => x.type === 'document')) {
          const s = await bot.sendDocument(adminId, doc.file_id, {
            caption: `#${reportId} ${qnames[doc.q] || '첨부 파일'}`,
          });
          store.mapMessage(adminId, s.message_id, userId);
        }
      } catch (err) {
        console.error(`[consult-bot] 관리자(${adminId}) 전달 실패:`, err.message);
        recordError(err);
      }
    }
    store.save();
  }

  // ───────── 일반 문의 전달 ─────────

  async function handleInquiry(msg) {
    const d = store.get();
    const userId = msg.from.id;
    const header = `💬 문의 | ${userLabel(msg.from)}`;
    d.stats.inquiries += 1;

    if (ADMIN_IDS.length === 0) {
      console.warn('[consult-bot] CONSULT_ADMIN_IDS 미설정 — 문의를 전달할 관리자가 없습니다.');
    }

    const canCaption = Boolean(msg.photo || msg.video || msg.document || msg.audio || msg.animation || msg.voice);
    for (const adminId of ADMIN_IDS) {
      try {
        if (msg.text) {
          const m = await bot.sendMessage(adminId, `${header}\n━━━━━━━━━━━━━━\n${msg.text}`);
          store.mapMessage(adminId, m.message_id, userId);
        } else if (canCaption) {
          const caption = msg.caption ? `${header}\n\n${msg.caption}` : header;
          const m = await bot.copyMessage(adminId, msg.chat.id, msg.message_id, { caption: caption.slice(0, 1024) });
          store.mapMessage(adminId, m.message_id, userId);
        } else {
          const h = await bot.sendMessage(adminId, header);
          store.mapMessage(adminId, h.message_id, userId);
          const m = await bot.copyMessage(adminId, msg.chat.id, msg.message_id);
          store.mapMessage(adminId, m.message_id, userId);
        }
      } catch (err) {
        console.error(`[consult-bot] 관리자(${adminId}) 문의 전달 실패:`, err.message);
        recordError(err);
      }
    }

    const u = d.users[String(userId)];
    const now = Date.now();
    if (u && now - (u.last_ack || 0) > ACK_COOLDOWN_MS) {
      u.last_ack = now;
      store.save();
      await sendRich(msg.chat.id, content().ack, { reply_markup: homeKeyboard() }).catch(() => {});
    } else {
      store.save();
    }
  }

  // ───────── 관리자: 고객에게 답장 ─────────

  async function handleAdminReply(msg, targetUserId) {
    const d = store.get();
    const text = (msg.text || '').trim();
    if (/^\/(block|차단)(?:@\w+)?$/.test(text)) {
      const u = d.users[targetUserId] || {};
      u.blocked = true;
      d.users[targetUserId] = u;
      store.save();
      await send(msg.chat.id, `⛔ 차단했습니다 (ID ${targetUserId}). 해제: 같은 메시지에 /unblock 답장`);
      return;
    }
    if (/^\/(unblock|차단해제)(?:@\w+)?$/.test(text)) {
      if (d.users[targetUserId]) d.users[targetUserId].blocked = false;
      store.save();
      await send(msg.chat.id, `✅ 차단을 해제했습니다 (ID ${targetUserId}).`);
      return;
    }
    try {
      await bot.copyMessage(targetUserId, msg.chat.id, msg.message_id);
      d.stats.replies += 1;
      store.save();
      await send(msg.chat.id, '✅ 고객에게 전달했습니다.', { reply_to_message_id: msg.message_id });
    } catch (err) {
      recordError(err);
      const code = err.response && err.response.statusCode;
      const reason =
        code === 403 ? '고객이 봇을 차단했거나 대화방을 삭제했습니다.' : `오류: ${err.message}`;
      await send(msg.chat.id, `❌ 전달하지 못했습니다. ${reason}`, { reply_to_message_id: msg.message_id });
    }
  }

  // ───────── 관리자 메뉴 (문구 수정) ─────────

  function setAdminSession(adminId, sess) {
    const d = store.get();
    if (sess) d.admin_sessions[String(adminId)] = sess;
    else delete d.admin_sessions[String(adminId)];
    store.save();
  }

  function getAdminSession(adminId) {
    return store.get().admin_sessions[String(adminId)] || null;
  }

  function adminMenuKeyboard() {
    return {
      inline_keyboard: [
        [{ text: TEXT_ITEMS.welcome.title, callback_data: 'a:t:welcome' }],
        [{ text: '📋 자동응답 버튼 관리', callback_data: 'a:faqs' }],
        [{ text: '🚨 피해접수 질문 관리', callback_data: 'a:qs' }],
        [{ text: TEXT_ITEMS.rintro.title, callback_data: 'a:t:rintro' }],
        [{ text: TEXT_ITEMS.rdone.title, callback_data: 'a:t:rdone' }],
        [{ text: TEXT_ITEMS.inquiry.title, callback_data: 'a:t:inquiry' }],
        [{ text: TEXT_ITEMS.ack.title, callback_data: 'a:t:ack' }],
        [{ text: '🔤 기본 버튼 이름', callback_data: 'a:labels' }],
        [
          { text: '👀 고객 화면 보기', callback_data: 'a:preview' },
          { text: '📊 상태', callback_data: 'a:status' },
        ],
      ],
    };
  }

  async function sendAdminMenu(chatId) {
    await send(
      chatId,
      [
        '🛠 상담봇 관리자 메뉴',
        '',
        '수정할 항목을 선택하세요.',
        '문구는 굵게·기울임 등 텔레그램 서식까지 그대로 저장됩니다.',
        '',
        '↩️ 고객 답장: 전달된 메시지에 「답장」으로 보내기',
        '⛔ 차단: 전달된 메시지에 /block 답장 (해제 /unblock)',
        '❎ 입력 취소: /cancel',
      ].join('\n'),
      { reply_markup: adminMenuKeyboard() },
    );
  }

  const backToMenu = (cb = 'a:menu') => [{ text: '◀️ 돌아가기', callback_data: cb }];

  async function sendFaqList(chatId) {
    const faqs = content().faqs;
    const rows = faqs.map((f, i) => [{ text: `${i + 1}. ${f.label}`, callback_data: `a:f:${f.id}` }]);
    rows.push([{ text: '➕ 버튼 추가', callback_data: 'a:fadd' }]);
    rows.push(backToMenu());
    await send(
      chatId,
      faqs.length
        ? '📋 자동응답 버튼 목록\n\n수정할 버튼을 선택하세요.'
        : '📋 자동응답 버튼이 아직 없습니다.\n[➕ 버튼 추가]로 만들어주세요.',
      { reply_markup: { inline_keyboard: rows } },
    );
  }

  async function sendFaqItem(chatId, faqId) {
    const f = content().faqs.find((x) => x.id === faqId);
    if (!f) {
      await sendFaqList(chatId);
      return;
    }
    await send(chatId, `📋 버튼: ${f.label}\n\n아래는 현재 답변입니다 ⬇️`);
    await sendRich(chatId, f.answer, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✏️ 버튼 이름', callback_data: `a:fl:${f.id}` },
            { text: '✏️ 답변 문구', callback_data: `a:fa:${f.id}` },
          ],
          [
            { text: '⬆️ 위로', callback_data: `a:fu:${f.id}` },
            { text: '🗑 삭제', callback_data: `a:fd:${f.id}` },
          ],
          backToMenu('a:faqs'),
        ],
      },
    });
  }

  async function sendQuestionList(chatId) {
    const qs = content().report.questions;
    const rows = qs.map((q, i) => [
      { text: `${i + 1}. ${q.name} (${TYPE_LABELS[q.type] || q.type})`, callback_data: `a:q:${q.id}` },
    ]);
    rows.push([{ text: '➕ 질문 추가', callback_data: 'a:qadd' }]);
    rows.push(backToMenu());
    await send(chatId, '🚨 피해접수 질문 목록 (위에서부터 순서대로 물어봅니다)', {
      reply_markup: { inline_keyboard: rows },
    });
  }

  async function sendQuestionItem(chatId, qid) {
    const q = content().report.questions.find((x) => x.id === qid);
    if (!q) {
      await sendQuestionList(chatId);
      return;
    }
    const info = [`🚨 질문: ${q.name}`, `종류: ${TYPE_LABELS[q.type] || q.type}`];
    if (q.type === 'choice') info.push(`선택지: ${(q.options || []).join(', ') || '(없음)'}`);
    info.push('', '아래는 고객에게 보이는 질문 문구입니다 ⬇️');
    await send(chatId, info.join('\n'));
    const rows = [
      [
        { text: '✏️ 질문 문구', callback_data: `a:qp:${q.id}` },
        { text: '✏️ 요약 이름', callback_data: `a:qn:${q.id}` },
      ],
    ];
    if (q.type === 'choice') rows.push([{ text: '✏️ 선택지', callback_data: `a:qo:${q.id}` }]);
    rows.push([
      { text: '⬆️ 위로', callback_data: `a:qu:${q.id}` },
      { text: '🗑 삭제', callback_data: `a:qd:${q.id}` },
    ]);
    rows.push(backToMenu('a:qs'));
    await sendRich(chatId, q.prompt, { reply_markup: { inline_keyboard: rows } });
  }

  async function askAdminInput(chatId, adminId, sess, guide) {
    setAdminSession(adminId, sess);
    await send(chatId, `${guide}\n\n(취소: /cancel)`);
  }

  function moveUp(list, id) {
    const i = list.findIndex((x) => x.id === id);
    if (i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
  }

  function parseOptions(text) {
    return text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  async function handleAdminCallback(q) {
    const chatId = q.message.chat.id;
    const adminId = q.from.id;
    const parts = q.data.split(':');
    const action = parts[1];
    const id = parts[2];
    const c = content();

    switch (action) {
      case 'menu':
        setAdminSession(adminId, null);
        return sendAdminMenu(chatId);
      case 't': {
        const item = TEXT_ITEMS[id];
        if (!item) return sendAdminMenu(chatId);
        await send(chatId, `${item.title}\n\n아래는 현재 문구입니다 ⬇️`);
        await sendRich(chatId, item.get(c));
        return askAdminInput(chatId, adminId, { action: 'set_text', key: id }, '✏️ 바꿀 새 문구를 보내주세요.');
      }
      case 'labels': {
        const rows = Object.keys(LABEL_ITEMS).map((k) => [
          { text: `${LABEL_ITEMS[k]}: ${c.labels[k]}`, callback_data: `a:l:${k}` },
        ]);
        rows.push(backToMenu());
        return send(chatId, '🔤 바꿀 버튼을 선택하세요.', { reply_markup: { inline_keyboard: rows } });
      }
      case 'l':
        if (!LABEL_ITEMS[id]) return sendAdminMenu(chatId);
        return askAdminInput(
          chatId,
          adminId,
          { action: 'set_label', key: id },
          `✏️ ${LABEL_ITEMS[id]}의 새 이름을 보내주세요.\n현재: ${c.labels[id]}`,
        );
      case 'faqs':
        setAdminSession(adminId, null);
        return sendFaqList(chatId);
      case 'f':
        return sendFaqItem(chatId, id);
      case 'fadd':
        return askAdminInput(chatId, adminId, { action: 'faq_add_label' }, '➕ 새 버튼 이름을 보내주세요.\n(예: ⏰ 운영시간)');
      case 'fl':
        return askAdminInput(chatId, adminId, { action: 'faq_label', id }, '✏️ 새 버튼 이름을 보내주세요.');
      case 'fa':
        return askAdminInput(chatId, adminId, { action: 'faq_answer', id }, '✏️ 새 답변 문구를 보내주세요.');
      case 'fu':
        moveUp(c.faqs, id);
        store.save();
        return sendFaqList(chatId);
      case 'fd':
        return send(chatId, '🗑 이 버튼을 삭제할까요?', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '삭제', callback_data: `a:fdy:${id}` },
                { text: '취소', callback_data: `a:f:${id}` },
              ],
            ],
          },
        });
      case 'fdy':
        c.faqs = c.faqs.filter((x) => x.id !== id);
        store.save();
        await send(chatId, '🗑 삭제했습니다.');
        return sendFaqList(chatId);
      case 'qs':
        setAdminSession(adminId, null);
        return sendQuestionList(chatId);
      case 'q':
        return sendQuestionItem(chatId, id);
      case 'qadd':
        return send(chatId, '➕ 추가할 질문 종류를 선택하세요.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✏️ 글 입력형 (이름, 계좌 등)', callback_data: 'a:qt:text' }],
              [{ text: '🔘 선택형 (버튼으로 고르기)', callback_data: 'a:qt:choice' }],
              [{ text: '📎 사진 첨부형', callback_data: 'a:qt:media' }],
              backToMenu('a:qs'),
            ],
          },
        });
      case 'qt':
        if (!TYPE_LABELS[id]) return sendQuestionList(chatId);
        return askAdminInput(
          chatId,
          adminId,
          { action: 'q_add_name', type: id },
          '✏️ 질문의 요약 이름을 보내주세요.\n관리자에게 오는 접수 요약에 표시됩니다. (예: 피해 금액)',
        );
      case 'qp':
        return askAdminInput(chatId, adminId, { action: 'q_prompt', id }, '✏️ 고객에게 보일 새 질문 문구를 보내주세요.');
      case 'qn':
        return askAdminInput(chatId, adminId, { action: 'q_name', id }, '✏️ 새 요약 이름을 보내주세요.');
      case 'qo':
        return askAdminInput(
          chatId,
          adminId,
          { action: 'q_options', id },
          '✏️ 선택지를 쉼표(,)나 줄바꿈으로 구분해서 보내주세요.\n(예: 보이스피싱, 토토사이트, 카지노사이트)',
        );
      case 'qu':
        moveUp(c.report.questions, id);
        store.save();
        return sendQuestionList(chatId);
      case 'qd':
        return send(chatId, '🗑 이 질문을 삭제할까요?', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '삭제', callback_data: `a:qdy:${id}` },
                { text: '취소', callback_data: `a:q:${id}` },
              ],
            ],
          },
        });
      case 'qdy':
        c.report.questions = c.report.questions.filter((x) => x.id !== id);
        store.save();
        await send(chatId, '🗑 삭제했습니다.');
        return sendQuestionList(chatId);
      case 'preview':
        await send(chatId, '👀 고객이 /start 했을 때 보는 화면입니다 ⬇️');
        return sendMainMenu(chatId);
      case 'status': {
        const d = store.get();
        const users = Object.values(d.users);
        const lines = [
          '📊 상담봇 상태',
          '',
          `실행 시작: ${d.stats.last_start ? new Date(d.stats.last_start).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) : '-'}`,
          `관리자 수: ${ADMIN_IDS.length}명`,
          `방문 고객: ${users.length}명 (차단 ${users.filter((u) => u.blocked).length}명)`,
          `문의 메시지: ${d.stats.inquiries}건`,
          `피해 접수: ${d.stats.reports}건`,
          `관리자 답장: ${d.stats.replies}건`,
          `진행 중인 접수: ${Object.keys(d.sessions).length}건`,
          '',
          `마지막 오류: ${d.stats.last_error ? `${d.stats.last_error} (${new Date(d.stats.last_error_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })})` : '없음'}`,
        ];
        return send(chatId, lines.join('\n'), { reply_markup: { inline_keyboard: [backToMenu()] } });
      }
      default:
        return sendAdminMenu(chatId);
    }
  }

  /** 관리자가 입력 대기 상태에서 보낸 메시지 처리. 처리했으면 true */
  async function handleAdminInput(msg) {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;
    const sess = getAdminSession(adminId);
    if (!sess) return false;
    if (!msg.text) {
      await send(chatId, '✏️ 글로 보내주세요. (취소: /cancel)');
      return true;
    }
    const c = content();
    const value = richFromMsg(msg);
    const plain = msg.text.trim();

    switch (sess.action) {
      case 'set_text':
        TEXT_ITEMS[sess.key].set(c, value);
        store.save();
        setAdminSession(adminId, null);
        await send(chatId, '✅ 저장했습니다. 고객에게 이렇게 보입니다 ⬇️');
        await sendRich(chatId, value, { reply_markup: { inline_keyboard: [backToMenu()] } });
        return true;
      case 'set_label':
        c.labels[sess.key] = plain.slice(0, 40);
        store.save();
        setAdminSession(adminId, null);
        await send(chatId, `✅ 저장했습니다: ${c.labels[sess.key]}`, { reply_markup: { inline_keyboard: [backToMenu('a:labels')] } });
        return true;
      case 'faq_add_label':
        setAdminSession(adminId, { action: 'faq_add_answer', label: plain.slice(0, 40) });
        await send(chatId, `버튼 이름: ${plain.slice(0, 40)}\n\n✏️ 이제 이 버튼을 누르면 나갈 답변 문구를 보내주세요.\n(취소: /cancel)`);
        return true;
      case 'faq_add_answer': {
        const fid = `f${c.next_faq_id++}`;
        c.faqs.push({ id: fid, label: sess.label, answer: value });
        store.save();
        setAdminSession(adminId, null);
        await send(chatId, '✅ 버튼을 추가했습니다.');
        await sendFaqItem(chatId, fid);
        return true;
      }
      case 'faq_label':
      case 'faq_answer': {
        const f = c.faqs.find((x) => x.id === sess.id);
        setAdminSession(adminId, null);
        if (!f) {
          await send(chatId, '이미 삭제된 버튼입니다.');
          return true;
        }
        if (sess.action === 'faq_label') f.label = plain.slice(0, 40);
        else f.answer = value;
        store.save();
        await send(chatId, '✅ 저장했습니다.');
        await sendFaqItem(chatId, f.id);
        return true;
      }
      case 'q_add_name':
        setAdminSession(adminId, { action: 'q_add_prompt', type: sess.type, name: plain.slice(0, 40) });
        await send(chatId, `요약 이름: ${plain.slice(0, 40)}\n\n✏️ 이제 고객에게 보일 질문 문구를 보내주세요.\n(취소: /cancel)`);
        return true;
      case 'q_add_prompt':
        if (sess.type === 'choice') {
          setAdminSession(adminId, { action: 'q_add_options', type: sess.type, name: sess.name, prompt: value });
          await send(chatId, '✏️ 선택지를 쉼표(,)나 줄바꿈으로 구분해서 보내주세요.\n(예: 보이스피싱, 토토사이트)\n(취소: /cancel)');
          return true;
        }
      // falls through
      case 'q_add_options': {
        const qid = `q${c.report.next_q_id++}`;
        const prompt = sess.action === 'q_add_prompt' ? value : sess.prompt;
        const nq = { id: qid, name: sess.name, type: sess.type, prompt };
        if (sess.type === 'choice') nq.options = parseOptions(plain);
        c.report.questions.push(nq);
        store.save();
        setAdminSession(adminId, null);
        await send(chatId, '✅ 질문을 맨 뒤에 추가했습니다. [⬆️ 위로]로 순서를 바꿀 수 있습니다.');
        await sendQuestionItem(chatId, qid);
        return true;
      }
      case 'q_prompt':
      case 'q_name':
      case 'q_options': {
        const qq = c.report.questions.find((x) => x.id === sess.id);
        setAdminSession(adminId, null);
        if (!qq) {
          await send(chatId, '이미 삭제된 질문입니다.');
          return true;
        }
        if (sess.action === 'q_prompt') qq.prompt = value;
        else if (sess.action === 'q_name') qq.name = plain.slice(0, 40);
        else qq.options = parseOptions(plain);
        store.save();
        await send(chatId, '✅ 저장했습니다.');
        await sendQuestionItem(chatId, qq.id);
        return true;
      }
      default:
        setAdminSession(adminId, null);
        return false;
    }
  }

  // ───────── 명령어 ─────────

  bot.onText(/^\/start(?:@\w+)?(?:\s+.*)?$/, async (msg) => {
    if (msg.chat.type !== 'private') return;
    rememberUser(msg.from);
    clearSession(msg.from.id);
    if (isAdmin(msg.from.id)) setAdminSession(msg.from.id, null);
    await sendMainMenu(msg.chat.id).catch((err) => console.error('[consult-bot] /start 실패:', err.message));
    if (isAdmin(msg.from.id)) await send(msg.chat.id, '🛠 관리자 메뉴: /admin');
  });

  bot.onText(/^\/(?:id|내id|내ID|내아이디)(?:@\w+)?$/i, async (msg) => {
    if (msg.chat.type !== 'private') return;
    const u = msg.from;
    await send(
      msg.chat.id,
      [
        '🆔 본인 텔레그램 ID',
        '',
        `숫자 ID: ${u.id}`,
        u.username ? `사용자명: @${u.username}` : '사용자명: (미설정)',
        '',
        isAdmin(u.id) ? '✅ 관리자로 등록되어 있습니다.' : '관리자 등록이 필요하면 위 숫자 ID를 서버 설정에 넣어주세요.',
      ].join('\n'),
    );
  });

  bot.onText(/^\/(?:admin|관리)(?:@\w+)?$/, async (msg) => {
    if (msg.chat.type !== 'private') return;
    if (!isAdmin(msg.from.id)) {
      await send(msg.chat.id, '⛔ 관리자만 사용할 수 있습니다.');
      return;
    }
    setAdminSession(msg.from.id, null);
    await sendAdminMenu(msg.chat.id);
  });

  bot.onText(/^\/(?:cancel|취소)(?:@\w+)?$/, async (msg) => {
    if (msg.chat.type !== 'private') return;
    clearSession(msg.from.id);
    if (isAdmin(msg.from.id)) setAdminSession(msg.from.id, null);
    await send(msg.chat.id, '❎ 취소했습니다.', { reply_markup: homeKeyboard() });
  });

  const COMMAND_RE = /^\/(?:start|id|내id|내아이디|admin|관리|cancel|취소)(?:@\w+)?(?:\s|$)/i;

  // ───────── 메시지 / 버튼 처리 ─────────

  bot.on('message', async (msg) => {
    try {
      if (msg.chat.type !== 'private' || !msg.from || msg.from.is_bot) return;
      const text = msg.text || '';
      if (COMMAND_RE.test(text)) return;
      const u = rememberUser(msg.from);
      const userId = msg.from.id;

      if (isAdmin(userId)) {
        if (msg.reply_to_message) {
          const target = store.lookupMessage(msg.chat.id, msg.reply_to_message.message_id);
          if (target) {
            await handleAdminReply(msg, target);
            return;
          }
        }
        if (await handleAdminInput(msg)) return;
        const sess = getSession(userId);
        if (sess) {
          await handleReportInput(msg, sess);
          return;
        }
        if (/^\/(block|unblock|차단|차단해제)/.test(text)) {
          await send(msg.chat.id, '⛔ 차단/해제는 고객에게서 온 메시지에 「답장」으로 보내야 합니다.');
          return;
        }
        await send(
          msg.chat.id,
          '↩️ 고객에게 답장하려면 전달된 고객 메시지를 길게 눌러 「답장」으로 보내주세요.\n🛠 관리자 메뉴: /admin',
        );
        store.save();
        return;
      }

      if (u && u.blocked) return;

      const sess = getSession(userId);
      if (sess) {
        await handleReportInput(msg, sess);
        return;
      }
      if (text.startsWith('/')) {
        await sendMainMenu(msg.chat.id);
        store.save();
        return;
      }
      await handleInquiry(msg);
    } catch (err) {
      console.error('[consult-bot] 메시지 처리 오류:', err);
      recordError(err);
    }
  });

  bot.on('callback_query', async (q) => {
    const data = q.data || '';
    const chatId = q.message && q.message.chat.id;
    const userId = q.from.id;
    try {
      await bot.answerCallbackQuery(q.id).catch(() => {});
      if (!chatId || q.message.chat.type !== 'private') return;
      const u = rememberUser(q.from);

      if (data.startsWith('a:')) {
        if (!isAdmin(userId)) return;
        await handleAdminCallback(q);
        return;
      }
      if (u && u.blocked && !isAdmin(userId)) return;

      if (data === 'home') {
        clearSession(userId);
        await sendMainMenu(chatId);
        return;
      }
      if (data === 'inq') {
        clearSession(userId);
        await sendRich(chatId, content().inquiry_prompt, { reply_markup: homeKeyboard() });
        return;
      }
      if (data.startsWith('faq:')) {
        const f = content().faqs.find((x) => x.id === data.slice(4));
        if (!f) {
          await send(chatId, '삭제된 항목입니다.');
          await sendMainMenu(chatId);
          return;
        }
        await sendRich(chatId, f.answer, { reply_markup: homeKeyboard() });
        return;
      }
      if (data === 'rep:start') {
        await startReport(chatId, userId);
        return;
      }
      if (data === 'rep:cancel') {
        clearSession(userId);
        await send(chatId, '❎ 피해 접수를 취소했습니다.', { reply_markup: homeKeyboard() });
        return;
      }

      const sess = getSession(userId);
      if (!sess) {
        await send(chatId, '진행 중인 접수가 없습니다. 처음부터 다시 시작해주세요.', { reply_markup: homeKeyboard() });
        return;
      }
      const cur = currentQuestion(sess);

      if (data === 'rep:back') {
        if (sess.step > 0) {
          sess.step -= 1;
          store.save();
        }
        await askQuestion(chatId, userId);
        return;
      }
      if (data.startsWith('ans:')) {
        const [, qid, idx] = data.split(':');
        if (qid !== cur.id) {
          await send(chatId, '이미 지난 질문입니다. 현재 질문에 답해주세요.');
          return;
        }
        const label = (cur.options || [])[Number(idx)];
        if (label === undefined) return;
        sess.answers[qid] = label;
        store.save();
        await send(chatId, `✔️ ${cur.name}: ${label}`);
        await advance(chatId, userId);
        return;
      }
      if (data.startsWith('med:')) {
        const [, kind, qid] = data.split(':');
        if (qid !== cur.id) return;
        if (kind === 'none') sess.media = sess.media.filter((m) => m.q !== qid);
        store.save();
        await advance(chatId, userId);
      }
    } catch (err) {
      console.error('[consult-bot] 버튼 처리 오류:', err);
      recordError(err);
    }
  });

  bot.on('polling_error', (err) => {
    recordError(err);
    const now = Date.now();
    if (now - lastErrorLoggedAt < 30 * 1000) return;
    lastErrorLoggedAt = now;
    const status = err.response && err.response.statusCode;
    if (status === 409) {
      console.error('[consult-bot] 409 Conflict — 같은 토큰으로 다른 곳에서 봇이 실행 중입니다.');
    } else if (status === 401) {
      console.error('[consult-bot] 401 Unauthorized — CONSULT_BOT_TOKEN 이 잘못되었습니다.');
    } else {
      console.error('[polling_error]', JSON.stringify({ code: err.code, message: err.message }));
    }
  });

  process.on('unhandledRejection', (err) => {
    console.error('[consult-bot] unhandledRejection:', err);
    recordError(err);
  });

  bot
    .setMyCommands([{ command: 'start', description: '처음 메뉴' }])
    .catch((err) => console.error('[consult-bot] 기본 명령 등록 실패:', err.message));
  for (const adminId of ADMIN_IDS) {
    bot
      .setMyCommands(
        [
          { command: 'start', description: '처음 메뉴' },
          { command: 'admin', description: '관리자 메뉴 (문구 수정)' },
          { command: 'id', description: '내 텔레그램 ID' },
          { command: 'cancel', description: '입력 취소' },
        ],
        { scope: { type: 'chat', chat_id: Number(adminId) } },
      )
      .catch(() => {});
  }

  bot
    .getMe()
    .then((me) =>
      console.log(
        `[consult-bot] 실행 @${me.username} (관리자 ${ADMIN_IDS.length}명, 데이터 ${store.DATA_FILE})`,
      ),
    )
    .catch((err) => console.error('[consult-bot] getMe 실패:', err.message));
}
