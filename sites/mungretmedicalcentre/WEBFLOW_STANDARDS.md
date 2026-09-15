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

Every combo class must use the `is-` convention.![alt text](image.png) For example:

`pricing_google-layout is-klaviyo`

Do not use descriptive, non-`is-` combo classes. Use the `is-[variant]` form
for both individual and shared variations.

## 2. Section naming

Give every distinct section its own descriptive section class.

The class should follow this structure:

`section_[page-or-feature]-[section-name]`

Examples:

- `section_pricing-google-search`
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
  Always build it with Webflow's native **Section** element, so it shows as a
  Section in the Navigator. Do not use a Div Block with its tag changed to
  `section`; it outputs the same HTML but is the wrong element type.
- Use `<footer>` for the page footer or a footer belonging to an article or section.
- Use `<header>` for introductory content and `<nav>` for major navigation groups.
- Use one `<main>` for the page's primary content.
- Use `<article>` for self-contained content and `<aside>` for related supporting content.
- Use `<h1>` through `<h6>` in a logical hierarchy and `<p>` for paragraphs.
- Use `<a>` for navigation and `<button>` for actions.
- Use list elements only inside Rich Text, and table elements for tabular data,
  as described below.
- Use other relevant semantic elements, such as `<figure>`, `<figcaption>` and
  `<label>`, whenever appropriate to the content.

Use `<div>` and `<span>` only for generic layout or styling wrappers that have no
more appropriate semantic element. Choose tags by meaning, not visual appearance,
and preserve the required Client-First classes and native Webflow styling.

## 3. SVG icons

Always use SVG files or SVG markup for icons.

Every SVG icon must be placed inside a native Webflow Code Embed element.

Always apply these settings to the SVG icon's Code Embed through Webflow's native
Style-panel controls:

| Setting | Required value |
| --- | --- |
| Display | Flex |
| Direction | Vertical / column |
| X alignment | Center |
| Y alignment | Center |
| Horizontal and vertical gaps | `0` |
| Width, minimum width and maximum width | All set to the same required icon width in `rem` (reference: `1rem`) |
| Height, minimum height and maximum height | All set to `1rem` |
| Overflow | Hidden (`overflow: hidden`) |

Only the width may vary to suit the icon; update width, minimum width and maximum
width together. Keep the other settings as specified above. The reference's zero
value applies to the gap; its overflow setting is Hidden, not a numeric value.


Do not create SVG icons as:

- Custom DOM elements
- Plain text characters
- Unicode symbols
- Emojis
- Icon fonts

If an icon has a coloured, circular or shaped background:

1. Create a div wrapper for the background.
2. Place the SVG Code Embed inside that div.
3. Apply the required SVG Code Embed settings above, including the fixed `1rem` height, minimum height and maximum height.
4. Centre the Code Embed within the wrapper using native Webflow Flexbox controls.

Use `currentColor` for SVG fills and strokes where practical so the icon colour remains editable through Webflow styles.

## 4. Visual lists

Build styled visual lists with div elements, using native Webflow Flexbox or Grid
controls. Do not convert them to `<ul>`, `<ol>` or `<li>` elements.

Use `<ul>`, `<ol>` and `<li>` only for lists inside Rich Text elements.

Name containers that wrap a list with the `-list-wrapper` suffix, the list
itself with the `-list` suffix, and direct entries with the matching `-item`
suffix. For example:

- `pricing_check-list-wrapper`
- `pricing_check-list`
- `pricing_check-item`

A generic outer wrapper, icon wrapper or content wrapper may also use a div
where appropriate.

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

Set the required desktop gap values and let them inherit through tablet,
mobile landscape and mobile portrait. Add a breakpoint override only when the
required value differs from the value inherited at that breakpoint. Check the
horizontal and vertical gaps separately; override only the axis that changes.

If the desktop gap is unset or shown as `none`, leave the smaller-breakpoint gap
controls unset unless the design requires a change. Do not repeat `none`, zero,
or any other unchanged value at every breakpoint.

For example, if desktop uses `2rem` and tablet needs `1rem`, set the tablet override
to `1rem`. Leave both mobile breakpoints unset if they should also use `1rem`.
Remove redundant gap overrides when editing the affected styles, preserving the
intended appearance and allowing inheritance to work.

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

### Native settings, not custom attributes

Set everything that has a native Webflow setting through that setting, never as a
custom attribute. This includes:

- Links: URL or page, open in new tab, and `rel`, using the element's Link settings.
- Element ID, using the ID field.
- Image source and alt text, using the image settings.
- Form field name, type, placeholder and required state, using the form element settings.
- Heading level, tag and visibility, using the element settings.

Never add `href`, `target`, `rel`, `id`, `class`, `src`, `alt`, `name`, `type` or
`required` as custom attributes. A custom attribute can duplicate or conflict with
the native setting, and it isn't editable in the place a Designer user would
expect.

Use custom attributes only for things Webflow has no native setting for, such as
`aria-label`, `aria-hidden`, `data-*` hooks used by scripts, and `role`.

### Form construction and delivery

Configure every form and form control through Webflow's native settings. Give
each form a permanent, descriptive name and give every submitted control a
unique, human-readable field name. External processors receive the rendered
HTML `name` value, not the visible label, placeholder, element ID or the value
shown only in staged Designer settings.

For every form that is created or modified:

- Match each visible label's `for` value to the control's native element ID.
- Set the correct native field type, required state, placeholder and field name.
- Check the form action, method, redirect, success state and error state.
- Never duplicate native form settings with custom `name`, `type`, `required`,
  `action`, `method` or `id` attributes.
- Never log field values, `FormData`, submission payloads or other personal data
  to the browser console. Diagnostic logging may identify a form or status only
  when it contains no user-provided data and is removed before production.
- After publishing, inspect the live rendered HTML and confirm the form and every
  submitted control have the intended `name` and `data-name` values. A staged
  settings read-back is not proof of the published payload.
- Verify the live submission path with a controlled test when authorised, and
  confirm the external processor receives the intended field keys, success UI
  appears only after a successful response, and failure UI appears on error.

## 9. Borders

Use the border width, colour and radius required by the approved design. Reuse existing Webflow variables where suitable, but do not enforce a global border width across the site.

Use existing variables for border colours and border radius values.

Set each required border side explicitly using Designer-compatible properties.

## 10. Backgrounds

Build every background with the Style panel's Backgrounds controls so each layer
stays visible and editable in the Designer. Reuse colour variables for solid
colours and gradient stops wherever the Designer allows it.

### Layer types

| Need | How to build it |
| --- | --- |
| Solid colour | Background colour (`background-color`), using a colour variable where one fits. It always paints underneath every gradient and image layer. |
| Linear gradient | A linear gradient layer with an angle and colour stops, for example `linear-gradient(135deg, #fff7eb, #fff3e8)`. |
| Radial glow | A radial gradient layer written in the format described below. |
| Image | An image layer from the site's assets, with size, position and tiling set on that layer. Use background images for decoration only; content images use an Image element with alt text. |
| Tint or overlay | A linear gradient layer whose two stops are the same colour, placed above the layers it tints, for example `linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0.3))`. |

### Layer order

Layers stack in the order they are listed: the first layer in the Style panel,
and the first in the CSS value, is drawn on top. Order them as follows:

1. Overlay or tint
2. Radial glows
3. Base gradient or image
4. Background colour (always underneath, set separately)

To change an overlay's strength, change the alpha value in both of its stops.
Use a separate overlay element only when the tint has to sit above the
element's children, or needs its own animation or blend mode.

### Radial gradient syntax

Write radial gradients in the form the Designer's own controls produce: a shape
keyword, a size keyword and one position.

```css
radial-gradient(circle farthest-corner at 80% 15%, rgba(255,200,170,0.55) 0%, transparent 45%)
```

- Shape is `circle` or `ellipse`. Size is `closest-side`, `closest-corner`,
  `farthest-side` or `farthest-corner`. Position is a single `at X% Y%`.
- Never use explicit radius lengths, such as
  `radial-gradient(60% 50% at 85% 20%, ...)`. The Designer rewrites them as
  invalid CSS, for example `circle farthest-corner at 45% 50% 85% 20%`. The
  browser then drops the whole background, and the Style panel will not let you
  add or edit layers on that class.
- Control how far a glow spreads with its colour-stop percentages (for example
  `transparent 45%`), not with a radius.
- Do not put CSS comments inside a value (for example
  `none /* radial-gradient(...) */`). Delete unused layers instead.

### Broken gradients can stay hidden until the next edit

An explicit-size gradient can look fine in the browser for months. The problem
only appears when someone edits any property on that class in the Designer, for
example a radius or some padding. The Designer then re-saves the whole class,
rewrites the gradient into invalid CSS, and the background disappears. This
happened to the Who We Are tab panel when only its corner radius was changed.

- Never leave an explicit-size gradient in place, even when it currently renders
  correctly. Convert it as soon as you find it.
- To convert one, keep its colours and position, switch the shape and size to
  `ellipse farthest-side`, and adjust the transparent stop so the glow covers
  roughly the same area. The new stop is about the original radius multiplied by
  the original stop, divided by the distance from the position to the furthest
  edge. For example, `radial-gradient(40% 55% at 4% 40%, colour, transparent 70%)`
  becomes `radial-gradient(ellipse farthest-side at 4% 40%, colour, transparent 43%)`.

### Verifying backgrounds

After setting or changing a gradient, or any background with more than one
layer:

1. Read the style back and confirm the stored value matches what was set.
2. Confirm the value is valid in a real browser, using
   `CSS.supports('background-image', value)` or by checking that the computed
   `background-image` on the page is not `none`.
3. Confirm the layers appear in the Designer's Backgrounds panel and can be
   edited.
4. Sweep the whole site, not just the class you touched. Query every style
   whose `background-image` contains `radial-gradient`, and fix any value that
   uses explicit sizes, has two positions after `at`, or contains a comment.

If the Designer will not add a layer to an existing background, treat the
stored value as invalid. Rewrite it in the formats above instead of working
around it with an extra element or custom CSS.

## 11. Mobile optimisation and responsive behaviour

Always mobile-optimise every page, section and component that is built or modified.
Mobile optimisation is part of the task, even when it is not requested separately.
Review all styles affecting the work at every breakpoint, including inherited
styles, component states and shared classes. Apply any required adjustments
through native Webflow Style-panel controls.

Build and verify every section across Webflow's standard breakpoints:

- Desktop
- Tablet
- Mobile landscape
- Mobile portrait

Verify the inherited styling at every breakpoint. Add overrides only where the
required value changes; verification does not require duplicating inherited values.

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
- Typography, line heights and readable text sizes
- Margins, section spacing and alignment
- Navigation, buttons, forms and touch usability
- Visibility, stacking and interactive states

Check any additional breakpoints already enabled on the site, and representative
widths between breakpoints, for clipping, overlap and unintended horizontal scroll.
Do not mark mobile optimisation complete without checking the affected work on
both mobile landscape and mobile portrait. Report any breakpoint or behaviour
that could not be verified.

## 12. Existing structure and reusable classes

Inspect the existing page and style system before adding new elements or classes.

Reuse an existing class only when:

- It has the same purpose
- It requires the same styling
- Reusing it will not unintentionally change another section

Create a new Client-First class when the purpose or styling is different.

Do not overwrite a shared class to solve a section-specific problem.

## 13. Known Webflow limitations and workarounds

These problems have already come up in real builds. Apply the workaround
rather than rediscovering the problem.

### Designer and styling

| Problem | What to do |
| --- | --- |
| The Designer rewrites radial gradients that use explicit radius lengths into invalid CSS, and then blocks editing of that background. | Use the keyword syntax in section 10 and verify the value in a browser. |
| A Style panel control refuses a change or will not add a layer. | Check the class's stored value for invalid CSS first; an earlier invalid value usually causes this. |
| The Current state of tab links and nav links cannot be created as a combo class through the MCP. Asking for `w--current` creates an unrelated `_w--current` class. | Style the Current state in the Designer by selecting the link and choosing the Current state. If it has to be done without the Designer, use a narrowly scoped `.class.w--current` rule in an embed, and report it as a non-native exception. |
| Tabs, Tab Menu and Tab Content carry clearfix `::before` and `::after` pseudo-elements. When one of them is set to Grid, the pseudo-elements become grid items, take cell 1/1 and push the real children out of place. | Give each real child an explicit grid row and column, or use Flex with no gap on that element. |
| A Tabs element cannot contain a heading. | Place the section heading outside the Tabs element. |
| Centring items (`justify-content: center`) in a row that scrolls horizontally cuts off the first items on narrow screens, because content that overflows to the left cannot be scrolled to. | Align scrolling rows to the start, keep items on one line with `white-space: nowrap`, and check the first and last items at mobile widths. |
| Fixed, full-screen elements such as page loaders, overlays and modals can block scrolling and clicks after they have finished. | Hide them when they are inactive (`display: none`, or `pointer-events: none` while fading out), and check the whole page can still be scrolled to the bottom. |

### Content and third parties

| Problem | What to do |
| --- | --- |
| Ad blockers hide elements whose id, class or link target matches their filter lists. For example, EasyList's `###google-ads` hides any element with `id="google-ads"`, even on a page about advertising services. | Do not use `ad`, `ads`, `advert`, `sponsor`, `google-ads`, `banner-ad` or similar words in ids, classes or anchor links. Use neutral names such as `google-search` or `paid-search`, and check affected pages with an ad blocker switched on. |

### Webflow MCP

| Problem | What to do |
| --- | --- |
| The WHTML builder silently drops classes that do not exist yet. | Create the styles first with the style tool, then build the elements. |
| The element builder's `Section` type creates a Div Block with its tag set to `section`, not a native Section element. The WHTML builder's `<section>` creates a native Section. | Create sections with the WHTML builder (`<section class="section_...">`), then add children. Read the element back and confirm its type is `Section`, not `Block`. |
| The WHTML builder copies HTML attributes such as `href`, `target` and `rel` from `<a href="...">` into custom attributes instead of the native link settings. | Build links without those attributes, then set the link with the native link setting (`set_link`, or the `link` setting with `open_in_new_tab` and `rel`). Read the element back and remove any custom attribute that duplicates a native setting. |
| Setting visibility (hiding an element) can fail repeatedly with "[Conflict] The operation could not be applied to the component map", particularly on links and on newly created sections. | Don't keep retrying. Hide a child element that holds the content instead, or ask the user to hide the element in the Designer, and report which element still needs hiding. |
| The element builder ignores `set_text` on Text Blocks, leaving Webflow's default "This is some text inside of a div block." | Create Text Blocks with the WHTML builder (`<div class="...">Text</div>`), or read back and replace any default text before finishing. |
| Component text properties cannot be bound to Span elements. | Bind them to a Text Block, Heading or Paragraph instead. |
| Too many parallel calls return 429 rate-limit errors. | Keep to about six parallel calls, and pause before retrying. |
| Read-backs can differ from what was sent, because Webflow normalises some values. | Read every changed style back and compare it with the intended value before reporting the work as done. |

## 14. Final verification

Before completing any Webflow task, verify that:

- All classes use permanent Client-First names
- No temporary `v1` or `v2` classes remain
- Every section has a descriptive permanent class and no custom Navigator name
- Every thematic content section uses `<section>` and footers use `<footer>`
- Every section is a native Section element (type `Section`), not a Div Block with a `section` tag
- Links, IDs, image sources, alt text and form settings use native Webflow settings; no custom attribute duplicates a native setting (for example `href`, `target`, `rel` or `id`)
- All other elements use the correct semantic tags wherever applicable
- Visual lists use div `-list`/`-item` structures; `<ul>`/`<ol>`/`<li>` appear only inside Rich Text
- Tabular data uses native table elements with correctly identified headers
- Icons are SVGs inside Code Embeds
- SVG Code Embeds use column Flex, centred X/Y alignment, zero gaps, hidden overflow, matching width constraints and fixed `1rem` height constraints
- Existing Webflow variables are used
- Length values use `rem` wherever possible, with exact `1px` values kept as `1px`
- Every supported CSS declaration is set through native Webflow Style-panel controls
- Custom Properties and custom CSS are used only for behaviour unavailable natively
- Grid and Flex gaps use `grid-column-gap` and `grid-row-gap`
- Gap controls appear natively in the Designer
- Gap overrides exist only where values change; unchanged values inherit across breakpoints
- Backgrounds use native layers in the order overlay, glows, base; radial gradients use keyword syntax; every gradient or multi-layer value is confirmed valid in a browser and editable in the Designer
- No id, class or anchor link uses words that ad blockers hide
- Fixed or full-screen elements do not block scrolling or clicks once they are inactive
- All affected styles are reviewed across every breakpoint and the work is mobile-optimised
- Responsive adjustments use native controls and unchanged values inherit
- Existing JavaScript hooks, attributes and integrations remain intact
- The Navigator displays class names rather than custom renamed labels
- The finished structure appears correctly in the Webflow Navigator and Style panel

### Required completion report

Every Webflow task's completion report must include:

- **Mobile optimisation:** State which pages or components were checked and which
  breakpoints were verified. Identify anything unverified or still needing work;
  do not imply that a static code check proves visual or interactive behaviour.
- **Non-native styling:** List every non-native styling exception introduced,
  modified or retained in the affected work. For each one, give the page and
  element/class, CSS property and value, relevant breakpoint/state, where it is
  implemented (Custom Properties, Code Embed, custom CSS or script), and why a
  native Webflow control could not be used.

If no non-native styling remains in the checked work, explicitly report
"Non-native styling: none." If native-control compliance could not be checked,
state that limitation instead. An exception report does not permit bypassing an
available native control: convert supported declarations to native Webflow styles
before completion. Report any unresolved non-native implementation as outstanding
work, with its exact location.
