# Webflow Site Audit Standard

Run this audit whenever a **full site audit** is requested. It is the canonical
checklist for every Webflow site in this repository. Build and styling rules
live in [`WEBFLOW_STANDARDS.md`](./WEBFLOW_STANDARDS.md); this document covers
how to check a site, what to check and how to report it.

Audit first, fix later. Report findings and wait for approval before changing
anything, unless the request explicitly says to fix as you go.

## 1. Scope

Cover everything that a visitor, search engine or social crawler can reach:

- Every published static page, including utility pages (404, password,
  form-success pages).
- Every CMS collection template, checked against at least two published items
  (one full, one with optional fields empty).
- Shared components (nav, footer, CTA, globals, cookie banner, forms).
- Site settings, site-wide custom code and page-level custom code.
- External scripts loaded by the site (for example the `sites/*.js` files in
  this repository).

List draft, archived and unpublished pages separately; they are out of scope for
content checks but must not be linked from published pages.

## 2. Method

Use two sources and compare them:

1. **Webflow data** through the Webflow MCP: page list and metadata, element
   trees, styles, components, CMS collections and items, assets, site and page
   custom code, redirects and site settings.
2. **Rendered output**: fetch the published HTML (for example with `curl`) for
   each page and a sample of CMS items. Social crawlers and search engines do
   not run JavaScript, so check tags in the raw HTML, and check anything added by
   scripts separately in a browser.

Also fetch `/sitemap.xml` and `/robots.txt`, and check the HTTP status of every
internal and external link found.

## 3. Checklist

### 3.1 Page inventory and publishing

- All intended pages are published; no unexpected drafts or archived pages.
- No orphan pages: every indexable page is linked from the nav, footer or
  another page.
- Utility pages (404, password, thank-you) are designed and on-brand.
- Staging (`*.webflow.io`) is not indexable, and no published page links to it.

### 3.2 SEO meta

- **Title tag**: present, unique, roughly 30–60 characters, consistent brand
  suffix, and no unbound CMS placeholders.
- **Meta description**: present, unique, roughly 70–160 characters, written for
  the page, and no duplicates across pages or CMS items.
- **Canonical**: present, self-referencing, uses the primary domain with a
  consistent `https`/`www` form and no trailing-slash mismatch.
- **Robots**: `noindex` only where intended (utility, thank-you, legal pages if
  agreed). No accidental site-wide `noindex`.
- **Sitemap**: includes every indexable page and CMS item; excludes `noindex`
  pages; uses canonical URLs.
- **robots.txt**: present, not blocking important paths, links the sitemap.
- `<html lang>` is set correctly; hreflang is correct if localisation is used.

### 3.3 Open Graph and social

- `og:title`, `og:description`, `og:image`, `og:url` and `og:type` are present
  on every page and CMS item, in the raw HTML.
- `og:url` matches the canonical URL of that page; no site-wide `og:url` that
  points every page at the homepage.
- `og:image` is an absolute URL, roughly 1200×630, under 5 MB, and relevant to
  the page (CMS templates bind the item image where one exists).
- Twitter/X card tags (`twitter:card`, title, description, image) are present or
  correctly fall back to Open Graph.
- Titles and descriptions match the SEO meta intent and contain no placeholders.

### 3.4 Structured data

- JSON-LD is valid (no syntax errors) and uses suitable types: Organization,
  WebSite, WebPage, BreadcrumbList, Service, Article, FAQPage and so on.
- No duplicate or conflicting schema blocks; `@id` values are consistent.
- Schema content matches what is visible on the page.
- Script-generated schema (for example from `sites/*.js`) is checked in a
  browser, and its selector hooks still exist in the Webflow markup.

### 3.5 Headings and semantics

- Exactly one `<h1>` per page; heading levels follow a logical order with no
  skipped levels used for styling.
- Correct landmarks: one `<main>`, `<nav>`, `<header>`, `<footer>`, and
  `<section>` for thematic sections.
- `<a>` for navigation and `<button>` for actions; no clickable divs.
- Native tables only for tabular data, with correct headers.

### 3.6 Links

- Every internal link resolves (HTTP 200) with no redirect chains; no links to
  draft, archived or deleted pages.
- No placeholder links: `#`, empty `href`, `javascript:void(0)`, example.com,
  `calendly.com/` with no path, and similar.
- No links to the staging domain or to `http://` versions of the site.
- Anchor links point to IDs that exist on the target page, and the target is not
  hidden behind the fixed nav.
- External links resolve, open in a new tab where intended, and use
  `rel="noopener"` (plus `noreferrer` or `nofollow` where appropriate).
- `mailto:` and `tel:` links are valid and consistent across the site.
- CMS links (category pills, "read more", arrows) are bound to the correct item
  or collection page.
- Redirect rules (301s) are present for any changed slugs, and none point to
  missing pages.

### 3.7 Missing links

- Buttons and CTAs with no destination, or with a generic destination where a
  specific one exists.
- Service, location, pricing or contact references in body copy that should link
  to their page.
- Important pages missing from the nav or footer (compare nav, footer and
  sitemap).
- CMS items with no route to them from any listing.
- Social icons, email and phone present in the footer and the contact page, and
  consistent.

### 3.8 Content quality

- No placeholder or default text ("Lorem ipsum", "This is some text inside of a
  div block", "Heading", "No items found" shown where items should exist).
- UK English spelling and consistent tone; no typos.
- Facts are consistent across pages: prices, fees, discounts, minimum spends,
  locations, contact details, team claims and numbers.
- Dates and copyright year are current; no stale promotions.
- CMS items have all required fields, clean slugs and no empty optional sections
  showing broken layouts.

### 3.9 Images and media

- Every meaningful image has descriptive alt text; decorative images have empty
  alt text.
- Images are sensibly sized (no multi-MB images), in modern formats (WebP or
  AVIF where possible) and responsive.
- Width and height, or an aspect ratio, are set to prevent layout shift; images
  below the fold lazy-load and the LCP image does not.
- Favicon, webclip and social images are set in site settings.
- Videos have captions, poster images, and do not autoplay with sound.

### 3.10 Accessibility

- Colour contrast meets WCAG AA for text and interactive elements.
- Visible focus states; the entire site works with a keyboard (nav dropdowns,
  tabs, accordions and FAQs, sliders, modals, cookie banner).
- Icon-only links and buttons have an `aria-label`; decorative SVGs are
  `aria-hidden="true"` and carry no duplicate IDs.
- Form fields have associated labels; checkboxes and radios have visible,
  correct labels; error messages are announced.
- Motion respects `prefers-reduced-motion`; no content depends on hover alone.
- No duplicate DOM IDs; ARIA roles are valid (for example `role="list"` only
  contains `listitem` children).

### 3.11 Forms

- Each form submits successfully (test submission), shows its success and
  failure states, and redirects correctly if configured.
- Every submitted control has a permanent, descriptive and unique field name.
  Multiword field names contain no spaces and use hyphens between words, for
  example `First-Name` and `GDPR-Consent`.
- Every form-control ID is unique lowercase kebab-case with no spaces or
  uppercase letters, and every visible label's `for` value exactly matches its
  control ID.
- Required fields, input types (email, tel) and validation are correct.
- Consent checkbox and privacy-policy link are present where personal data is
  collected.
- Form names, field names, IDs, types, required states, actions and methods use
  Webflow's native settings rather than duplicate custom attributes.
- Spam protection is enabled and the intended destination (Webflow, Basin and
  so on) receives submissions through one delivery path only. A controlled test
  creates exactly one network request and one destination record.
- Inspect the staged Designer settings, generated HTML and live browser DOM.
  Confirm the final submitted keys match in all relevant layers; a Designer
  read-back alone is not proof of the published payload.
- Browser console output never contains field values, `FormData`, submission
  payloads or other personal information.
- Analytics goals fire on submission.

### 3.12 Performance

- Page weight, number of requests, and render-blocking scripts and styles.
- Third-party scripts: needed, loaded in the right order, deferred or async
  where possible, and not duplicated.
- Fonts: limited families and weights, `font-display` behaviour, no invisible
  text.
- Core Web Vitals risks: large LCP images, layout shift from late-loading
  elements, heavy interactions.
- External script caching: live files update promptly and dev files never
  reach visitors unintentionally.

### 3.13 Custom code and scripts

- Site-wide and page-level head and footer code: no errors, duplicates, stale
  snippets or commented-out code left live without reason.
- No console errors or failed requests on any page.
- Loader behaviour for `sites/*.js` matches `AGENTS.md` (dev file only while work
  is happening, published file otherwise).
- Page-specific tags (for example per-page `og:url`) are present and correct.
- No secrets, API keys or personal data exposed in custom code.

### 3.14 Privacy and security

- The cookie consent banner works, categories are labelled correctly, and
  analytics or marketing scripts respect consent.
- HTTPS everywhere; no mixed content.
- Privacy and data-protection pages are linked from the footer and forms.

### 3.15 CMS

- SEO and Open Graph fields bound on every template; no template left with the
  default page title.
- Collection list limits, sorting and filters are correct; empty states are
  styled.
- Reference and multi-reference fields resolve; no orphaned or unpublished
  referenced items.
- Thin or utility collections are `noindex` or excluded from the sitemap if they
  should not rank.

### 3.16 Site settings

- Primary domain, `www` or apex redirect, and SSL are correct.
- Favicon and webclip are set; the 404 page is designed.
- 301 redirects are maintained; no loops or chains.
- Site search, localisation and verification tags (Google Search Console and so
  on) are correct if used.
- Analytics (for example Plausible) is installed once and records correctly.

### 3.17 Responsive behaviour

- Check desktop, tablet, mobile landscape and mobile portrait for every page
  template.
- No horizontal scrolling; no text overflow or awkward wrapping; images and
  embeds scale.
- Tap targets are at least 44×44 px; sticky and fixed elements do not cover
  content.

### 3.18 Webflow standards compliance

Check every page and component against
[`WEBFLOW_STANDARDS.md`](./WEBFLOW_STANDARDS.md), including:

- The site's `AGENTS.md` requires its local `WEBFLOW_STANDARDS.md`, and that
  local standards copy is current while preserving site-specific instructions.
- Client-First class names, `is-` combo classes only, and no temporary names
  (`v1`, `v2`, `new`, `copy`).
- Every structural element classed; no custom Navigator names.
- Every section is a native Section element, not a Div Block with its tag set
  to `section`.
- No custom attributes duplicate native settings: links set their URL, new-tab
  behaviour and `rel` through the native link settings, and no element carries a
  custom `href`, `target`, `rel`, `id`, `class`, `src`, `alt`, `name` or `type`
  attribute. Custom attributes are limited to things with no native setting,
  such as `aria-*`, `role` and `data-*`.
- Gaps use `grid-column-gap` and `grid-row-gap`; variables and `rem` units are
  used.
- SVG icons are in Code Embeds using `currentColor` with the required settings.
- Background values are valid CSS and editable in the Designer: radial gradients
  use keyword syntax, and no layer has been rewritten into invalid CSS by the
  Designer. Query every style whose `background-image` contains
  `radial-gradient`. Flag explicit sizes (for example `40% 55% at …`), two
  positions after `at`, and comments inside values: explicit sizes still
  render today, but break the next time anyone edits that class.
- No id, class or anchor link matches ad-blocker filter words (`ad`, `ads`,
  `google-ads`, `sponsor` and similar); spot-check pages with an ad blocker on.
- Fixed or full-screen elements (loaders, overlays, modals) do not block
  scrolling or clicks once inactive, and every page scrolls to the bottom.
- Unused styles, components, interactions and assets are flagged for clean-up.

## 4. Severity

| Severity | Meaning |
| --- | --- |
| Critical | Breaks the site, loses leads or data, blocks indexing, or exposes private data. |
| High | Clear SEO, accessibility or conversion damage visible to many visitors. |
| Medium | A noticeable quality issue or standards breach with limited impact. |
| Low | Polish, consistency or clean-up. |

## 5. Report format

Deliver the report as a document the user can review, structured as:

1. **Summary**: pages audited, date, counts by severity, and the top five fixes.
2. **Findings**, grouped by the checklist sections above. Each finding has:
   - ID (for example `SEO-03`)
   - Severity
   - Page, element or setting affected (with URL or Webflow element reference)
   - The issue and the evidence (what was found, where)
   - The recommended fix
   - Whether the fix is in Webflow, in a site script, or needs a content decision
3. **Passed checks**: a short list of what was checked and found correct.
4. **Fix plan**: findings ordered by severity and effort, noting which need
   the user's approval or content input.

Re-run the relevant checks after fixes and record each finding's final status.
