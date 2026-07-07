# Деплой zynqo.ru (M&D HOST B2B)

## Telegram на сервере в РФ

Бот **не требует**, чтобы посетители сайта открывали Telegram. Сервер сам шлёт HTTP-запрос на `api.telegram.org`.

- У **вас на телефоне** Telegram может работать через VPN — это отдельно.
- **Сервер** должен достучаться до API. На части хостингов в РФ `api.telegram.org` заблокирован.

Проверка на сервере:

```bash
curl -s -o /dev/null -w "%{http_code}" https://api.telegram.org
```

Если не `200`/`404` — добавьте в `.env`:

```env
HTTPS_PROXY=socks5://127.0.0.1:1080
```

(поднимите локальный SOCKS5 или используйте прокси провайдера)

---

## 1. DNS

У регистратора домена **zynqo.ru**:

| Тип | Имя | Значение |
|-----|-----|----------|
| A   | @   | **публичный IP** сервера (не 192.168.x.x) |
| A   | www | тот же публичный IP |

`192.168.0.5` — локальный адрес, для интернета нужен **белый IP** из панели хостинга.

---

## 2. Первичная настройка сервера (Ubuntu 22.04/24.04)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx certbot python3-certbot-nginx curl

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

---

## 3. Клонирование и .env

```bash
sudo mkdir -p /var/www
sudo git clone https://github.com/warnban/mdhostb2b.git /var/www/mdhostb2b
cd /var/www/mdhostb2b

sudo cp .env.example .env
sudo nano .env
```

Заполните:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
PORT=3000
```

Получить chat_id (один раз, можно с вашего ПК где есть доступ):

```bash
npm install
npm run chat-id
```

Установка зависимостей и права:

```bash
npm ci --omit=dev
sudo chown -R www-data:www-data /var/www/mdhostb2b
```

---

## 4. Systemd

```bash
sudo cp deploy/mdhost-b2b.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mdhost-b2b
sudo systemctl start mdhost-b2b
sudo systemctl status mdhost-b2b
curl -s http://127.0.0.1:3000/ | head
```

---

## 5. Nginx (сначала HTTP, потом SSL)

**Не используй `nginx-zynqo.conf` до certbot** — там пути к сертификатам, которых ещё нет.

```bash
sudo mkdir -p /var/www/certbot
sudo cp deploy/nginx-zynqo-init.conf /etc/nginx/sites-available/zynqo.ru
sudo ln -sf /etc/nginx/sites-available/zynqo.ru /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

DNS **zynqo.ru** и **www** → `186.246.5.94` (или ваш публичный IP).

```bash
sudo certbot --nginx -d zynqo.ru -d www.zynqo.ru
```

После certbot (опционально) — полный конфиг с редиректом www:

```bash
sudo cp deploy/nginx-zynqo.conf /etc/nginx/sites-available/zynqo.ru
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Проверка формы

```bash
curl -X POST https://zynqo.ru/api/lead \
  -H "Content-Type: application/json" \
  -d '{"company":"Test","contact":"Test","phone":"+79161234567","email":"t@t.ru","employees":"5","dates":"По договорённости","source_page":"/"}'
```

Ожидается: `{"ok":true}` и сообщение в Telegram.

---

## 7. Обновления (git pull)

На сервере:

```bash
chmod +x deploy/pull-and-restart.sh
./deploy/pull-and-restart.sh
```

Или вручную:

```bash
cd /var/www/mdhostb2b && git pull && npm ci --omit=dev && sudo systemctl restart mdhost-b2b
```

---

## Логи

```bash
sudo journalctl -u mdhost-b2b -f
sudo tail -f /var/log/nginx/error.log
```
