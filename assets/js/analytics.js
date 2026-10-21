/* GA4 basic consent mode. Disable Enhanced Measurement before publishing; see docs/analytics.md. */
(() => {
  'use strict';
  if (window.autoClairAnalytics) return;

  const ID = 'G-B87WS82CYV';
  const KEY = 'aac.analytics-consent.v1';
  const VERSION = 1;
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const services = {
    diagnostic: '/diagnostic-auto-le-havre/',
    inspection: '/inspection-auto-avant-achat-le-havre/',
    search: '/recherche-auto-sur-mesure-le-havre/',
    keys: '/cles-auto-le-havre/'
  };
  const copy = {
    fr: {
      title: 'Votre choix pour les statistiques',
      text: 'Alex AutoClair LH 76 utilise Google Analytics uniquement avec votre accord pour mesurer les visites, leur provenance et les clics de contact. Vous pouvez refuser : le site reste entièrement utilisable.',
      details: 'En savoir plus',
      info: 'Google Ireland Limited reçoit les données de navigation et les identifiants des cookies _ga et _ga_B87WS82CYV. Aucun texte saisi dans WhatsApp n’est transmis par nos événements. Le choix est mémorisé sur cet appareil pendant 180 jours. Vous pouvez le modifier ou retirer votre accord avec « Cookies et statistiques » en bas de page. Contact : alexautoclair76@outlook.com.',
      policy: 'Confidentialité chez Google', accept: 'Accepter les statistiques',
      reject: 'Refuser les statistiques', settings: 'Cookies et statistiques', close: 'Fermer'
    },
    en: {
      title: 'Your choice about analytics',
      text: 'Alex AutoClair LH 76 uses Google Analytics only with your permission to measure visits, traffic sources and contact clicks. You can refuse: the whole website remains available.',
      details: 'Learn more',
      info: 'Google Ireland Limited receives browsing data and identifiers from the _ga and _ga_B87WS82CYV cookies. Our events do not send text entered in WhatsApp. Your choice is saved on this device for 180 days. Change or withdraw it using “Cookies and analytics” at the bottom of the page. Contact: alexautoclair76@outlook.com.',
      policy: 'Google privacy policy', accept: 'Accept analytics',
      reject: 'Reject analytics', settings: 'Cookies and analytics', close: 'Close'
    },
    ru: {
      title: 'Ваш выбор для статистики',
      text: 'Alex AutoClair LH 76 использует Google Analytics только с вашего согласия для подсчёта посещений, источников переходов и нажатий на кнопки связи. Можно отказаться: все функции сайта останутся доступны.',
      details: 'Подробнее',
      info: 'Google Ireland Limited получает данные о посещениях и идентификаторы файлов cookie _ga и _ga_B87WS82CYV. Наши события не передают текст, введённый для WhatsApp. Выбор сохраняется на этом устройстве на 180 дней. Изменить его или отозвать согласие можно кнопкой «Cookie и статистика» внизу страницы. Контакт: alexautoclair76@outlook.com.',
      policy: 'Конфиденциальность Google', accept: 'Разрешить статистику',
      reject: 'Отказаться от статистики', settings: 'Cookie и статистика', close: 'Закрыть'
    }
  };
  let allowed = false;
  let started = false;
  let lastView = '';
  let panel;
  let settings;
  let focusBeforePanel;

  function language() {
    return Object.hasOwn(copy, document.documentElement.lang) ? document.documentElement.lang : 'fr';
  }

  function readChoice() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      if (value && value.version === VERSION && typeof value.accepted === 'boolean' &&
          Number.isFinite(value.at) && value.at <= Date.now() && Date.now() - value.at < MAX_AGE) return value;
    } catch (_) { /* Storage may be unavailable; default to no collection. */ }
    return null;
  }

  function clearAnalyticsCookies() {
    const names = document.cookie.split(';').map(item => item.trim().split('=')[0]);
    const host = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < host.length - 1; i++) domains.push(host.slice(i).join('.'));
    for (const name of names.filter(name => name === '_ga' || name.startsWith('_ga_'))) {
      for (const domain of domains) {
        document.cookie = name + '=; Max-Age=0; Path=/' + (domain ? '; Domain=' + domain : '') + '; SameSite=Lax';
      }
    }
  }

  function service() {
    const active = document.querySelector('.service-page.active');
    if (active) {
      const name = active.id.replace('page-', '');
      if (Object.hasOwn(services, name)) return name;
    }
    return Object.keys(services).find(name => location.pathname.replace(/index\.html$/, '') === services[name]) || 'general';
  }

  // Preserve campaign attribution, but never copy arbitrary URL queries or fragments.
  function safeLocation() {
    const url = new URL(location.origin + location.pathname);
    const query = new URLSearchParams(location.search);
    for (const name of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_content', 'utm_term', 'gclid', 'dclid', 'wbraid', 'gbraid']) {
      const value = query.get(name);
      if (value && /^[a-zA-Z0-9_.~-]{1,200}$/.test(value)) url.searchParams.set(name, value);
    }
    if (document.querySelector('.service-page.active')) url.hash = 'service-' + service();
    return url.href;
  }

  function safeReferrer() {
    try {
      const ref = new URL(document.referrer);
      return ref.origin === location.origin ? ref.origin + ref.pathname : ref.origin + '/';
    } catch (_) { return ''; }
  }

  function context() {
    return { page_location: safeLocation(), page_referrer: safeReferrer(),
      page_title: document.title, site_language: language(), service_name: service() };
  }

  function send(name, params) {
    if (!allowed || !started) return;
    window.gtag('event', name, Object.assign({ send_to: ID }, context(), params));
  }

  function trackView() {
    if (!allowed || !started) return;
    const key = location.pathname + ':' + service() + ':' + language();
    if (key === lastView) return;
    lastView = key;
    const data = context();
    window.gtag('set', { page_location: data.page_location, page_referrer: data.page_referrer,
      site_language: data.site_language, service_name: data.service_name });
    send('page_view');
    if (service() !== 'general') send('service_view');
  }

  function start() {
    if (started) { trackView(); return; }
    started = true;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    // The queue and Google script are created ONLY after opt-in (basic consent mode).
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', ID, Object.assign({}, context(), {
      send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_expires: 15552000, cookie_update: false
    }));
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.append(script);
    trackView();
  }

  function choose(accepted) {
    try { localStorage.setItem(KEY, JSON.stringify({ version: VERSION, accepted, at: Date.now() })); } catch (_) {}
    const wasStarted = started;
    allowed = accepted;
    panel.hidden = true;
    if (focusBeforePanel && focusBeforePanel.isConnected) focusBeforePanel.focus({ preventScroll: true });
    if (accepted) start();
    else {
      window['ga-disable-' + ID] = true;
      clearAnalyticsCookies();
      // Unload Google's already-running listeners, without sending a denial ping.
      if (wasStarted) location.reload();
    }
  }

  function updateCopy() {
    const text = copy[language()];
    panel.querySelectorAll('[data-aac-text]').forEach(el => { el.textContent = text[el.dataset.aacText]; });
    settings.textContent = text.settings;
  }

  function showSettings() {
    focusBeforePanel = document.activeElement;
    panel.hidden = false;
    panel.querySelector('[data-aac-close]').hidden = !readChoice();
    panel.querySelector('button').focus({ preventScroll: true });
  }

  function init() {
    panel = document.createElement('section');
    panel.className = 'aac-consent';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', 'aac-consent-title');
    panel.innerHTML = '<h2 id="aac-consent-title" data-aac-text="title"></h2>' +
      '<p data-aac-text="text"></p><details><summary data-aac-text="details"></summary>' +
      '<p data-aac-text="info"></p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" data-aac-text="policy"></a></details>' +
      '<div class="aac-consent-actions"><button type="button" data-aac-reject data-aac-text="reject"></button>' +
      '<button type="button" data-aac-accept data-aac-text="accept"></button>' +
      '<button type="button" data-aac-close data-aac-text="close" hidden></button></div>';
    const footer = document.createElement('div');
    footer.className = 'aac-privacy-footer';
    settings = document.createElement('button');
    settings.type = 'button';
    settings.setAttribute('aria-controls', 'aac-consent-panel');
    panel.id = 'aac-consent-panel';
    footer.append(settings);
    document.body.append(footer, panel);
    updateCopy();
    panel.querySelector('[data-aac-accept]').addEventListener('click', () => choose(true));
    panel.querySelector('[data-aac-reject]').addEventListener('click', () => choose(false));
    panel.querySelector('[data-aac-close]').addEventListener('click', () => {
      panel.hidden = true;
      if (focusBeforePanel) focusBeforePanel.focus({ preventScroll: true });
    });
    settings.addEventListener('click', showSettings);
    const choice = readChoice();
    allowed = choice ? choice.accepted : false;
    panel.hidden = !!choice;
    if (allowed) start();
    else { window['ga-disable-' + ID] = true; clearAnalyticsCookies(); }

    new MutationObserver(() => { updateCopy(); trackView(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    window.addEventListener('aac:view', trackView);
    window.addEventListener('storage', event => {
      if (event.key !== KEY && event.key !== null) return;
      const choice = readChoice();
      const next = !!(choice && choice.accepted);
      if (!next && allowed) {
        allowed = false;
        window['ga-disable-' + ID] = true;
        clearAnalyticsCookies();
        location.reload();
      } else if (next && !allowed) { allowed = true; panel.hidden = true; start(); }
      else panel.hidden = !!choice;
    });
    // Re-check consent after a tab has been left open beyond the choice's expiry.
    window.addEventListener('pageshow', () => { if (allowed && !readChoice()) choose(false); });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && allowed && !readChoice()) choose(false);
    });
    document.addEventListener('click', event => {
      if (!allowed || !started || event.defaultPrevented) return;
      const link = event.target.closest && event.target.closest('a[href]');
      if (!link || link.closest('.aac-consent')) return;
      let url;
      try { url = new URL(link.href); } catch (_) { return; }
      const host = url.hostname.replace(/^www\./, '');
      let name;
      let destination;
      if (host === 'wa.me' || host === 'api.whatsapp.com') { name = 'whatsapp_click'; destination = 'whatsapp'; }
      else if (host === 'instagram.com' || host === 'facebook.com') { name = 'social_click'; destination = host.split('.')[0]; }
      else return;
      const modal = link.closest('#contact-modal');
      const params = {
        contact_method: destination,
        service_name: modal ? (modal.dataset.analyticsService || 'general') : service(),
        link_position: modal ? 'contact_modal' : link.closest('header') ? 'header' : link.closest('footer') ? 'footer' : 'content'
      };
      // Send only fixed labels, never href, link text, or textarea contents.
      if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey &&
          event.button === 0 && link.target !== '_blank') {
        event.preventDefault();
        let navigated = false;
        const navigate = () => { if (!navigated) { navigated = true; location.assign(link.href); } };
        params.event_callback = navigate;
        params.event_timeout = 400;
        setTimeout(navigate, 450);
      }
      send(name, params);
    });
  }

  window.autoClairAnalytics = { openSettings: showSettings };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
