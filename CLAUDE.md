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
- Deterministic seeded data (`data.js`); "today" is the fixed `SP.TODAY` (Tue 29 Sep 2026). Never `Math.random()` for seed content.
- One mutable `SP.S` state, persisted to `localStorage` key `sp_demo_v2` (bump `VER` in `core.js` if the shape changes). Reset = clear key + reload.
- Simulated side effects (payments, WhatsApp/SMS/push, gate hardware) only mutate demo state. Nothing is sent or charged.
- Fake data only. Currency via `SP.pkr`.

## 3. File map (`js/`, load order = `index.html`)
- `data.js` — seeds: classes, teachers, staff, parents, students, attendance/gate history, timetable, quizzes, fees/applicants/threads/announcements/diary builders.
- `core.js` — state, selectors (`SP.owed`, `SP.locked`…), `SP.notify`/`SP.push`/`SP.toast`, delegated events (`data-act`, `data-in`, `data-ch`), render engine (keeps scroll + input focus).
- `ui.js` — icons, pills, tables/pagination, tiles, SVG charts, CSV.
- `shell.js` — top bar, persona switcher, sidebars, overlays, **delivery tracker** (`SP.deliver`).
- `admin.js` — dashboard, admissions, communications, announcements, gate lock.
- `admin2.js` — parents, students + ERP drawer, academics, fees, reports, teacher pages.
- `erp.js` — ERPNext hand-off modal + Accounting page.
- `parent.js` — parent phone app. `tour.js` — guided demo flows. `main.js` — boot.

## 4. Conventions
- Pages register as `SP.pages['admin.<route>']`; actions as `SP.act.<name>` triggered by `data-act`; text filters via `SP.inp.filter` (`SP.f(key)` reads them); modals `SP.modals.<n>`, drawers `SP.drawers.<n>`.
- Every action mutates `SP.S`, then `SP.render()`. Escape user strings with `SP.esc`.
- Cross-persona effects are the point: admin actions must show up in the parent phone (docked "Live phone") and vice versa.
- New feature checklist: seed data → state field in `freshState()` → nav entry → page → a `FLOWS` entry in `tour.js` with `data-tour` targets → works at 390px.

## 5. ERPNext hand-offs
The live product delegates accounting to ERPNext. In the demo, only the highest-value hand-offs show the "Opens in ERPNext — demo only" prompt (`SP.act.erp`, `erp.js`): print official fee voucher, settlement reconciliation, and the Accounting section (ledgers, journal, trial balance). Do **not** gate other features this way.

## 6. Scope
Built: dashboard, admissions pipeline, parent communications (chat + leave approval), announcements, gate lock, parents/students/ERP profile, academics (allocation, assignments, quizzes), fee vouchers (generate/send/pay/reconcile), four reports, teacher attendance/diary/timetable, parent app (fees + online pay, diary, chat, alerts, attendance, timetable, results), 8 guided flows.
Out of scope: real auth, payments, messaging, databases, APIs, i18n/RTL, tests/CI.

## 7. Verification
No node/python needed. Use headless Chrome against a scratch page that loads the scripts, walks every route/modal/drawer and each guided flow, and reports `window.onerror`. Screenshot key screens at 1500×900 and ~390 wide. Do not commit scratch files.

## 8. Design system (Apple-inspired — keep it consistent)
- **One accent** (`--brand` #0071e3). Colour is for meaning only: red/amber values and pills appear only when something needs attention (zero-value tiles stay neutral). Presenter chrome (Guided demo, Reset) is neutral/dark so it never competes with product actions.
- **Type:** system font, large-title page headers (32px/700), 13px gray secondary text, tabular numerals for money and counts. Sentence-case table headers, no ALL-CAPS labels except phone section headers.
- **Surfaces:** `--bg` #f5f5f7 canvas, white cards with a hairline shadow (no borders), 16px radius; sheets/drawers float inset with 22px radius over a blurred scrim.
- **Actions:** at most one filled primary per view. Row actions in tables are quiet text buttons (`.tbl .btn`), the main row action gets the tinted variant (`.pri`).
- **Motion:** spring easing (`--spring`) for entrances, `--ease` for hovers; all of it disabled under `prefers-reduced-motion`.
- **Phone:** iOS grouped-list language — `#f2f2f7` background, white inset cards, translucent tab/nav bars, 50px primary buttons.
- Don't scope generic class names (`.brand`, `.s`, `.r`) globally — `.tile.brand` once inherited the top bar's `.brand span` rule.
