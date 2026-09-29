# CLAUDE.md — School Portal sales demo

Source of truth for scope, stack, and rules. Read before changing code.

## 1. What this is
A **front-end-only, click-through sales demo** of a school management product for schools in Pakistan, shown to a prospective client next to a verbal pitch. It shows the feature set we will deliver. It is not the product; there is no backend.

- **Audience:** school owners / principals. Non-technical. They judge on clarity, polish, and "does it cover what I need".
- **Benchmark:** Skoolify (competitor). Match its feature set, beat it on cleanliness and flow.
- **Live-feel rule:** even though nothing is real, each feature must *play like the live product* — realistic states (draft → sent, pending → approved, processing → success), delivery trackers, push banners, receipts. Never a bare toast where the real product would show a flow.

## 2. Stack & constraints
- **Vanilla HTML/CSS/JS. No build step, no npm, no framework, no CDN, no network calls.** Opens by double-clicking `index.html` and works on GitHub Pages.
- Plain `<script>` files on a shared `window.SP` namespace (no ES modules — they break on `file://`). Modern JS (const/arrow/template literals) is fine.
- Deterministic seeded data (`data.js`, `data2.js`); "today" is the fixed `SP.TODAY` (Tue 29 Sep 2026). Never `Math.random()` for seed content.
- One mutable `SP.S` state, persisted to `localStorage` key `sp_demo_v3` (bump `VER` in `core.js` and the key if the shape changes). Reset = clear key + reload.
- **Big fixed content is a constant, not state** (notes, resources, question bank, seeded assignments/events). State holds only additions, overrides and responses (`S.assign`, `S.subs`, `S.asgOv`, `S.consents`, `S.rsvps`…) so `localStorage` stays small and saves stay fast. Derived seeds (e.g. `SP.sub`, `SP.markOf`, `SP.consent`) fall back to a hash of ids unless a real response exists; the current demo family is always "real" (never auto-filled).
- Simulated side effects (payments, WhatsApp/SMS/push, gate hardware) only mutate demo state. Nothing is sent or charged.
- Fake data only. Currency via `SP.pkr`.

## 3. Views (personas)
Admin, Teacher, Front desk (`staff`), and two phone apps: Parent and Student. Teacher and Front desk reuse admin pages through `SP.pageFn` (falls back to `admin.<route>`); pages check `SP.S.persona` to scope data (a teacher only sees their own classes/subjects). Both phone apps share one shell and screen registry; `SP.phoneRole()` says which is active (docked role is `S.dockRole`).

## 4. File map (`js/`, load order = `index.html`)
- `data.js` — people, classes, teachers, attendance history, timetable, seed builders. Teacher allocation is `(ci*2 + si*3) % 24`, which makes timetables clash-free — don't change it casually.
- `data2.js` — question bank, notes, resources, assignments, exams + marks derivation, quizzes accessor, events, circulars, consent forms, admission enrichment, visitors, system-status seeds.
- `core.js` — state (`freshState`), selectors, `SP.notify` (role-aware: `who: both|parent|student`)/`SP.push`/`SP.toast`, event delegation (`data-act`, `data-in`, `data-ch`), render engine (keeps scroll + input focus).
- `ui.js` — icons, pills, tables, tiles, SVG charts, CSV. `shell.js` — top bar, persona switcher, sidebars, overlays, **delivery tracker** (`SP.deliver`).
- `admin.js` dashboard/comms/announcements/gate · `admin2.js` parents, students + ERP drawer, fees, four reports, teacher attendance/diary/timetable · `admissions.js` admission file (documents, assessment, fee gate) · `learn.js` assignments, quizzes, notes, resources · `exams.js` exams, marks entry, report cards, timetables + cover, subject workspace · `school.js` calendar, circulars, consents, staff & roles, front desk, teacher home · `system.js` system status · `reports.js` reports hub + fee/exam/coursework/admission reports · `erp.js` ERPNext hand-off.
- `parent.js` phone shell (tabs, nav stack, home, fees, chat) · `phone2.js` learning/results/calendar/notices/consents screens · `tour.js` guided flows · `main.js` boot.

## 5. Conventions
- Pages register as `SP.pages['admin.<route>']`; actions as `SP.act.<name>` via `data-act`; text filters via `SP.inp.filter` (`SP.f(key)` reads them); modals `SP.modals.<n>`, drawers `SP.drawers.<n>` (set `.wide = true` for wider). Phone tabs register in `SP.pt.<tab>`, phone sub-screens in `SP.ps.<name>` (sub = `name:arg:arg`, navigated with `phSub` / `phBack`).
- Every action mutates `SP.S`, then `SP.render()`. Escape user strings with `SP.esc`. Inputs inside modals are uncontrolled and read with `$v(id)` on submit; use `data-in` handlers that don't re-render for builders that must survive re-rendering.
- Cross-persona effects are the point: an admin/teacher action must show up in the phone (push banner via `SP.notify`, plus the relevant screen) and vice versa.
- Push banners deep-link with `SP.deepLink(kind, ref)`; give every new `notify` a `kind` and `ref`.
- New feature checklist: seed data → state field in `freshState()` → nav entry (`shell.js`) → page → phone screen if parents/students see it → a `FLOWS` entry in `tour.js` with `data-tour` targets → works at 390px.

## 6. ERPNext hand-offs
The live product delegates accounting to ERPNext. In the demo, only the highest-value hand-offs show the "Opens in ERPNext — demo only" prompt (`SP.act.erp`, `erp.js`): print official fee voucher, settlement reconciliation, and the Accounting section. Do **not** gate other features this way.

## 7. Scope
Built: dashboard, admissions (documents, assessment, fee-gated admit, board view), parent communications, announcements, circulars + invitations (read receipts, RSVP), parental consent forms, events & calendar, gate lock, parents/students/ERP profile, staff directory + roles matrix, front desk (visitors, gate pass), timetables with substitute cover, subject workspace, assignments (post/submit/grade), online quizzes (builder, timed attempt, results), notes and resource library, exams (marks entry, publish, report cards, datesheet), fee vouchers, reports hub + 8 reports, system status, teacher home/attendance/diary, parent app, student app, 14 guided flows.
Out of scope: real auth, payments, messaging, databases, APIs, i18n/RTL, tests/CI, dark mode.

## 8. Verification
No node/python needed. Use headless Chrome against scratch pages that load the scripts and (a) render every route for every persona plus every phone tab/sub-screen/modal/drawer, reporting `window.onerror` and stray `undefined`/`NaN`; (b) walk every guided flow, checking each `data-tour` target exists and each act runs; (c) assert behaviours (assignment lifecycle, fee-gated admission, publish → report card, consents, RSVPs). Re-run all three after any edit — a stray apostrophe in one file silently breaks everything after it. Screenshot key screens at 1500×900, ~1100 wide and ~390 wide (headless Chrome won't go below ~500px: use an iframe). Keep the harness pages outside the repo (they can load the scripts by absolute `file://` path), or delete them before committing. A useful set: render sweep, flow walker, behaviour assertions, motion-flag checks (`getComputedStyle(el).animationName`), and real `.click()` / `KeyboardEvent` interaction.

## 9. Design system (Apple-inspired — keep it consistent)
- **One accent** (`--brand` #0071e3). Colour is for meaning only: red/amber values and pills appear only when something needs attention (zero-value tiles stay neutral). Presenter chrome (Guided demo, Reset) is neutral/dark so it never competes with product actions.
- **Type:** system font, large-title page headers (32px/700), 13px gray secondary text, tabular numerals for money and counts. Sentence-case table headers, no ALL-CAPS labels except phone section headers.
- **Surfaces:** `--bg` #f5f5f7 canvas, white cards with a hairline shadow (no borders), 16px radius; sheets/drawers float inset with 22px radius over a blurred scrim.
- **Actions:** at most one filled primary per view. Row actions in tables are quiet text buttons (`.tbl .btn`), the main row action gets the tinted variant (`.pri`).
- **Motion (Apple HIG):** motion explains a change, never decorates — 200–450 ms, ease-out (`--sheet` = iOS sheet curve, `--ease`), a few px of movement plus opacity, nothing loops except the two "live" indicators and the demo highlight. **Never put an entrance animation on an element itself**: the whole tree re-renders on every click, so it would replay. Instead `SP.render` (core.js) diffs against the previous render and sets flag classes on `#app` (`a-page`, `a-push`, `a-pop`, `a-tab`, `a-modal`, `a-drawer`, `a-tour`, `a-step`, `a-banner`, `a-dv`); CSS animates only under a flag (see the MOTION block at the end of `styles.css`). Flags are carried for one tick so a click that renders twice still animates once. Closing sheets, banners and the tour card leave a `.ghost` copy that fades out; selected segments slide via a FLIP animation. Bars, charts and rings draw themselves in on page/screen change. Everything respects `prefers-reduced-motion` (CSS and JS). Saves are debounced (`SP.save` -> `SP.saveNow`).
- **Phone:** iOS grouped-list language — `#f2f2f7` background, white inset cards, translucent tab/nav bars, 50px primary buttons; student app uses the same shell.
- Don't scope generic class names (`.brand`, `.s`, `.r`, `.rd`) globally — `.tile.brand` once inherited the top bar's `.brand span` rule, and a report-card `.rd` picked up the phone's radio-dot style.
