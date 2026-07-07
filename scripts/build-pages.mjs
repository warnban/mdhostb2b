import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));

const SITE_PAGES = [
  { href: '/', label: 'Главная' },
  { href: '/razmeshchenie-sotrudnikov-moskva.html', label: 'Размещение сотрудников' },
  { href: '/obshezhitie-dlya-rabochih.html', label: 'Общежитие для рабочих' },
  { href: '/razmeshchenie-rabochih-brigad.html', label: 'Рабочие бригады' },
  { href: '/komandirovki.html', label: 'Командировки' },
  { href: '/gruppovoe-razmeshchenie.html', label: 'Групповое размещение' },
  { href: '/hostel-dlya-kompaniy.html', label: 'Хостел для компаний' },
  { href: '/ostrovityanova.html', label: 'Островитянова' },
  { href: '/leninskiy.html', label: 'Ленинский' },
  { href: '/avtozavodskaya.html', label: 'Автозаводская' },
];

const GEO_PAGES = [
  { href: '/ostrovityanova.html', label: 'Островитянова' },
  { href: '/leninskiy.html', label: 'Ленинский проспект' },
  { href: '/avtozavodskaya.html', label: 'Автозаводская' },
];

const BUILD_DATE = new Date().toISOString().slice(0, 10);

function stripHtml(text) {
  return String(text).replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '');
}

function buildBreadcrumbSchema(page) {
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Главная', item: `${config.siteUrl}/` },
    {
      '@type': 'ListItem',
      position: 2,
      name: page.breadcrumb || page.title,
      item: `${config.siteUrl}/${page.file}`,
    },
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSchema(page) {
  const url = `${config.siteUrl}/${page.file}`;
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'M&D HOST',
    url: config.siteUrl,
    telephone: config.phoneTel,
    description: 'Корпоративное размещение сотрудников и рабочих бригад в Москве',
    sameAs: [config.guestSite],
  };

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title.replace(/&nbsp;/g, ' '),
    description: page.description,
    url,
    isPartOf: { '@type': 'WebSite', name: config.siteName, url: config.siteUrl },
  };

  const faq = page.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faq.map((item) => ({
          '@type': 'Question',
          name: item.q.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ''),
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ''),
          },
        })),
      }
    : null;

  let extra = null;
  if (page.schemaType === 'LocalBusiness') {
    extra = {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      name: `M&D HOST — ${page.breadcrumb || page.slug}`,
      description: page.description,
      url,
      telephone: config.phoneTel,
      address: {
        '@type': 'PostalAddress',
        streetAddress: page.address.replace(/^Москва,\s*/, ''),
        addressLocality: 'Москва',
        addressCountry: 'RU',
      },
      geo: page.geo
        ? { '@type': 'GeoCoordinates', latitude: page.geo.lat, longitude: page.geo.lng }
        : undefined,
      parentOrganization: { '@type': 'Organization', name: 'M&D HOST' },
      aggregateRating: page.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: page.rating.value,
            reviewCount: page.rating.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    };
  } else if (page.schemaType === 'Service') {
    extra = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: page.serviceName,
      description: page.description,
      provider: { '@type': 'Organization', name: 'M&D HOST', url: config.siteUrl },
      areaServed: { '@type': 'City', name: 'Москва' },
      url,
    };
  }

  const breadcrumbs = buildBreadcrumbSchema(page);

  return [org, webPage, extra, faq, breadcrumbs].filter(Boolean);
}

function renderForm(defaultLocation) {
  const locSelected = (v) => (defaultLocation === v ? ' selected' : '');
  const anySelected = defaultLocation ? '' : ' selected';

  return `
        <form class="lead-form reveal" id="request-form" novalidate>
          <input type="hidden" name="source_page" id="source-page" value="">
          <div class="form-row">
            <label for="company">Название компании <span aria-hidden="true">*</span></label>
            <input type="text" id="company" name="company" required autocomplete="organization" placeholder="ООО «СтройМонтаж»">
            <span class="field-error" role="alert"></span>
          </div>
          <div class="form-row">
            <label for="contact">Контактное лицо <span aria-hidden="true">*</span></label>
            <input type="text" id="contact" name="contact" required autocomplete="name" placeholder="Иван Петров">
            <span class="field-error" role="alert"></span>
          </div>
          <div class="form-row form-row--half">
            <div>
              <label for="phone">Телефон <span aria-hidden="true">*</span></label>
              <input type="tel" id="phone" name="phone" required autocomplete="tel" placeholder="+7 (___) ___-__-__">
              <span class="field-error" role="alert"></span>
            </div>
            <div>
              <label for="email">Email <span aria-hidden="true">*</span></label>
              <input type="email" id="email" name="email" required autocomplete="email" placeholder="hr@company.ru">
              <span class="field-error" role="alert"></span>
            </div>
          </div>
          <div class="form-row form-row--half">
            <div>
              <label for="employees">Количество сотрудников <span aria-hidden="true">*</span></label>
              <input type="number" id="employees" name="employees" required min="1" max="500" placeholder="12">
              <span class="field-error" role="alert"></span>
            </div>
            <div class="date-range-field">
              <label id="dates-label">Даты проживания <span aria-hidden="true">*</span></label>
              <div class="date-range-picker" id="date-range-picker">
                <button type="button" class="date-range-trigger" id="date-range-trigger" aria-labelledby="dates-label" aria-haspopup="dialog" aria-expanded="false">
                  <svg class="date-range-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <span class="date-range-value" id="date-range-value">Заезд — выезд</span>
                  <svg class="date-range-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <input type="hidden" id="dates" name="dates" required>
                <div class="date-range-popover" id="date-range-popover" role="dialog" aria-label="Выбор дат проживания" hidden>
                  <div class="calendar-header">
                    <button type="button" class="calendar-nav" data-dir="prev" aria-label="Предыдущий месяц">←</button>
                    <span class="calendar-month-label"></span>
                    <button type="button" class="calendar-nav" data-dir="next" aria-label="Следующий месяц">→</button>
                  </div>
                  <p class="calendar-hint">Сначала заезд, затем выезд</p>
                  <div class="calendar-weekdays" aria-hidden="true">
                    <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
                  </div>
                  <div class="calendar-days"></div>
                </div>
              </div>
              <label class="date-flex-option">
                <input type="checkbox" id="dates-flexible" name="dates_flexible" value="1">
                <span>Даты по договорённости</span>
              </label>
              <span class="field-error" role="alert"></span>
            </div>
          </div>
          <div class="form-row">
            <label for="location">Предпочтительная локация</label>
            <select id="location" name="location">
              <option value=""${anySelected}>Подобрать оптимальную</option>
              <option value="ostrov"${locSelected('ostrov')}>Островитянова</option>
              <option value="lenin"${locSelected('lenin')}>Ленинский проспект</option>
              <option value="avto"${locSelected('avto')}>Автозаводская</option>
            </select>
          </div>
          <div class="form-row">
            <label for="comment">Комментарий</label>
            <textarea id="comment" name="comment" rows="3" placeholder="Район объекта, требования к номерам, документы для командировок…"></textarea>
          </div>
          <button class="btn btn-primary btn-lg btn-full" type="submit" id="submit-btn">Получить предложение</button>
          <p class="form-note">Отправляя заявку, вы соглашаетесь на&nbsp;<a href="/privacy.html">обработку персональных данных</a> для связи по&nbsp;вашему запросу.</p>
          <div class="form-error" id="form-error" hidden role="alert"></div>
          <div class="form-success" hidden role="status">
            <strong>Заявка отправлена</strong>
            <p>Менеджер свяжется с&nbsp;вами в&nbsp;ближайшее время и&nbsp;подберёт подходящую локацию.</p>
          </div>
        </form>`;
}

function renderFooter() {
  const pageLinks = SITE_PAGES.map((p) => `<li><a href="${p.href}">${p.label}</a></li>`).join('\n          ');
  const geoLinks = GEO_PAGES.map((p) => `<li><a href="${p.href}">${p.label}</a></li>`).join('\n          ');

  return `
  <footer class="site-footer">
    <div class="container footer-grid footer-grid--wide">
      <div class="footer-brand">
        <a class="logo logo--footer" href="/">
          <span class="logo-mark">M&amp;D</span>
          <span class="logo-text">HOST</span>
        </a>
        <p>Корпоративное размещение сотрудников в&nbsp;Москве</p>
      </div>

      <div class="footer-contacts">
        <h3>Контакты</h3>
        <ul>
          <li><a href="tel:${config.phoneTel}">${config.phone}</a></li>
          <li class="footer-messengers">MAX&nbsp;; Telegram&nbsp;; WhatsApp</li>
        </ul>
      </div>

      <div class="footer-addresses">
        <h3>Адреса объектов</h3>
        <ul>
          <li><a href="/ostrovityanova.html">ул.&nbsp;Островитянова, 9к3</a></li>
          <li><a href="/leninskiy.html">Ленинский проспект, 99</a></li>
          <li><a href="/avtozavodskaya.html">3-й&nbsp;Автозаводский проезд, 4</a></li>
        </ul>
      </div>

      <div class="footer-links">
        <h3>Разделы</h3>
        <ul>
          ${pageLinks}
        </ul>
      </div>

      <div class="footer-links">
        <h3>Локации</h3>
        <ul>
          ${geoLinks}
        </ul>
      </div>
    </div>

    <div class="container footer-bottom">
      <p>© 2026 M&amp;D HOST. Сеть хостелов в&nbsp;Москве.</p>
      <p class="footer-credits">
        Сайт разработал
        <a class="footer-credit-link" href="https://t.me/aleblanche" target="_blank" rel="noopener noreferrer">
          <svg class="icon-telegram" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Александр
        </a>
      </p>
      <p class="footer-legal">ИП / юридическое лицо — по&nbsp;запросу при оформлении договора · <a href="/privacy.html">Политика конфиденциальности</a></p>
      <p><a href="${config.guestSite}" target="_blank" rel="noopener noreferrer">Основной сайт для гостей — mdhost.ru</a></p>
    </div>
  </footer>`;
}

function renderPage(page) {
  const canonical = `${config.siteUrl}/${page.file}`;
  const schemas = buildSchema(page);
  const schemaScripts = schemas
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n  ');

  const factsHtml = page.facts
    .map(
      (f) => `
            <div>
              <dt>${f.dt}</dt>
              <dd>${f.dd}</dd>
            </div>`
    )
    .join('');

  const blocksHtml = page.blocks
    .map(
      (block) => `
        <section class="section${page.blocks.indexOf(block) % 2 ? ' section--alt' : ''}" aria-labelledby="block-${page.slug}-${page.blocks.indexOf(block)}">
          <div class="container">
            <header class="section-header reveal">
              <h2 id="block-${page.slug}-${page.blocks.indexOf(block)}">${block.title}</h2>
            </header>
            <div class="advantage-list">
              ${block.items
                .map(
                  (item) => `
              <article class="advantage-item reveal">
                <h3>${item.h}</h3>
                <p>${item.p}</p>
              </article>`
                )
                .join('')}
            </div>
          </div>
        </section>`
    )
    .join('');

  const faqHtml = page.faq
    .map(
      (item) => `
          <details class="faq-item">
            <summary>${item.q}</summary>
            <p>${item.a}</p>
          </details>`
    )
    .join('');

  const defaultLocAttr = page.defaultLocation ? ` data-default-location="${page.defaultLocation}"` : '';
  const breadcrumbLabel = page.breadcrumb || stripHtml(page.title);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${esc(page.description)}">
  <meta name="keywords" content="${esc(page.keywords)}">
  <title>${esc(page.title.replace(/&nbsp;/g, ' '))}</title>
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="M&amp;D HOST B2B">
  <meta property="og:title" content="${esc(page.title.replace(/&nbsp;/g, ' '))}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${encodeURI(`${config.siteUrl}${page.heroImage}`)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(page.title.replace(/&nbsp;/g, ' '))}">
  <meta name="twitter:description" content="${esc(page.description)}">
  <meta name="twitter:image" content="${encodeURI(`${config.siteUrl}${page.heroImage}`)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="stylesheet" href="/styles.css">
  ${schemaScripts}
</head>
<body data-page="${page.slug}"${defaultLocAttr}>
  <a class="skip-link" href="#lead-form">Перейти к форме заявки</a>

  <header class="site-header" id="top">
    <div class="container header-inner">
      <a class="logo" href="/" aria-label="M&amp;D HOST — на главную">
        <span class="logo-mark">M&amp;D</span>
        <span class="logo-text">HOST</span>
        <span class="logo-badge">B2B</span>
      </a>

      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Открыть меню">
        <span></span>
        <span></span>
      </button>

      <nav class="site-nav site-nav--pages" id="site-nav" aria-label="Основная навигация">
        <ul>
          <li><a href="/">Главная</a></li>
          <li><a href="/#locations">Локации</a></li>
          <li><a href="/komandirovki.html">Командировки</a></li>
          <li><a href="/obshezhitie-dlya-rabochih.html">Для рабочих</a></li>
          <li><a href="#faq">Вопросы</a></li>
        </ul>
      </nav>

      <a class="btn btn-primary header-cta" href="#lead-form">Получить предложение</a>
    </div>
  </header>

  <main>
    <nav class="breadcrumbs container" aria-label="Хлебные крошки">
      <ol>
        <li><a href="/">Главная</a></li>
        <li aria-current="page">${breadcrumbLabel}</li>
      </ol>
    </nav>

    <section class="page-hero" aria-labelledby="page-title">
      <div class="container page-hero-grid">
        <div class="page-hero-content reveal">
          <p class="eyebrow">${page.eyebrow}</p>
          <h1 id="page-title">${page.h1}</h1>
          <p class="page-hero-lead">${page.lead}</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg" href="#lead-form">Оставить заявку</a>
            <a class="btn btn-ghost" href="/#locations">Все локации</a>
          </div>
          <dl class="hero-facts">
            ${factsHtml}
          </dl>
        </div>
        <div class="page-hero-visual reveal" data-delay="1">
          <figure class="page-hero-photo">
            <img src="${page.heroImage}" alt="${esc(page.heroImageAlt)}" width="900" height="560" fetchpriority="high" decoding="async">
          </figure>
          <div class="hero-photo-stack page-hero-carousels">
            <figure class="photo-block photo-main">
              <div class="carousel carousel--main" data-carousel="free-zone" data-carousel-alt="Общая зона M&amp;D HOST" tabindex="0" aria-roledescription="carousel" aria-label="Общая зона и ресепшн">
                <div class="carousel-viewport">
                  <ul class="carousel-track" role="list">
                    <noscript><li class="carousel-slide" role="listitem"><img src="/images/free-zone/1.jpg" alt="Общая зона M&amp;D HOST" width="800" height="500"></li></noscript>
                  </ul>
                </div>
                <div class="carousel-controls">
                  <button class="carousel-btn" type="button" data-dir="prev" aria-label="Предыдущее фото">←</button>
                  <span class="carousel-counter" aria-live="polite"></span>
                  <button class="carousel-btn" type="button" data-dir="next" aria-label="Следующее фото">→</button>
                </div>
              </div>
              <figcaption>Общая зона · ресепшн</figcaption>
            </figure>
            <figure class="photo-block photo-secondary">
              <div class="carousel carousel--room" data-carousel="rooms" data-carousel-alt="Номер M&amp;D HOST" tabindex="0" aria-roledescription="carousel" aria-label="Номера для размещения">
                <div class="carousel-viewport">
                  <ul class="carousel-track" role="list">
                    <noscript><li class="carousel-slide" role="listitem"><img src="/images/rooms/xs42.jpg" alt="Номер M&amp;D HOST" width="800" height="533"></li></noscript>
                  </ul>
                </div>
                <div class="carousel-controls">
                  <button class="carousel-btn" type="button" data-dir="prev" aria-label="Предыдущее фото">←</button>
                  <span class="carousel-counter" aria-live="polite"></span>
                  <button class="carousel-btn" type="button" data-dir="next" aria-label="Следующее фото">→</button>
                </div>
              </div>
              <figcaption>Номер · размещение бригады</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>

    ${blocksHtml}

    <section class="section section--alt" aria-labelledby="seo-links-title">
      <div class="container">
        <header class="section-header reveal">
          <p class="eyebrow">Сеть M&amp;D HOST</p>
          <h2 id="seo-links-title">Другие направления размещения</h2>
        </header>
        <nav class="seo-links reveal" aria-label="Связанные разделы">
          ${SITE_PAGES.filter((p) => p.href !== `/${page.file}` && p.href !== '/')
            .slice(0, 6)
            .map((p) => `<a class="seo-link-card" href="${p.href}">${p.label}</a>`)
            .join('\n          ')}
        </nav>
      </div>
    </section>

    <section class="section" id="faq" aria-labelledby="faq-title">
      <div class="container faq-layout">
        <header class="section-header reveal">
          <p class="eyebrow">Вопросы</p>
          <h2 id="faq-title">Частые вопросы</h2>
        </header>
        <div class="faq-list reveal">
          ${faqHtml}
        </div>
      </div>
    </section>

    <section class="section section--lead" id="lead-form" aria-labelledby="lead-title">
      <div class="container lead-grid">
        <div class="lead-copy reveal">
          <p class="eyebrow eyebrow--light">Заявка</p>
          <h2 id="lead-title">Получите коммерческое предложение</h2>
          <p>Заполните форму — менеджер по&nbsp;корпоративному размещению свяжется с&nbsp;вами и&nbsp;подберёт локацию.</p>
          <ul class="lead-benefits">
            <li>Ответ в&nbsp;течение 2&nbsp;часов в&nbsp;рабочее время</li>
            <li>Подбор локации под ваш объект</li>
            <li>Индивидуальные условия для групп</li>
          </ul>
          <p class="lead-phone">Или свяжитесь напрямую: <a href="tel:${config.phoneTel}">${config.phone.replace(/ /g, '&nbsp;')}</a> <span class="lead-messengers">(MAX&nbsp;; Telegram&nbsp;; WhatsApp)</span></p>
        </div>
        ${renderForm(page.defaultLocation)}
      </div>
    </section>
  </main>
${renderFooter()}

  <script src="/script.js"></script>
</body>
</html>`;
}

function buildSitemap() {
  const urls = [
    { loc: `${config.siteUrl}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${config.siteUrl}/privacy.html`, priority: '0.3', changefreq: 'yearly' },
    ...pages.map((p) => ({
      loc: `${config.siteUrl}/${p.file}`,
      priority: p.schemaType === 'LocalBusiness' ? '0.9' : '0.8',
      changefreq: 'monthly',
    })),
  ];

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

function renderPrivacyPage() {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Политика обработки персональных данных M&amp;D HOST — корпоративное размещение сотрудников в Москве на zynqo.ru.">
  <title>Политика конфиденциальности — M&amp;D HOST</title>
  <link rel="canonical" href="${config.siteUrl}/privacy.html">
  <meta name="robots" content="noindex, follow">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
</head>
<body data-page="privacy">
  <header class="site-header">
    <div class="container header-inner">
      <a class="logo" href="/"><span class="logo-mark">M&amp;D</span><span class="logo-text">HOST</span><span class="logo-badge">B2B</span></a>
      <a class="btn btn-primary header-cta" href="/#lead-form">Получить предложение</a>
    </div>
  </header>
  <main>
    <nav class="breadcrumbs container" aria-label="Хлебные крошки">
      <ol>
        <li><a href="/">Главная</a></li>
        <li aria-current="page">Политика конфиденциальности</li>
      </ol>
    </nav>
    <article class="section legal-page">
      <div class="container legal-content">
        <h1>Политика обработки персональных данных</h1>
        <p class="legal-updated">Дата публикации: ${BUILD_DATE}</p>
        <p>Настоящая политика определяет порядок обработки персональных данных пользователей сайта <a href="${config.siteUrl}">${config.siteUrl.replace('https://', '')}</a> (далее — Сайт), принадлежащего сети хостелов M&amp;D HOST.</p>
        <h2>1. Какие данные мы собираем</h2>
        <p>При заполнении формы заявки на Сайте вы можете указать: название компании, контактное лицо, телефон, email, количество сотрудников, даты проживания, предпочтительную локацию и комментарий.</p>
        <h2>2. Цели обработки</h2>
        <ul>
          <li>обработка заявки на корпоративное размещение;</li>
          <li>связь с вами по телефону, email или мессенджерам;</li>
          <li>подготовка коммерческого предложения.</li>
        </ul>
        <h2>3. Правовые основания</h2>
        <p>Обработка осуществляется на основании вашего согласия (ст.&nbsp;6 152-ФЗ), выраженного отправкой формы заявки, а также для исполнения предварительных договорённостей по вашему запросу.</p>
        <h2>4. Передача третьим лицам</h2>
        <p>Данные заявки передаются менеджеру через защищённый канал связи (Telegram) исключительно для обработки запроса. Мы не продаём и не передаём данные рекламным сетям.</p>
        <h2>5. Срок хранения</h2>
        <p>Данные хранятся до достижения целей обработки или до отзыва согласия, но не дольше срока, необходимого для ведения переписки и оформления размещения.</p>
        <h2>6. Ваши права</h2>
        <p>Вы вправе запросить уточнение, блокирование или удаление данных, а также отозвать согласие, написав на <a href="tel:${config.phoneTel}">${config.phone}</a> или через форму на <a href="/#lead-form">главной странице</a>.</p>
        <h2>7. Контакты оператора</h2>
        <p>M&amp;D HOST · телефон: <a href="tel:${config.phoneTel}">${config.phone}</a> · гостевой сайт: <a href="${config.guestSite}" target="_blank" rel="noopener noreferrer">mdhost.ru</a></p>
      </div>
    </article>
  </main>
${renderFooter()}
  <script src="/script.js"></script>
</body>
</html>`;
}

for (const page of pages) {
  const html = renderPage(page);
  fs.writeFileSync(path.join(root, page.file), html, 'utf8');
  console.log(`✓ ${page.file}`);
}

fs.writeFileSync(path.join(root, 'sitemap.xml'), buildSitemap(), 'utf8');
console.log('✓ sitemap.xml');

fs.writeFileSync(path.join(root, 'privacy.html'), renderPrivacyPage(), 'utf8');
console.log('✓ privacy.html');
