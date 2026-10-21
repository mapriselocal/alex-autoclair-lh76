// Run against a local HTTP server; Google is stubbed, so no production events are sent.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = process.env.TEST_SITE_URL || 'http://127.0.0.1:8765';
const browser = await chromium.launch({ headless: true });
const key = 'aac.analytics-consent.v1';
const paths = ['/', '/diagnostic-auto-le-havre/', '/inspection-auto-avant-achat-le-havre/',
  '/recherche-auto-sur-mesure-le-havre/', '/cles-auto-le-havre/'];
let passed = 0;
const contexts = [];

async function setup(options = {}) {
  const context = await browser.newContext(options);
  contexts.push(context);
  const google = [];
  const errors = [];
  await context.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith(root)) return route.continue();
    google.push(url);
    if (url.startsWith('https://www.googletagmanager.com/gtag/js')) {
      return route.fulfill({ contentType: 'application/javascript', body: `
        window.__gaCalls = (window.dataLayer || []).map(a => Array.from(a));
        window.gtag = function() {
          const args = Array.from(arguments);
          window.__gaCalls.push(args);
          if (args[0] === 'event' && args[2]?.event_callback) setTimeout(args[2].event_callback, 0);
        };
        document.cookie = '_ga=test; path=/';
        document.cookie = '_ga_B87WS82CYV=test; path=/';
      ` });
    }
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, google, errors };
}
async function calls(page) {
  return page.evaluate(() => window.__gaCalls || []);
}
async function events(page, name) {
  return (await calls(page)).filter(args => args[0] === 'event' && args[1] === name);
}
async function accept(page) {
  await page.locator('[data-aac-accept]').click();
  await page.waitForFunction(() => !!window.__gaCalls);
}
async function check(name, fn) {
  await fn();
  passed++;
  console.log('PASS', name);
}

try {
  await check('No Google requests/cookies before choice or after refusal; refusal persists across all pages', async () => {
    const { page, google, errors } = await setup();
    await page.goto(root);
    assert.equal(await page.locator('.aac-consent').isVisible(), true);
    assert.equal(google.length, 0);
    assert.equal(await page.evaluate(() => typeof window.gtag), 'undefined');
    await page.locator('[data-aac-reject]').click();
    for (const path of paths) {
      await page.goto(root + path);
      assert.equal(await page.locator('.aac-consent').isVisible(), false);
      assert.equal(await page.evaluate(() => document.cookie), '');
    }
    assert.equal(google.length, 0);
    assert.deepEqual(errors, []);
  });

  await check('One config/page view per page; correct service; opt-in survives navigation; no advertising consent', async () => {
    const { page, google, errors } = await setup();
    await page.goto(root);
    await accept(page);
    for (const [index, path] of paths.entries()) {
      if (index) {
        await page.goto(root + path);
        await page.waitForFunction(() => !!window.__gaCalls);
      }
      const all = await calls(page);
      assert.equal(all.filter(a => a[0] === 'config').length, 1);
      assert.equal((await events(page, 'page_view')).length, 1);
      assert.equal((await events(page, 'service_view')).length, index ? 1 : 0);
      assert.equal(all.find(a => a[0] === 'config')[2].send_page_view, false);
      assert.equal(all.find(a => a[0] === 'consent' && a[1] === 'default')[2].ad_storage, 'denied');
      assert.deepEqual(all.find(a => a[0] === 'consent' && a[1] === 'update')[2], { analytics_storage: 'granted' });
      await page.locator('.aac-privacy-footer button').click();
      await page.locator('[data-aac-accept]').click();
      assert.equal((await events(page, 'page_view')).length, 1);
    }
    assert.equal(google.filter(url => url.includes('/gtag/js')).length, 5);
    assert.deepEqual(errors, []);
  });

  await check('RU/EN service navigation, back/forward, and language switches count once with correct context', async () => {
    const { page, errors } = await setup();
    await page.goto(root);
    await accept(page);
    await page.locator('[data-lang="ru"]').click();
    await page.locator('[data-service="diagnostic"]').click();
    assert.equal((await events(page, 'service_view')).at(-1)[2].site_language, 'ru');
    assert.equal((await events(page, 'service_view')).at(-1)[2].service_name, 'diagnostic');
    assert.match((await events(page, 'page_view')).at(-1)[2].page_location, /#service-diagnostic$/);
    let count = (await events(page, 'page_view')).length;
    await page.evaluate(() => window.dispatchEvent(new Event('aac:view')));
    assert.equal((await events(page, 'page_view')).length, count);
    await page.goBack();
    assert.equal((await events(page, 'page_view')).length, count + 1);
    await page.goForward();
    assert.equal((await events(page, 'page_view')).length, count + 2);
    await page.locator('[data-lang="en"]').click();
    assert.equal((await events(page, 'page_view')).at(-1)[2].site_language, 'en');
    assert.equal(await page.locator('.aac-privacy-footer button').textContent(), 'Cookies and analytics');
    assert.deepEqual(errors, []);
  });

  await check('WhatsApp free text and arbitrary URL parameters are excluded; UTM campaign attribution is retained', async () => {
    const { context, page } = await setup();
    await page.goto(root + '/?utm_source=facebook&utm_medium=paid_social&utm_campaign=autumn_2026&email=private@example.com&text=SECRET#SECRET');
    await accept(page);
    await page.locator('[data-open-modal="general"]').first().click();
    await page.locator('#modal-message').fill('SECRET +33612345678 private@example.com');
    const popup = context.waitForEvent('page');
    await page.locator('#modal-whatsapp').click();
    await (await popup).close();
    const event = (await events(page, 'whatsapp_click'));
    assert.equal(event.length, 1);
    assert.equal(event[0][2].link_position, 'contact_modal');
    const data = JSON.stringify(await calls(page));
    assert.doesNotMatch(data, /SECRET|private|33612345678|wa\.me|link_url/);
    assert.match(data, /utm_source=facebook/);
    assert.match(data, /utm_campaign=autumn_2026/);
    await page.locator('#modal-close').click();
    for (const network of ['Instagram', 'Facebook']) {
      const opened = context.waitForEvent('page');
      await page.getByRole('link', { name: network, exact: true }).click();
      await (await opened).close();
    }
    assert.deepEqual((await events(page, 'social_click')).map(e => e[2].contact_method), ['instagram', 'facebook']);
  });

  await check('Withdrawal unloads the tag, clears analytics cookies and persists refusal', async () => {
    const { page, google } = await setup();
    await page.goto(root);
    await accept(page);
    assert.match(await page.evaluate(() => document.cookie), /_ga=/);
    await page.locator('.aac-privacy-footer button').click();
    await Promise.all([page.waitForEvent('load'), page.locator('[data-aac-reject]').click()]);
    assert.equal(await page.evaluate(() => document.cookie), '');
    assert.equal(await page.evaluate(() => typeof window.gtag), 'undefined');
    assert.equal(google.filter(url => url.includes('/gtag/js')).length, 1);
  });

  await check('Expired and malformed consent fail closed and clear stale GA cookies', async () => {
    for (const stored of ['invalid-json', JSON.stringify({ version: 1, accepted: true, at: Date.now() - 181 * 86400000 })]) {
      const { page, google } = await setup();
      await page.goto(root);
      await page.evaluate(({ key, stored }) => {
        localStorage.setItem(key, stored);
        document.cookie = '_ga=stale; path=/';
      }, { key, stored });
      await page.reload();
      assert.equal(google.length, 0);
      assert.equal(await page.locator('.aac-consent').isVisible(), true);
      assert.equal(await page.evaluate(() => document.cookie), '');
    }
  });

  await check('Withdrawal in another tab stops analytics in the first tab', async () => {
    const { context, page } = await setup();
    await page.goto(root);
    await accept(page);
    const other = await context.newPage();
    await other.goto(root);
    await other.waitForFunction(() => !!window.__gaCalls);
    await other.locator('.aac-privacy-footer button').click();
    await other.locator('[data-aac-reject]').click();
    await page.waitForFunction(() => typeof window.gtag === 'undefined');
    assert.equal(await page.evaluate(() => document.cookie), '');
  });

  await check('Banner fits mobile and desktop in all three languages, with equally sized accept/refuse controls', async () => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
      const { page } = await setup({ viewport });
      await page.goto(root);
      for (const lang of ['fr', 'en', 'ru']) {
        await page.evaluate(lang => setLanguage(lang), lang);
        const panel = await page.locator('.aac-consent').boundingBox();
        assert.ok(panel.x >= 0 && panel.x + panel.width <= viewport.width);
        assert.ok(panel.y >= 0 && panel.y + panel.height <= viewport.height);
        const a = await page.locator('[data-aac-accept]').boundingBox();
        const r = await page.locator('[data-aac-reject]').boundingBox();
        assert.equal(a.width, r.width);
        assert.equal(a.height, r.height);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({ path: `${process.env.TEST_SCREENSHOT_DIR || '/tmp'}/consent-${viewport.width}-${lang}.png` });
      }
    }
  });

  console.log(`${passed} browser scenarios passed. These checks use a Google stub, not live GA4 ingestion.`);
} finally {
  await Promise.all(contexts.map(context => context.close()));
  await browser.close();
}
