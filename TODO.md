# Troski Police — To do

_Last updated: 2026-10-22_

Troski Watch is a mobile-first MVP for passengers to report dangerous trotro driving in Ghana, written as a single React 18 + htm app (loaded from CDN, no bundler) and built by a small Node script into `dist/` for Vercel. The reporter works end to end in the browser, but reports are stored only in localStorage; there has been no work since 2026-04-03.

## Done
- Set up the project with `apps/` templates: `troski-reporter`, `troski-dashboard`, `nanaplay-home`, `nanaplay-player` and the `heritage-pulse` design spec (Apr 2026)
- Node scripts: `npm run dev` / `preview` static server and `npm run build`, which copies `troski-reporter` into `dist/`
- `vercel.json` with build command, `dist` output and SPA rewrite
- Reporter app with Home, Capture, Vehicle, Cases and Help tabs and eight incident types
- Vehicle QR scan through `BarcodeDetector`, with demo DVLA payloads and manual entry as fallback
- Photo, video and audio evidence capture inputs; reports and drafts saved to localStorage
- Hand-off to police through the share sheet, a prefilled WhatsApp message and emergency numbers (191, 112, 1526)
- First-run onboarding walkthrough and reorganised navigation (Apr 2026)

## To do
- [ ] Add a README covering what the app is, `npm run dev` / `build` / `preview`, and the Vercel deploy
- [ ] Decide where reports go beyond the device; today they live only in localStorage (`troski-watch-reports-v1`)
- [ ] Rewrite the `HOTSPOTS` copy in `apps/troski-reporter/app.js`; tags like "88% passenger match" and "New episode" are left over from the streaming template
- [ ] Pin exact React and ReactDOM versions in `apps/troski-reporter/code.html` (it loads `react@18` and `react-dom@18` from unpkg)
- [ ] Add a QR fallback for browsers without `BarcodeDetector`; the scan currently throws there
- [ ] Confirm the numbers in `OFFICIAL_CHANNELS` (191, 112, 1526 and the police WhatsApp number) before any public release
- [ ] Decide whether `troski-dashboard` gets built and deployed; the build script ships only the reporter
- [ ] Move the unrelated NanaPlay templates (`nanaplay-home`, `nanaplay-player`) and `heritage-pulse` out of this repo, or note why they are here
- [ ] Test camera, microphone, file capture, share sheet and WhatsApp hand-off on a real phone

## Notes
- Branch `main`, in sync with `origin/main`; working tree clean. Last commit 2026-04-03.
- `dist/` exists locally but is git-ignored; Vercel rebuilds it from `npm run build`.
