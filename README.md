# School Portal — sales demo

A self-contained, front-end-only demo of a school management product: admissions, parent communication, fee vouchers with online payment, attendance, gate lock, academics and reports. All data is fake and seeded; nothing is sent or charged. Some actions (official voucher print, accounting) show where the live product hands off to ERPNext.

## Run
Double-click `index.html`, or serve the folder (`python -m http.server`). Works on GitHub Pages as-is. State lives in the browser's `localStorage`; **Reset** (top right) restores the starting data.

## Demo tips
- Switch persona at the top: **Admin console**, **Teacher**, **Parent app**. The **Live phone** button docks the parent app beside the console so you can show changes landing in real time.
- **Guided demo** runs eight scripted scenarios (admissions, fee lifecycle, attendance alert, leave request, announcements, gate lock, reports, homework) that highlight what to click and can perform the step for you.

See `CLAUDE.md` for architecture and conventions.
