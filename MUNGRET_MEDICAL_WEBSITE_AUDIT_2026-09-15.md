# Mungret Medical Centre Website Audit

Audit date: 15 September 2026  
Production site: https://www.mungretmedicalcentre.ie/  
Webflow site: `61f90bb02448edd5799cff74`  
Last published: 14 September 2026 at 18:58 UTC

## 1. Summary

This read-only audit covered all 80 Webflow pages, all 83 URLs in the live XML sitemap, site settings, custom code, forms, assets, schema output, links, and representative desktop/mobile layouts. Every sitemap URL returned HTTP 200. The staging domain correctly blocks crawling.

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 6 |
| Medium | 10 |
| Low | 5 |
| Total | 21 |

### Top five fixes

1. Restore visible keyboard focus and repair form labels, duplicate IDs, and small tap targets.
2. Remove the global homepage `og:url` and provide a page-specific social URL.
3. Fix the two public 404 links and review the protected questionnaire links that return 401.
4. shorten and differentiate page descriptions and duplicate titles, especially CMS service pages.
5. Reduce the global six-form popup payload and legacy third-party scripts loaded on every page.

## 2. Findings

### 3.1 Page inventory and publishing

#### PAGE-01 - Medium - Search-indexable utility/content pages

**Affected:** `form-text`, old news pages, and several operational information pages.  
**Evidence:** 73 static Webflow pages were returned by the sitemap-status API. Pages such as `/form-text`, `/news-october-2025`, and `/news-june-26` are included in the sitemap, while pre-form and success pages are excluded. `/form-text` appears operational rather than a useful search landing page.  
**Fix:** Decide which utility and dated pages should attract search traffic; exclude thin/internal pages and redirect obsolete content.  
**Location:** Content decision and Webflow page sitemap settings.

### 3.2 SEO meta

#### SEO-01 - High - Excessively long meta descriptions

**Affected:** Most audited pages, including the homepage, policies, and service CMS pages.  
**Evidence:** The raw crawl found descriptions commonly between 165 and 477 characters. Examples include `/fee-terms-and-conditions` (477), `/doctor-consultation-further-information` (397), and `/occupational-health` (363).  
**Fix:** Rewrite important descriptions to approximately 120-160 useful characters, with a unique intent and local context for each page/template.  
**Location:** Webflow page SEO settings and CMS SEO fields; content input recommended.

#### SEO-02 - Medium - Duplicate titles and descriptions

**Affected:** `/occupational-health` and `/service/corporate-health-services`; `/tropical-medical-bureau-tmb` and its service item; homepage, `/about`, and `/new-patients`.  
**Evidence:** Two title pairs are identical. The same practice description is used on three core pages; another description is duplicated across two service items.  
**Fix:** Give each page a distinct search intent and description. Consolidate or canonicalize pages that genuinely serve the same intent.  
**Location:** Webflow/CMS and content decision.

#### SEO-03 - Low - Long title tags

**Affected:** 11 sitemap URLs, mainly long service names.  
**Evidence:** Titles over 60 characters include RenewableUK medical examinations (93), TIA/cerebrovascular disease (77), and the basic travel-vaccine page (71).  
**Fix:** Add concise CMS SEO-title fields rather than always using the full service name.  
**Location:** Webflow CMS.

### 3.3 Open Graph and social

#### SOCIAL-01 - High - Every page declares the homepage as `og:url`

**Affected:** All 83 sitemap URLs.  
**Evidence:** Global head code hard-codes `<meta property="og:url" content="https://www.mungretmedicalcentre.ie">`. The crawl confirmed the same value on every page.  
**Fix:** Remove the global tag and set page-specific Open Graph URLs through page/template fields or a carefully tested dynamic implementation.  
**Location:** Webflow site custom code and page/CMS social settings.

#### SOCIAL-02 - Medium - One generic social image is forced sitewide

**Affected:** All pages and CMS items.  
**Evidence:** Global code hard-codes the same legacy `uploads-ssl.webflow.com` image. Page-specific clinical/service/profile imagery cannot appear in shares.  
**Fix:** Use page and CMS Open Graph image fields, retaining a default only where no suitable image exists.  
**Location:** Webflow and content decision.

### 3.4 Structured data

#### SCHEMA-01 - Medium - Schema depends entirely on client JavaScript

**Affected:** All pages.  
**Evidence:** Raw HTML across 83 URLs contained zero JSON-LD blocks. After JavaScript executed, representative pages produced one valid graph with clinic, website, page, breadcrumb, service, and profile entities as appropriate.  
**Fix:** Keep the current thorough graph, but prefer server-rendered/native page schema if Webflow supports the required dynamic values. At minimum, monitor loader availability and production fallback behavior.  
**Location:** `sites/mungretmc.js` and Webflow loader.

#### SCHEMA-02 - Low - Homepage WebPage identifier lacks the root slash

**Affected:** Homepage generated graph.  
**Evidence:** Runtime output uses `https://www.mungretmedicalcentre.ie#webpage`, while the homepage and website identifiers otherwise use the slash form.  
**Fix:** Normalize the homepage URL before appending `#webpage`.  
**Location:** `sites/mungretmc.js`.

### 3.5 Headings and semantics

#### SEM-01 - High - Heading order is broken sitewide

**Affected:** All 83 sitemap URLs.  
**Evidence:** Every raw page contains heading-level jumps. Global hidden popup content begins with H3/H5 headings before the page H1; service pages also include an unexplained trailing H3 labelled `Heading`.  
**Fix:** Make popup titles follow a logical hierarchy or use non-heading text where appropriate; remove placeholder headings; audit each shared component and template in DOM order.  
**Location:** Webflow components and templates.

### 3.6 Links

#### LINK-01 - High - Public internal links return 404

**Affected:** Links to `/other/services-for-corporate-and-occupational-health` and `/prevention-programme`.  
**Evidence:** Both returned HTTP 404 during the internal-link crawl. The second link begins as HTTP and then lands on the missing HTTPS path.  
**Fix:** Point each link at the current destination and add a 301 for any previously indexed path.  
**Location:** Webflow links and redirects.

#### LINK-02 - Medium - Protected questionnaire links return 401

**Affected:** At least 13 links to pre-employment, IMR, TMB, Mantoux, wind, seafarer, diver, OEUK, aeromedical, and HR questionnaire routes.  
**Evidence:** Linked routes returned HTTP 401 to the unauthenticated crawler. This may be intentional access control, but visitors need a clear authenticated entry path rather than an unexplained browser response.  
**Fix:** Confirm the intended protection workflow and test each linked journey while authenticated. Replace direct protected links with an explanatory sign-in/interstitial where needed.  
**Location:** Webflow links plus access-control/content decision.

#### LINK-03 - Low - Legacy redirects and HTTP links remain in page markup

**Affected:** Old `/info/*`, `/medicaldata`, `/cancel`, and selected service links.  
**Evidence:** Eight internal links redirect before reaching their final URL; several begin with `http://`.  
**Fix:** Update the source links to the final HTTPS URLs while retaining 301s for external traffic.  
**Location:** Webflow.

### 3.7 Missing links

#### NAV-01 - Medium - Key controls use `#` links and depend on JavaScript

**Affected:** Appointment, cancellation, cookie settings, and Limerick Doc phone controls in shared navigation/footer.  
**Evidence:** The live accessibility tree exposes these actions as links to the current page plus `#`; the phone number is not a `tel:` link.  
**Fix:** Use semantic buttons for dialogs and a `tel:` URL for phone actions. Preserve keyboard focus, Escape close, and focus return for each modal.  
**Location:** Webflow shared components and script behavior.

### 3.8 Content quality

#### CONTENT-01 - High - Thursday availability is internally inconsistent

**Affected:** Opening-hours content versus appointment logic.  
**Evidence:** Sitewide visible hours say Monday-Friday 14:00-17:00, while global form code explicitly prevents patients selecting Thursday afternoons.  
**Fix:** Confirm actual Thursday availability and align visible hours, form choices, schema hours, and contact messaging.  
**Location:** Content decision, Webflow, and `sites/mungretmc.js` if schema hours change.

#### CONTENT-02 - Medium - Placeholder/obsolete labels remain

**Affected:** Service template trailing `Heading`; Careers form `Short Note` placeholder `Example Text`; old Christmas/New Year heading included globally.  
**Evidence:** These strings occur in live page DOM or the current Webflow form definition.  
**Fix:** Remove obsolete shared content and replace generic form copy with a specific prompt.  
**Location:** Webflow components/forms.

### 3.9 Images and media

#### MEDIA-01 - High - Image alternatives are overwhelmingly empty

**Affected:** All sitemap pages.  
**Evidence:** The raw crawl counted 3,338 empty `alt` attributes. Many are repeated shared assets, but substantive gallery, logo, service, and profile images are also exposed without useful alternatives. Asset records commonly have `altText: null`.  
**Fix:** Classify images as informative or decorative. Add concise asset/CMS alt text to informative images and retain empty alt only for genuinely decorative images.  
**Location:** Webflow assets, CMS, and image elements.

#### MEDIA-02 - Medium - Images lack intrinsic dimensions

**Affected:** All sitemap pages.  
**Evidence:** 3,421 image occurrences lacked both HTML width and height attributes, increasing layout-shift risk.  
**Fix:** Ensure rendered images have stable aspect ratios/intrinsic dimensions and responsive variants; prioritize above-the-fold and CMS images.  
**Location:** Webflow image elements/templates.

#### MEDIA-03 - Low - Asset-library metadata and variants need cleanup

**Affected:** 138 assets.  
**Evidence:** Many listed assets have null alt text; multiple responsive conversions report `FILESIZE_EXCEEDS_CAP`; legacy SVG logos are about 67 KB each.  
**Fix:** Remove unused duplicates, optimize oversized SVGs, regenerate failed responsive variants, and complete asset metadata.  
**Location:** Webflow Assets panel.

### 3.10 Accessibility

#### A11Y-01 - High - Visible focus is explicitly removed

**Affected:** Entire site.  
**Evidence:** Global CSS contains `*:focus { outline: 0 !important; }`; runtime computed style on links reported no outline.  
**Fix:** Delete this rule and provide a high-contrast `:focus-visible` treatment for links, buttons, fields, dropdowns, sliders, and modal controls.  
**Location:** Webflow site custom code, then native state styling where supported.

#### A11Y-02 - High - Repeated forms have labels and ID collisions

**Affected:** Six global popup forms and request pages.  
**Evidence:** The homepage has 75 controls but only 62 label elements and 28 programmatically unlabelled controls. `/request-appointment` has 44 unlabelled controls. Repeated IDs include `Request-Appointment-Form`, `App-Date`, `App-Phone`, `App-Email`, `GDPR-Consent`, and Webflow form IDs.  
**Fix:** Give every control a unique ID and explicit label; make popup instances unique or render one shared dialog; validate error associations and focus management.  
**Location:** Webflow form components and custom script.

#### A11Y-03 - Medium - Numerous mobile tap targets are below 44px

**Affected:** Homepage, contact, and service representative templates at 390px.  
**Evidence:** Automated geometry checks found 20-24 visible links/buttons/inputs per tested page below 44px in at least one dimension.  
**Fix:** Increase target boxes/spacing and retest navigation, footer, slider dots, social controls, and form controls.  
**Location:** Webflow native styles.

### 3.11 Forms

#### FORM-01 - High - Six full forms are shipped on nearly every page

**Affected:** Shared popup component sitewide.  
**Evidence:** Representative content pages contained six forms, 75 controls, and 62 labels before opening any modal; the request page contained seven forms. This contributes to duplicate IDs, accessibility failures, DOM size, and accidental form coupling.  
**Fix:** Render a single reusable dialog/form instance or load the requested form on demand. Scope all selectors to the active form and declare variables locally.  
**Location:** Webflow components and site script.

#### FORM-02 - Medium - Form handling logs patient-entered values

**Affected:** UseBasin forms.  
**Evidence:** Global submission code calls `console.log($(this).val())` for every input and logs the form ID. Values can include names, phone numbers, email addresses, travel information, and appointment messages.  
**Fix:** Remove all value logging from production and review third-party data handling against the privacy notices and processor agreements.  
**Location:** Webflow site custom code; privacy review.

### 3.12 Performance

#### PERF-01 - Medium - Large repeated HTML and script payload

**Affected:** Sitewide.  
**Evidence:** Average raw HTML was about 132 KB; the largest page was about 152 KB. Typical service pages loaded 22 script tags and four stylesheets, plus six hidden forms and roughly 55 images in markup.  
**Fix:** Remove global hidden-form duplication, inventory unused scripts, defer non-critical behavior, and lazy-load gallery/modal dependencies only where used.  
**Location:** Webflow components and custom code.

#### PERF-02 - Low - Legacy third-party dependencies are globally loaded

**Affected:** Sitewide.  
**Evidence:** Global code loads jQuery Visible, InView, widowFix, Flatpickr, Slater CSS/JS, Fancybox 3.5.7, reCAPTCHA, a cookie script, Plausible, and legacy Universal Analytics.  
**Fix:** Establish ownership and necessity for each dependency; remove Universal Analytics and unused libraries; pin/version or self-host critical dependencies where appropriate.  
**Location:** Webflow site custom code.

### 3.13 Custom code and scripts

#### CODE-01 - Medium - Global script uses undeclared mutable variables

**Affected:** Popup/form handlers.  
**Evidence:** Variables including `className`, `thisInput`, `thisForm`, `form`, and `action` are assigned without `var`, `let`, or `const`, creating shared globals and cross-form collision risk.  
**Fix:** Move behavior into a scoped module, declare variables, and add tests for multiple forms/dialogs on one page.  
**Location:** Webflow site custom code.

### 3.14 Privacy and security

#### PRIV-01 - Medium - Medical-form data crosses third-party services

**Affected:** Appointment and occupational-health forms.  
**Evidence:** Webflow definitions route submissions to `usebasin.com`; scripts also load reCAPTCHA, analytics, Slater, and other third parties. Some forms solicit health or appointment context.  
**Fix:** Document processors, lawful basis, retention, data location, consent behavior, and breach handling; minimize requested free text and ensure notices are present at collection time.  
**Location:** Privacy/content decision and Webflow configuration.

### 3.15 CMS

#### CMS-01 - Medium - CMS SEO fields permit duplicated and oversized metadata

**Affected:** Service and team templates.  
**Evidence:** CMS routes account for most long descriptions and both duplicate title pairs. Template schema generation works for representative service and doctor items.  
**Fix:** Add constrained SEO-title and description fields, editorial guidance, required alt text, and pre-publish validation.  
**Location:** Webflow CMS structure and content workflow.

### 3.16 Site settings

#### SETTINGS-01 - Low - Eight live domain variants increase maintenance surface

**Affected:** `mungretmc.ie`, `mungretmedical.ie`, `mungretmedicalcenter.ie`, and `mungretmedicalcentre.ie`, each with apex and `www`.  
**Evidence:** All eight are attached as custom domains.  
**Fix:** Confirm one default canonical domain and verify every alternate performs a single permanent redirect to it over HTTPS.  
**Location:** Webflow publishing/domain settings and DNS.

### 3.17 Responsive behaviour

No horizontal overflow was detected at 390x844 on the homepage, contact page, or sparse service template. Desktop checks at 1920px also showed no content overflow. The tap-target issue is recorded as `A11Y-03`. Tablet, mobile landscape, visual text clipping, modal keyboard behavior, and all 80 pages still require a hands-on regression pass after fixes.

### 3.18 Webflow standards compliance

#### WF-01 - Medium - Native styling is implemented in global custom CSS

**Affected:** Body overflow, navigation position/heights/opacity/transitions, popup overflow, hidden form sections, input backgrounds, and focus styling.  
**Evidence:** These declarations are in site custom code even though Webflow supports most through native Style-panel controls and states. The focus declaration is also an accessibility failure.  
**Fix:** Move supported declarations into Webflow native styles, document true custom-code exceptions, and remove obsolete rules.  
**Location:** Webflow Style panel and site custom code.

No new styling was introduced during this audit.

## 3. Passed checks

- All 83 XML-sitemap URLs returned HTTP 200.
- Production `robots.txt` allows crawling and names the correct sitemap.
- The Webflow staging domain returns `Disallow: /`.
- Every sitemap page has one H1 in raw markup.
- All audited pages declare `lang="en"`.
- Open Graph title/image and Twitter card tags are present.
- Canonical links resolve to the current page after runtime execution.
- Generated JSON-LD parsed successfully on the homepage, contact, service, team profile, and appointment templates.
- Schema route types are appropriately differentiated, including `MedicalClinic`, `ContactPage`, `MedicalWebPage`, `Service`, `ProfilePage`, `Person`, and `IndividualPhysician`.
- No horizontal overflow was detected on the three representative mobile templates at 390px.
- The three uploaded custom icon fonts use `font-display: swap`.
- Form success/failure states exist in the shared Webflow markup.

## 4. Fix plan

| Order | Findings | Effort | Approval/content needed |
| ---: | --- | --- | --- |
| 1 | `A11Y-01`, `A11Y-02`, `SEM-01` | Medium | No, except confirmation of desired focus colour |
| 2 | `LINK-01`, `NAV-01` | Low | Confirm correct destination for the two 404 links |
| 3 | `CONTENT-01` | Low | Yes: confirm Thursday afternoon availability |
| 4 | `FORM-02`, `PRIV-01` | Low/Medium | Privacy owner review required |
| 5 | `SOCIAL-01`, `SOCIAL-02` | Low/Medium | Page-specific images may need content input |
| 6 | `SEO-01`, `SEO-02`, `SEO-03`, `CMS-01` | Medium | Yes: approve rewritten metadata/consolidation |
| 7 | `FORM-01`, `PERF-01`, `CODE-01` | High | Approve shared-form architecture change |
| 8 | `MEDIA-01`, `MEDIA-02`, `MEDIA-03` | Medium/High | Alt-text/content review required |
| 9 | `LINK-02`, `LINK-03`, `PAGE-01` | Medium | Confirm protected-page and archival policy |
| 10 | `SCHEMA-01`, `SCHEMA-02`, `PERF-02`, `SETTINGS-01`, `WF-01` | Medium | Confirm dependency/domain ownership |

After fixes, rerun the 83-URL crawl, link checks, structured-data runtime checks, keyboard/form tests, and representative visual checks at desktop, tablet, mobile landscape, and mobile portrait. Form submissions were not performed during this read-only audit because they would transmit potentially sensitive test data to production systems. Protected 401 questionnaire routes were not authenticated.
