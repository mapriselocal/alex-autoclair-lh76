# Google Analytics 4 — Alex AutoClair LH 76

Measurement ID: `G-B87WS82CYV`. Site: https://alexautoclair76.fr/.

## Before merging / publishing

In the **Alex AutoClair LH 76** property, open **Admin → Data streams → the web stream for alexautoclair76.fr**. Turn **Enhanced measurement OFF** and confirm the change. This implementation sends its own page views and contact events. Leaving enhanced measurement enabled can duplicate history-based views and collect full outbound WhatsApp URLs, including the editable message text. Do not publish until this setting is verified. Do not change the old IHTCompany property.

Check in the correct property: time zone Paris, currency EUR, advertising features/Google Signals disabled, appropriate event-data retention (the stream UI must be checked; no retention setting has been changed by this code). Register event-scoped custom dimensions for `service_name`, `site_language`, `link_position`, and `contact_method` to use those fields in reports and Explorations. Mark `whatsapp_click` as a key event after confirming it arrives. A click is an intent to contact; it is not proof that a message was sent or that a sale occurred. Do not create a second derived event for the same click.

## Collection

One shared script and stylesheet are included exactly once on the homepage and four public service pages. The Search Console verification file, CNAME, sitemap, robots.txt, service content and image optimizer remain unchanged.

The local consent interface offers equally styled accept/refuse controls in FR/EN/RU and a permanent footer control to change the choice. Both choices expire after 180 days. Before opt-in, no Google script, Google consent ping or analytics event is sent. After acceptance, basic Consent Mode v2 grants analytics storage only; advertising storage, advertising user data and personalization remain denied. Signals and ad personalization are disabled. Analytics cookies use a 180-day non-rolling lifetime. Withdrawing consent clears the GA cookies and reloads the page to unload listeners; the choice is synchronized across open tabs. When browser storage is unavailable, permission is not remembered on the next page.

The consent panel identifies the site, Google Ireland Limited, the purpose, cookie names, choice duration, withdrawal control and contact address, and links to Google's privacy policy. This implementation is not a full legal/privacy audit. The site's wider privacy information and Google data-processing arrangements must be reviewed separately before launch.

| Event | Trigger | Parameters |
| --- | --- | --- |
| `page_view` | First consented page view, an inline service change, back/forward between service views, a language change | `page_location`, `page_referrer`, `page_title`, `site_language`, `service_name` |
| `service_view` | The same view when a service is active, including the four standalone service pages | The same context |
| `whatsapp_click` | A WhatsApp link click, including the editable-message modal | Context plus `contact_method=whatsapp`, `link_position` |
| `social_click` | An Instagram/Facebook link click | Context plus `contact_method=instagram/facebook`, `link_position` |

`service_name` is `diagnostic`, `inspection`, `search`, `keys`, or `general`. Position is `header`, `content`, `footer`, or `contact_modal`. No free-text contact field, raw link URL, message, arbitrary query parameter or arbitrary hash is included by these events. Referrers retain the domain only for external sites and the path for internal pages. Page URLs keep only conventional campaign/click-ID parameters with bounded, token-like values. Use campaign values containing letters, numbers, underscores and hyphens, without spaces or personal information. Avoid personal information in all marketing tags.

## Verification before considering setup complete

Run the browser checks below and visually inspect the six consent screenshots on desktop/mobile in all languages. The browser suite replaces Google's script and blocks external navigation: it verifies application behavior, not live GA4 ingestion.

After a reviewed merge and successful GitHub Pages deployment, verify all five live URLs and their shared script version. In a clean browser, verify no Google requests or GA cookies before consent and after refusal. Accept, visit every service, switch languages, use back/forward and click WhatsApp/social links. Use Tag Assistant plus GA4 Realtime/DebugView to verify one page view per view and one named contact event per click, the correct measurement ID, language/service context and no message text in any network payload. Test withdrawal and a returning visitor. Ad blockers can prevent collection even with consent.

Live collection, the GA4 configuration above, custom dimensions, key events, and the Search Console link are **not verified by the source-code tests**. Do not describe the whole setup as complete until these checks have passed.

## Reports and attribution

- Visits and sources: **Reports → Acquisition → Traffic acquisition**, using **Session source / medium** and **Session campaign**. User acquisition describes the first acquisition of a user, which is a different question.
- Pages: **Reports → Engagement → Pages and screens**, using page path/location. RU/EN inline services use `#service-diagnostic`, `#service-inspection`, `#service-search`, and `#service-keys`; custom service/language dimensions make grouping easier.
- Contacts: **Engagement → Events → whatsapp_click**, then key-event reports once enabled. Use an Exploration with page location/service/language, Session source / medium, and `whatsapp_click` event count to compare pages and channels that lead to a click.
- Tag campaign links before posting: e.g. `https://alexautoclair76.fr/?utm_source=facebook&utm_medium=paid_social&utm_campaign=autumn_2026`. Use `instagram` / `tiktok` as source values for those platforms, `social` for organic posts and `paid_social` for ads. Use a different campaign/content token where a comparison is useful. Referrers alone cannot reliably separate all in-app traffic. GA4 cannot reconstruct visits from before the tag was installed.
- Search Console: link the existing verified domain/site to this web stream in **Admin → Product links → Search Console links** if permissions permit; no need to recreate or remove the Search Console property. Its search-performance reports are separate from GA4's visit/contact measurements and can take time to populate.

## Local checks

Requires Node.js, Python 3 and Playwright Chromium:

```sh
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium
python3 -m http.server 8765 --bind 127.0.0.1
# In another terminal:
node --check assets/js/analytics.js
node tests/analytics.mjs
```

The pull-request workflow runs these checks on GitHub without publishing the site. All external requests in the test browser are stubbed/blocked, so tests do not send production GA4 events or WhatsApp messages.

## References

- [Google: basic consent implementation](https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic)
- [Google: manual page views and duplicate prevention](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Google: event callback and timeout](https://developers.google.com/tag-platform/gtagjs/reference/parameters)
- [CNIL: accepting and refusing cookies](https://www.cnil.fr/fr/refuser-cookies-doit-etre-aussi-simple-accepter-cnil-poursuit-action-adresse-mises-en-demeure)
