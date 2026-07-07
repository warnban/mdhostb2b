(function () {
  'use strict';

  /* Hero carousels */
  const CAROUSEL_PRESETS = {
    'free-zone': {
      images: Array.from({ length: 9 }, (_, i) => `/images/free-zone/${i + 1}.jpg`),
      altPrefix: 'Общая зона M&D HOST',
    },
    rooms: {
      images: [
        '/images/rooms/42-19_resized.jpg',
        '/images/rooms/xl (31 из 66)_resized.jpg',
        '/images/rooms/xl (40 из 66)_resized.jpg',
        '/images/rooms/xl (50 из 66)_resized.jpg',
        '/images/rooms/xl (51 из 66)_resized.jpg',
        '/images/rooms/xl (64 из 66)_resized.jpg',
        '/images/rooms/xs100.jpg',
        '/images/rooms/xs12.jpg',
        '/images/rooms/xs42.jpg',
      ],
      altPrefix: 'Номер M&D HOST',
    },
  };

  const CAROUSEL_CONFIG = {
    'hero-carousel-free-zone': CAROUSEL_PRESETS['free-zone'],
    'hero-carousel-rooms': CAROUSEL_PRESETS.rooms,
  };

  function initCarousel(root, images, altPrefix) {
    const track = root.querySelector('.carousel-track');
    const counter = root.querySelector('.carousel-counter');
    const prevBtn = root.querySelector('[data-dir="prev"]');
    const nextBtn = root.querySelector('[data-dir="next"]');
    let index = 0;
    let timer = null;
    const autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = 5000;

    track.innerHTML = '';

    images.forEach((src, i) => {
      const li = document.createElement('li');
      li.className = 'carousel-slide';
      li.setAttribute('role', 'listitem');

      const img = document.createElement('img');
      img.src = src;
      img.alt = `${altPrefix}, фото ${i + 1}`;
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.decoding = 'async';

      li.appendChild(img);
      track.appendChild(li);
    });

    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
      counter.textContent = `${index + 1} / ${images.length}`;
    }

    function go(delta) {
      index = (index + delta + images.length) % images.length;
      update();
    }

    function startAutoplay() {
      if (!autoplay) return;
      stopAutoplay();
      timer = setInterval(() => go(1), interval);
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    prevBtn.addEventListener('click', () => {
      go(-1);
      startAutoplay();
    });

    nextBtn.addEventListener('click', () => {
      go(1);
      startAutoplay();
    });

    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('focusin', stopAutoplay);
    root.addEventListener('focusout', startAutoplay);

    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
        startAutoplay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
        startAutoplay();
      }
    });

    update();
    startAutoplay();
  }

  Object.entries(CAROUSEL_CONFIG).forEach(([id, config]) => {
    const root = document.getElementById(id);
    if (root) initCarousel(root, config.images, config.altPrefix);
  });

  document.querySelectorAll('.carousel[data-carousel]').forEach((root) => {
    if (root.id && CAROUSEL_CONFIG[root.id]) return;
    const preset = CAROUSEL_PRESETS[root.dataset.carousel];
    if (preset) {
      initCarousel(root, preset.images, root.dataset.carouselAlt || preset.altPrefix);
    }
  });

  /* Mobile navigation */
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('is-open', !expanded);
    });

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('is-open');
      });
    });
  }

  /* Scroll reveal */
  const revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* Page context: source page & default location */
  const sourcePageInput = document.getElementById('source-page');
  if (sourcePageInput) {
    sourcePageInput.value = document.body.dataset.page || window.location.pathname || '/';
  }

  const locationSelect = document.getElementById('location');
  const defaultLocation = document.body.dataset.defaultLocation;
  if (defaultLocation && locationSelect) {
    locationSelect.value = defaultLocation;
  }

  /* Pre-fill location from location links */
  const locationLinks = document.querySelectorAll('[data-location]');

  const locationMap = {
    'Островитянова': 'ostrov',
    'Ленинский проспект': 'lenin',
    'Автозаводская': 'avto',
  };

  locationLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const name = link.getAttribute('data-location');
      const value = locationMap[name];
      if (value && locationSelect) {
        locationSelect.value = value;
      }
    });
  });

  /* Date range picker */
  const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];

  function stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatDateRu(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}.${m}.${date.getFullYear()}`;
  }

  function initDateRangePicker() {
    const picker = document.getElementById('date-range-picker');
    const trigger = document.getElementById('date-range-trigger');
    const popover = document.getElementById('date-range-popover');
    const hiddenInput = document.getElementById('dates');
    const valueEl = document.getElementById('date-range-value');
    const monthLabel = popover?.querySelector('.calendar-month-label');
    const daysGrid = popover?.querySelector('.calendar-days');
    const prevBtn = popover?.querySelector('[data-dir="prev"]');
    const nextBtn = popover?.querySelector('[data-dir="next"]');
    const flexibleCheckbox = document.getElementById('dates-flexible');
    const fieldWrap = picker.closest('.date-range-field');
    const hintEl = popover?.querySelector('.calendar-hint');

    if (!picker || !trigger || !popover || !hiddenInput || !valueEl || !monthLabel || !daysGrid) return;

    const FLEXIBLE_VALUE = 'По договорённости';

    const today = stripTime(new Date());
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();
    let startDate = null;
    let endDate = null;

    function updateHint() {
      if (!hintEl) return;
      if (startDate && !endDate) {
        hintEl.textContent = 'Выберите дату выезда';
      } else {
        hintEl.textContent = 'Сначала заезд, затем выезд';
      }
    }

    function setFlexibleMode(enabled) {
      if (enabled) {
        startDate = null;
        endDate = null;
        hiddenInput.value = FLEXIBLE_VALUE;
        hiddenInput.removeAttribute('required');
        valueEl.textContent = FLEXIBLE_VALUE;
        trigger.classList.add('has-value');
        trigger.disabled = true;
        trigger.classList.remove('is-invalid');
        fieldWrap?.classList.add('is-flexible');
        closePopover();
      } else {
        hiddenInput.value = '';
        hiddenInput.setAttribute('required', '');
        trigger.disabled = false;
        fieldWrap?.classList.remove('is-flexible');
        syncHidden();
      }
    }

    function syncHidden() {
      if (flexibleCheckbox?.checked) {
        hiddenInput.value = FLEXIBLE_VALUE;
        valueEl.textContent = FLEXIBLE_VALUE;
        trigger.classList.add('has-value');
        return;
      }

      if (startDate && endDate) {
        hiddenInput.value = `${formatDateRu(startDate)} — ${formatDateRu(endDate)}`;
        valueEl.textContent = hiddenInput.value;
        trigger.classList.add('has-value');
      } else if (startDate) {
        hiddenInput.value = '';
        valueEl.textContent = `${formatDateRu(startDate)} — выезд`;
        trigger.classList.add('has-value');
      } else {
        hiddenInput.value = '';
        valueEl.textContent = 'Заезд — выезд';
        trigger.classList.remove('has-value');
      }
    }

    function isSameDay(a, b) {
      return a && b && a.getTime() === b.getTime();
    }

    function isInRange(date) {
      if (!startDate || !endDate) return false;
      const t = date.getTime();
      return t > startDate.getTime() && t < endDate.getTime();
    }

    function renderCalendar() {
      monthLabel.textContent = `${MONTHS[viewMonth]} ${viewYear}`;
      daysGrid.innerHTML = '';
      updateHint();

      const firstDay = new Date(viewYear, viewMonth, 1);
      const startOffset = (firstDay.getDay() + 6) % 7;
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

      for (let i = 0; i < startOffset; i += 1) {
        const empty = document.createElement('span');
        empty.className = 'calendar-day is-empty';
        empty.setAttribute('aria-hidden', 'true');
        daysGrid.appendChild(empty);
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = stripTime(new Date(viewYear, viewMonth, day));
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calendar-day';
        btn.textContent = String(day);
        btn.dataset.date = date.toISOString();

        if (date < today) {
          btn.classList.add('is-disabled');
          btn.disabled = true;
        }

        if (isSameDay(date, today)) btn.classList.add('is-today');
        if (isSameDay(date, startDate)) btn.classList.add('is-start');
        if (isSameDay(date, endDate)) btn.classList.add('is-end');
        if (isInRange(date)) btn.classList.add('is-in-range');

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (flexibleCheckbox?.checked) return;

          if (!startDate || (startDate && endDate)) {
            startDate = date;
            endDate = null;
          } else if (date < startDate) {
            endDate = startDate;
            startDate = date;
          } else {
            endDate = date;
          }

          syncHidden();
          renderCalendar();

          if (startDate && endDate) {
            trigger.classList.remove('is-invalid');
            closePopover();
          }
        });

        daysGrid.appendChild(btn);
      }
    }

    function openPopover() {
      popover.hidden = false;
      picker.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      renderCalendar();
    }

    function closePopover() {
      popover.hidden = true;
      picker.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (trigger.disabled) return;
      if (popover.hidden) openPopover();
      else closePopover();
    });

    popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      renderCalendar();
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      renderCalendar();
    });

    flexibleCheckbox?.addEventListener('change', () => {
      setFlexibleMode(flexibleCheckbox.checked);
      if (!flexibleCheckbox.checked) {
        const errorEl = fieldWrap?.querySelector('.field-error');
        if (errorEl) errorEl.textContent = '';
      }
    });

    document.addEventListener('click', () => {
      if (!popover.hidden) closePopover();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !popover.hidden) closePopover();
    });

    syncHidden();
  }

  initDateRangePicker();

  /* Form validation & submit */
  const form = document.getElementById('request-form');
  const successBlock = form?.querySelector('.form-success');
  const errorBlock = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  const validators = {
    company: (v) => (v.trim().length >= 2 ? '' : 'Укажите название компании'),
    contact: (v) => (v.trim().length >= 2 ? '' : 'Укажите контактное лицо'),
    phone: (v) => {
      const digits = v.replace(/\D/g, '');
      return digits.length >= 10 ? '' : 'Укажите корректный телефон';
    },
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Укажите корректный email'),
    employees: (v) => {
      const n = Number(v);
      return n >= 1 && n <= 500 ? '' : 'Укажите количество от 1 до 500';
    },
    dates: (v) => {
      if (v.trim() === 'По договорённости') return '';
      if (!v.trim() || !v.includes('—')) return 'Укажите даты заезда и выезда';
      return '';
    },
  };

  function validateField(input) {
    const name = input.name;
    const validator = validators[name];
    if (!validator) return true;

    const error = validator(input.value);
    const errorEl = input.name === 'dates'
      ? input.closest('.date-range-field')?.querySelector('.field-error')
      : input.parentElement?.querySelector('.field-error');
    const dateTrigger = document.getElementById('date-range-trigger');

    if (error) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      if (input.name === 'dates') dateTrigger?.classList.add('is-invalid');
      if (errorEl) errorEl.textContent = error;
      return false;
    }

    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    if (input.name === 'dates') dateTrigger?.classList.remove('is-invalid');
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  if (form) {
    form.querySelectorAll('input, textarea').forEach((input) => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) validateField(input);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (errorBlock) {
        errorBlock.hidden = true;
        errorBlock.textContent = '';
      }

      let valid = true;
      form.querySelectorAll('input[required], textarea[required]').forEach((input) => {
        if (!validateField(input)) valid = false;
      });

      if (!valid) {
        const firstInvalid = form.querySelector('.is-invalid');
        firstInvalid?.focus();
        return;
      }

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка…';
      }

      try {
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Не удалось отправить заявку');
        }

        form.querySelectorAll('input, select, textarea, button').forEach((el) => {
          el.disabled = true;
        });

        if (successBlock) {
          successBlock.hidden = false;
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Получить предложение';
        }

        if (errorBlock) {
          errorBlock.textContent = err.message || 'Не удалось отправить заявку. Попробуйте позже или позвоните.';
          errorBlock.hidden = false;
        }
      }
    });
  }
})();
