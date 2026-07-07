import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProxyAgent, fetch as proxyFetch } from 'undici';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
const PROXY_URL = process.env.HTTPS_PROXY || process.env.https_proxy || '';
const telegramDispatcher = PROXY_URL ? new ProxyAgent(PROXY_URL) : undefined;
const LOCATION_LABELS = {
  '': 'Подобрать оптимальную',
  ostrov: 'Островитянова',
  lenin: 'Ленинский проспект',
  avto: 'Автозаводская',
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildMessage(body) {
  const location = LOCATION_LABELS[body.location] || body.location || '—';
  const comment = body.comment?.trim() || '—';

  const sourcePage = body.source_page?.trim() || '—';

  return [
    '<b>Новая заявка B2B — M&amp;D HOST</b>',
    '',
    `<b>Страница:</b> ${escapeHtml(sourcePage)}`,
    `<b>Компания:</b> ${escapeHtml(body.company)}`,
    `<b>Контакт:</b> ${escapeHtml(body.contact)}`,
    `<b>Телефон:</b> ${escapeHtml(body.phone)}`,
    `<b>Email:</b> ${escapeHtml(body.email)}`,
    `<b>Сотрудников:</b> ${escapeHtml(body.employees)}`,
    `<b>Даты:</b> ${escapeHtml(body.dates)}`,
    `<b>Локация:</b> ${escapeHtml(location)}`,
    `<b>Комментарий:</b> ${escapeHtml(comment)}`,
  ].join('\n');
}

function validateBody(body) {
  const errors = [];
  if (!body.company?.trim() || body.company.trim().length < 2) errors.push('company');
  if (!body.contact?.trim() || body.contact.trim().length < 2) errors.push('contact');
  if (!body.phone || body.phone.replace(/\D/g, '').length < 10) errors.push('phone');
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) errors.push('email');
  const employees = Number(body.employees);
  if (!employees || employees < 1 || employees > 500) errors.push('employees');
  const dates = body.dates?.trim() || '';
  if (!dates || (dates !== 'По договорённости' && dates.length < 3)) errors.push('dates');
  return errors;
}

async function sendTelegramMessage(text) {
  const res = await proxyFetch(`${TELEGRAM_API}/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
    dispatcher: telegramDispatcher,
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
  }
  return data;
}

app.use(express.json({ limit: '32kb' }));
app.use(express.static(__dirname));

app.post('/api/lead', async (req, res) => {
  if (!TOKEN || !CHAT_ID) {
    res.status(503).json({
      ok: false,
      error: 'Сервер не настроен. Укажите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.',
    });
    return;
  }

  const errors = validateBody(req.body || {});
  if (errors.length) {
    res.status(400).json({ ok: false, error: 'Проверьте заполнение формы.', fields: errors });
    return;
  }

  try {
    await sendTelegramMessage(buildMessage(req.body));
    res.json({ ok: true });
  } catch (err) {
    console.error('Telegram send failed:', err.message);
    res.status(502).json({ ok: false, error: 'Не удалось отправить заявку. Попробуйте позже или позвоните.' });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`M&D HOST B2B → http://127.0.0.1:${PORT}`);
  if (PROXY_URL) console.log(`Telegram via proxy: ${PROXY_URL}`);
  if (!CHAT_ID) {    console.log('⚠ TELEGRAM_CHAT_ID не задан. Напишите /start боту @corpmdhostbot и выполните: npm run chat-id');
  }
});
