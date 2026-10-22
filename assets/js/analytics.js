/* GA4 basic consent mode. Disable automatic outbound clicks and history views; see docs/analytics.md. */
(() => {
  'use strict';
  if (window.autoClairAnalytics) return;

  const ID = 'G-B87WS82CYV';
  const KEY = 'aac.analytics-consent.v1';
  const VERSION = 2;
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const services = {
    diagnostic: '/diagnostic-auto-le-havre/',
    inspection: '/inspection-auto-avant-achat-le-havre/',
    search: '/recherche-auto-sur-mesure-le-havre/',
    keys: '/cles-auto-le-havre/'
  };
  const copy = {
    fr: {
      title: 'Cookies',
      text: 'Avec votre accord, nous utilisons des cookies pour mesurer les visites et analyser notre audience.',
      customize: 'Personnaliser', save: 'Enregistrer',
      analyticsLabel: 'Statistiques de visite', analyticsInfo: 'Visites, provenance et clics de contact avec Google Analytics.',
      audienceLabel: 'Analyse de l’audience', audienceInfo: 'Âge, genre et centres d’intérêt agrégés via les signaux Google. Nécessite les statistiques ; personnalisation publicitaire désactivée.',
      details: 'En savoir plus',
      info: 'Google Ireland Limited reçoit les données de navigation et les identifiants _ga et _ga_B87WS82CYV. Avec « Tout accepter » ou l’option « Analyse de l’audience », vous autorisez aussi l’utilisation d’identifiants et de cookies publicitaires pour associer ces visites aux informations des comptes Google connectés et consentants (âge, genre et intérêts agrégés). La personnalisation publicitaire reste désactivée par ce site. Nos événements ne transmettent ni texte WhatsApp, ni email ou téléphone saisi. Les cookies Google existants sont gérés par Google. Choix : 180 jours. Modifiez ou retirez votre accord avec « Cookies et statistiques » en bas de page ; gérez vos données Google dans « Mon activité ». Contact : alexautoclair76@outlook.com.',
      policy: 'Confidentialité chez Google', activity: 'Mon activité Google', audience: 'Tout accepter',
      reject: 'Tout refuser', settings: 'Cookies et statistiques', close: 'Fermer'
    },
    en: {
      title: 'Cookies',
      text: 'With your permission, we use cookies for visit statistics and audience analysis.',
      customize: 'Customize', save: 'Save choices',
      analyticsLabel: 'Visit statistics', analyticsInfo: 'Visits, traffic sources and contact clicks using Google Analytics.',
      audienceLabel: 'Audience analysis', audienceInfo: 'Aggregated age, gender and interests using Google signals. Requires analytics; ad personalization stays disabled.',
      details: 'Learn more',
      info: 'Google Ireland Limited receives browsing data and the _ga and _ga_B87WS82CYV identifiers. “Accept all” or the “Audience analysis” option also permits advertising cookies and identifiers to associate these visits with information from signed-in, consenting Google accounts (aggregated age, gender and interests). This website keeps ad personalization disabled. Our events do not send WhatsApp text or entered email addresses or phone numbers. Existing Google cookies are managed by Google. Your choice lasts 180 days. Change or withdraw it using “Cookies and analytics” at the bottom of the page; manage Google data in “My Activity”. Contact: alexautoclair76@outlook.com.',
      policy: 'Google privacy policy', activity: 'Google My Activity', audience: 'Accept all',
      reject: 'Reject all', settings: 'Cookies and analytics', close: 'Close'
    },
    ru: {
      title: 'Cookies',
      text: 'С вашего согласия используем cookies для статистики посещений и анализа аудитории.',
      customize: 'Настроить', save: 'Сохранить выбор',
      analyticsLabel: 'Статистика посещений', analyticsInfo: 'Посещения, источники переходов и клики контактов через Google Analytics.',
      audienceLabel: 'Анализ аудитории', audienceInfo: 'Обобщённые возраст, пол и интересы через сигналы Google. Требует статистики; персонализация рекламы отключена.',
      details: 'Подробнее',
      info: 'Google Ireland Limited получает данные о посещениях и идентификаторы _ga и _ga_B87WS82CYV. Кнопка «Принять всё» или опция «Анализ аудитории» также разрешает использование рекламных cookie и идентификаторов для связывания посещений с данными вошедших в аккаунт Google пользователей, давших согласие (обобщённые возраст, пол и интересы). Персонализация рекламы на этом сайте остаётся отключённой. Наши события не передают текст WhatsApp, введённые email или телефоны. Существующими cookie Google управляет Google. Выбор действует 180 дней. Изменить или отозвать его можно кнопкой «Cookie и статистика» внизу страницы; управление данными Google — в разделе «Мои действия». Контакт: alexautoclair76@outlook.com.',
      policy: 'Конфиденциальность Google', activity: 'Мои действия Google', audience: 'Принять всё',
      reject: 'Отклонить', settings: 'Cookie и статистика', close: 'Закрыть'
    }
  };
  let allowed = false;
  let audienceAllowed = false;
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
          typeof value.audience === 'boolean' && (!value.audience || value.accepted) &&
          Number.isFinite(value.at) && value.at <= Date.now() && Date.now() - value.at < MAX_AGE) return value;
    } catch (_) { /* Storage may be unavailable; default to no collection. */ }
    return null;
  }

  function clearAnalyticsCookies() {
    const names = document.cookie.split(';').map(item => item.trim().split('=')[0]);
    const host = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < host.length - 1; i++) domains.push(host.slice(i).join('.'));
    for (const name of names.filter(name => name === '_ga' || name.startsWith('_ga_') || name.startsWith('_gcl_') || name.startsWith('_gac_'))) {
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
    window.gtag('consent', 'update', { analytics_storage: 'granted',
      ad_storage: audienceAllowed ? 'granted' : 'denied',
      ad_user_data: audienceAllowed ? 'granted' : 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', ID, Object.assign({}, context(), {
      send_page_view: false, allow_google_signals: audienceAllowed, allow_ad_personalization_signals: false,
      cookie_expires: 15552000, cookie_update: false
    }));
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.append(script);
    trackView();
  }

  function choose(accepted, audience = false) {
    audience = accepted && audience;
    try { localStorage.setItem(KEY, JSON.stringify({ version: VERSION, accepted, audience, at: Date.now() })); } catch (_) {}
    const wasStarted = started;
    const scopeChanged = audienceAllowed !== audience;
    allowed = accepted;
    audienceAllowed = audience;
    panel.hidden = true;
    if (focusBeforePanel && focusBeforePanel.isConnected) focusBeforePanel.focus({ preventScroll: true });
    if (accepted && wasStarted && scopeChanged) {
      // Reload to apply the new scope without retaining old Google listeners.
      window['ga-disable-' + ID] = true;
      clearAnalyticsCookies();
      location.reload();
    } else if (accepted) start();
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
    showPreferences();
  }

  function showPreferences() {
    const choice = readChoice();
    panel.querySelector('[data-aac-analytics-choice]').checked = !!(choice && choice.accepted);
    panel.querySelector('[data-aac-audience-choice]').checked = !!(choice && choice.audience);
    syncPreferences();
    panel.querySelector('[data-aac-preferences]').hidden = false;
    panel.querySelector('[data-aac-customize]').setAttribute('aria-expanded', 'true');
    panel.querySelector('[data-aac-analytics-choice]').focus({ preventScroll: true });
  }

  function syncPreferences() {
    const analytics = panel.querySelector('[data-aac-analytics-choice]');
    const audience = panel.querySelector('[data-aac-audience-choice]');
    audience.disabled = !analytics.checked;
    if (!analytics.checked) audience.checked = false;
  }

  function init() {
    panel = document.createElement('section');
    panel.className = 'aac-consent';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', 'aac-consent-title');
    panel.innerHTML = '<h2 id="aac-consent-title" data-aac-text="title"></h2>' +
      '<p class="aac-consent-intro" data-aac-text="text"></p>' +
      '<div class="aac-consent-actions"><button type="button" data-aac-audience data-aac-text="audience"></button>' +
      '<button type="button" data-aac-reject data-aac-text="reject"></button>' +
      '<button type="button" class="aac-consent-secondary" data-aac-customize data-aac-text="customize" aria-expanded="false" aria-controls="aac-preferences"></button></div>' +
      '<div id="aac-preferences" class="aac-consent-preferences" data-aac-preferences hidden>' +
      '<label class="aac-consent-option"><input type="checkbox" data-aac-analytics-choice aria-describedby="aac-analytics-info"><span data-aac-text="analyticsLabel"></span></label>' +
      '<p id="aac-analytics-info" class="aac-consent-help" data-aac-text="analyticsInfo"></p>' +
      '<label class="aac-consent-option"><input type="checkbox" data-aac-audience-choice aria-describedby="aac-audience-info"><span data-aac-text="audienceLabel"></span></label>' +
      '<p id="aac-audience-info" class="aac-consent-help" data-aac-text="audienceInfo"></p>' +
      '<details><summary data-aac-text="details"></summary>' +
      '<p data-aac-text="info"></p><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" data-aac-text="policy"></a> · <a href="https://myactivity.google.com/" target="_blank" rel="noopener noreferrer" data-aac-text="activity"></a></details>' +
      '<div class="aac-consent-preference-actions"><button type="button" data-aac-save data-aac-text="save"></button>' +
      '<button type="button" class="aac-consent-secondary" data-aac-close data-aac-text="close" hidden></button></div></div>';
    const footer = document.createElement('div');
    footer.className = 'aac-privacy-footer';
    settings = document.createElement('button');
    settings.type = 'button';
    settings.setAttribute('aria-controls', 'aac-consent-panel');
    panel.id = 'aac-consent-panel';
    footer.append(settings);
    document.body.append(footer, panel);
    updateCopy();
    panel.querySelector('[data-aac-customize]').addEventListener('click', showPreferences);
    panel.querySelector('[data-aac-analytics-choice]').addEventListener('change', syncPreferences);
    panel.querySelector('[data-aac-save]').addEventListener('click', () => choose(
      panel.querySelector('[data-aac-analytics-choice]').checked,
      panel.querySelector('[data-aac-audience-choice]').checked));
    panel.querySelector('[data-aac-reject]').addEventListener('click', () => choose(false));
    panel.querySelector('[data-aac-audience]').addEventListener('click', () => choose(true, true));
    panel.querySelector('[data-aac-close]').addEventListener('click', () => {
      panel.hidden = true;
      if (focusBeforePanel) focusBeforePanel.focus({ preventScroll: true });
    });
    settings.addEventListener('click', showSettings);
    const choice = readChoice();
    allowed = choice ? choice.accepted : false;
    audienceAllowed = !!(choice && choice.audience);
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
      const nextAudience = !!(choice && choice.audience);
      if (next && allowed && nextAudience !== audienceAllowed) {
        allowed = false;
        window['ga-disable-' + ID] = true;
        clearAnalyticsCookies();
        location.reload();
        return;
      }
      audienceAllowed = nextAudience;
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
