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
3. Set the SVG or Code Embed height using an explicit pixel value or percentage.
4. Centre the Code Embed within the wrapper using native Webflow Flexbox controls.

Use `currentColor` for SVG fills and strokes where practical so the icon colour remains editable through Webflow styles.

## 4. Visual lists

Build visual lists using div elements.

Use a structure such as:

- List wrapper div
- List item div
- Icon wrapper div, if required
- Content wrapper div

Do not use:

- `ul`
- `ol`
- `li`

Use appropriate ARIA attributes or roles when additional accessibility information is needed.

## 5. Tables

Always use `div` elements instead of native table elements unless explicitly instructed to use a table.

Do not use the following elements by default:

- `table`
- `thead`
- `tbody`
- `tfoot`
- `tr`
- `th`
- `td`

When presenting tabular-looking content without an explicit instruction to use a table, build it from clearly named `div` wrappers and items using native Webflow Flexbox or Grid controls.

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
- Visual lists use div elements
- Native table elements are only used when explicitly requested
- Icons are SVGs inside Code Embeds
- Existing Webflow variables are used
- Every supported CSS declaration is set through native Webflow Style-panel controls
- Custom Properties and custom CSS are used only for behaviour unavailable natively
- Grid and Flex gaps use `grid-column-gap` and `grid-row-gap`
- Gap controls appear natively in the Designer
- Responsive styles exist at the required breakpoints
- Existing JavaScript hooks, attributes and integrations remain intact
- The Navigator displays class names rather than custom renamed labels
- The finished structure appears correctly in the Webflow Navigator and Style panel
