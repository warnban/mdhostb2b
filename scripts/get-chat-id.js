import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Укажите TELEGRAM_BOT_TOKEN в файле .env');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const data = await res.json();

if (!data.ok) {
  console.error('Ошибка Telegram API:', data);
  process.exit(1);
}

if (!data.result.length) {
  console.log('Сообщений пока нет.');
  console.log('1. Откройте @corpmdhostbot в Telegram');
  console.log('2. Нажмите Start или отправьте /start');
  console.log('3. Запустите снова: npm run chat-id');
  process.exit(0);
}

const chats = new Map();
for (const update of data.result) {
  const msg = update.message || update.edited_message;
  if (!msg?.chat) continue;
  chats.set(msg.chat.id, {
    id: msg.chat.id,
    type: msg.chat.type,
    title: msg.chat.title,
    username: msg.chat.username,
    first_name: msg.chat.first_name,
    last_name: msg.chat.last_name,
  });
}

console.log('Найденные chat_id:\n');
for (const chat of chats.values()) {
  const label = chat.title
    || [chat.first_name, chat.last_name].filter(Boolean).join(' ')
    || chat.username
    || 'unknown';
  console.log(`  ${chat.id}  —  ${label} (${chat.type})`);
}
console.log('\nСкопируйте нужный id в TELEGRAM_CHAT_ID в файле .env');
