# Webflow Development Standards

Follow these requirements for every Webflow build, redesign or modification.

## 1. Client-First structure and naming

Always follow Finsweet Client-First principles for:

- Class naming
- Page structure
- Component structure
- Utility classes
- Responsive styling
- Reusable elements

Use clear, descriptive class names that explain the element's purpose.

Do not use temporary naming such as:

- `v1`
- `v2`
- `new`
- `final`
- `test`
- `copy`

The current implementation should always use the permanent production class name.

### Item-specific combo classes

Every combo class must use the `is-` convention. For example:

`pricing_google-layout is-klaviyo`

Do not use descriptive, non-`is-` combo classes. Use the `is-[variant]` form
for both individual and shared variations.

## 2. Section naming

Give every distinct section its own descriptive section class.

The class should follow this structure:

`section_[page-or-feature]-[section-name]`

Examples:

- `section_pricing-google-ads`
- `section_pricing-klaviyo`
- `section_pricing-calculator`
- `section_pricing-onboarding`
- `section_pricing-other-services`

Only reuse a section class when the section is genuinely reusable and has the same purpose and styling across multiple pages.

For example, reusable FAQ sections should use:

`section_faqs`

Do not give multiple unrelated sections a generic class such as:

`section_pricing`

Do not rename elements, sections, wrappers or components using Webflow's
Navigator rename field.

The Navigator must display permanent class names only. Do not add a custom
display label such as `Klaviyo Illustration`, `Pricing Layout`, or `Audit
Column`. If an element has been renamed, remove the custom Navigator name so
that its class name is shown instead.

Give every structural element a clear, permanent Client-First class so it can
be identified in the Navigator without a custom name.

### Semantic HTML tags

Always use the correct semantic HTML element wherever one matches the content's
purpose. Set the actual HTML tag through Webflow's native element or tag controls;
a class name or Navigator label does not replace the correct tag.

- Use `<section>` for every distinct thematic content section, normally with a heading.
- Use `<footer>` for the page footer or a footer belonging to an article or section.
- Use `<header>` for introductory content and `<nav>` for major navigation groups.
- Use one `<main>` for the page's primary content.
- Use `<article>` for self-contained content and `<aside>` for related supporting content.
- Use `<h1>` through `<h6>` in a logical hierarchy and `<p>` for paragraphs.
- Use `<a>` for navigation and `<button>` for actions.
- Use semantic list and table elements when the content is a list or tabular data,
  as described below.
- Use other relevant semantic elements, such as `<figure>`, `<figcaption>` and
  `<label>`, whenever appropriate to the content.

Use `<div>` and `<span>` only for generic layout or styling wrappers that have no
more appropriate semantic element. Choose tags by meaning, not visual appearance,
and preserve the required Client-First classes and native Webflow styling.

## 3. SVG icons

Always use SVG files or SVG markup for icons.

Every SVG icon must be placed inside a native Webflow Code Embed element.

Do not create SVG icons as:

- Custom DOM elements
- Plain text characters
- Unicode symbols
- Emojis
- Icon fonts

If an icon has a coloured, circular or shaped background:

1. Create a div wrapper for the background.
2. Place the SVG Code Embed inside that div.
3. Set the SVG or Code Embed height using an explicit `rem` value, or a percentage when relative sizing is required. Keep `1px` as `1px`.
4. Centre the Code Embed within the wrapper using native Webflow Flexbox controls.

Use `currentColor` for SVG fills and strokes where practical so the icon colour remains editable through Webflow styles.

## 4. Visual lists

Use `<ul>` for unordered lists, `<ol>` for ordered lists and `<li>` for each
list item whenever the content is semantically a list, including styled visual lists.
Use generic div layouts only when the content is not actually a list.

Name containers that wrap a list with the `-list-wrapper` suffix, the list
itself with the `-list` suffix, and direct entries with the matching `-item`
suffix. For example:

- `pricing_check-list-wrapper`
- `pricing_check-list`
- `pricing_check-item`

A generic outer wrapper, icon wrapper or content wrapper may still use a div
where appropriate. Use native HTML semantics first; add ARIA only when needed
for accessibility information not already provided by the element.

## 5. Tables

Use native `<table>` elements for genuinely tabular data, with appropriate
`<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>` and `<td>` elements as required.
Identify row and column headers correctly, using `scope` where appropriate.

Use div wrappers with native Webflow Flexbox or Grid controls for layouts that
only look like tables but do not represent tabular data. Choose the structure
based on the content's meaning rather than its appearance.

## 6. Existing Webflow variables

Always inspect and reuse the site's existing Webflow variables before creating styles.

Use existing variables for:

- Colours
- Backgrounds
- Gradients
- Font families
- Font sizes
- Line heights
- Spacing
- Section padding
- Border radius
- Border colours
- Shadows
- Container widths

Do not hard-code a CSS value when a suitable Webflow variable already exists.

Only create a new variable when no suitable existing variable is available and the value is intended to be reused.

### Units and rem values

Always use `rem` wherever possible for length values, including font sizes,
spacing, padding, margins, gaps, dimensions, border radii and border widths.
Keep values intended to be exactly `1px` as `1px`; do not convert them to `rem`.

Convert pixel measurements using the site's actual root font size rather than
assuming a fixed conversion. Reuse suitable existing Webflow variables and use
`rem` for new length variables wherever possible. Do not change shared variables
without checking their existing uses.

Retain percentages, viewport units, `fr`, unitless values and keywords such as
`auto` when they are appropriate to the required layout or behaviour. Apply units
through Webflow's native controls wherever supported.

## 7. Flexbox and Grid gaps

Always set spacing between Flexbox or Grid children through Webflow's native gap controls.

Use these Designer-compatible properties:

- `grid-column-gap`
- `grid-row-gap`

Use these properties for both Grid and Flexbox layouts.

Never use:

- `gap`
- `column-gap`
- `row-gap`
- Child margins to simulate a gap
- Empty spacer elements
- Custom CSS that prevents the gap controls from appearing in the Designer

Use existing Webflow spacing variables for gap values whenever suitable variables are available.

Set gap values independently at each required breakpoint:

- Desktop
- Tablet
- Mobile landscape
- Mobile portrait

After applying the styles, verify that both the horizontal and vertical gap controls are visible and editable in the Webflow Designer.

## 8. Native Webflow implementation

Build layouts using native Webflow elements and Designer-compatible style properties wherever possible.

Use native Webflow controls for:

- Flexbox
- Grid
- Gaps
- Alignment
- Padding
- Margins
- Sizing
- Positioning
- Borders
- Border radius
- Typography
- Breakpoint styles

Every CSS declaration that Webflow supports natively must be applied through
Webflow's native Style-panel controls.

Do not add a declaration to Custom Properties or custom CSS when Webflow has a
native control for it. This includes, for example, padding, margins, sizing,
positioning, borders, colours, typography, Flexbox, Grid, gaps and responsive
breakpoint values.

Use Custom Properties or custom CSS only when the required behaviour genuinely
cannot be created with native Webflow controls. Keep the exception narrowly
scoped and record why a native Webflow property was not possible.

Any styling added programmatically must still appear correctly inside the Webflow Designer's Style panel.

## 9. Borders

Use the border width, colour and radius required by the approved design. Reuse existing Webflow variables where suitable, but do not enforce a global border width across the site.

Use existing variables for border colours and border radius values.

Set each required border side explicitly using Designer-compatible properties.

## 10. Responsive behaviour

Build and verify every section across Webflow's standard breakpoints:

- Desktop
- Tablet
- Mobile landscape
- Mobile portrait

Do not rely only on inherited desktop styling.

Check:

- Grid column changes
- Flex direction changes
- Gap values
- Padding
- Text wrapping
- Image sizing
- Absolute positioning
- Overflow
- Table behaviour
- Minimum and maximum widths

## 11. Existing structure and reusable classes

Inspect the existing page and style system before adding new elements or classes.

Reuse an existing class only when:

- It has the same purpose
- It requires the same styling
- Reusing it will not unintentionally change another section

Create a new Client-First class when the purpose or styling is different.

Do not overwrite a shared class to solve a section-specific problem.

## 12. Final verification

Before completing any Webflow task, verify that:

- All classes use permanent Client-First names
- No temporary `v1` or `v2` classes remain
- Every section has a descriptive permanent class and no custom Navigator name
- Every thematic content section uses `<section>` and footers use `<footer>`
- All other elements use the correct semantic tags wherever applicable
- Lists use `<ul>` or `<ol>` with `<li>` items when semantically appropriate
- Tabular data uses native table elements with correctly identified headers
- Icons are SVGs inside Code Embeds
- Existing Webflow variables are used
- Length values use `rem` wherever possible, with exact `1px` values kept as `1px`
- Every supported CSS declaration is set through native Webflow Style-panel controls
- Custom Properties and custom CSS are used only for behaviour unavailable natively
- Grid and Flex gaps use `grid-column-gap` and `grid-row-gap`
- Gap controls appear natively in the Designer
- Responsive styles exist at the required breakpoints
- Existing JavaScript hooks, attributes and integrations remain intact
- The Navigator displays class names rather than custom renamed labels
- The finished structure appears correctly in the Webflow Navigator and Style panel
