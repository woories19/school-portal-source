# School Portal — sales demo

A self-contained, front-end-only demo of a school management product for schools in Pakistan. It covers admissions, parent communication, fee vouchers with online payment, live attendance, assignments, quizzes, notes, exams and report cards, events, circulars and consent forms, staff and roles, reports, and a system-status view. All data is fake and seeded; nothing is sent or charged. Some actions (official voucher print, accounting) show where the live product hands off to ERPNext.

## Run
Double-click `index.html`, or serve the folder (`python -m http.server`). Works on GitHub Pages as-is. State lives in the browser's `localStorage`; **Reset** (top right) restores the starting data.

## Five views
Switch at the top: **Admin**, **Teacher**, **Front desk**, **Parent** (phone app) and **Student** (phone app). The **Live phone** button docks the parent or student phone beside the admin, teacher or front-desk console so you can show changes landing in real time.

## Demo tips
- **Guided demo** (top right) has 14 scripted scenarios in four groups. Each step highlights what to click and can perform it for you: admissions with a fee gate, fee lifecycle, live attendance and gate pass, parent messaging, announcements, assignments, quizzes, exams to report card, circulars and consents, events with RSVP, reports, gate lock, system status and teacher notes.
- The demo family is a parent with two children. Use the picker in the top bar to look through another parent or student.
- Sending a circular, publishing results or posting an assignment shows a delivery tracker, as the live messaging pipeline would.

See `CLAUDE.md` for architecture and conventions.
