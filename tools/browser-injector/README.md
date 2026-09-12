# Website Scripts Live Injector

This unpacked Chrome extension injects `sites/plausible.js` and
`sites/plausible.css` into `https://plausible.io/*`.

It checks the development tunnel every 1.5 seconds. When either file changes,
it updates the registered user script and reloads the matching Plausible tab.
If the development tunnel is unavailable, it falls back to the published
jsDelivr files.

## Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `browser-injector` folder.
4. Open the extension's **Details** page and enable **Allow User Scripts**.
5. Disable the old Plausible rule in User JavaScript and CSS.
6. Refresh the Plausible dashboard once.

The toolbar badge is green and reads `DEV` when local files are active, blue
and reads `LIVE` when the published fallback is active, or red and reads `ERR`
when neither source can be loaded.

## Developer shortcut

On a Plausible page, press **Alt+L** to reload this unpacked extension and then
reload the current page without opening `chrome://extensions`. A confirmation
toast appears after the page returns. After adding this feature or changing the
packaged extension files, reload the extension manually once; subsequent
reloads can use **Alt+L**.
