# School Portal — sales demo

This is a self-contained, front-end-only demo of **School Portal**, a school
management product for schools in Pakistan. It's meant to be shown to a
prospective school (admin, teacher, and parent views) to demonstrate what the
real product will look and feel like.

**All the data you see (students, parents, teachers, fees, attendance) is
fake and generated automatically inside the browser.** There is no server,
no database, and no real student information anywhere in this project.

## What's real vs. simulated

- This is a **front-end-only demo**. There is no backend, no server, and no
  real database — everything runs in the visitor's browser.
- All students, parents, teachers, fee vouchers and attendance records are
  **randomly generated fake data**, seeded the same way every time so the
  demo always looks the same.
- Nothing typed or clicked in the demo is saved anywhere except the current
  browser's own local storage (`localStorage`) on the current device. Open it
  on a different device or browser and it starts fresh.
- "Payments", "notifications sent to parents", and "SMS/WhatsApp alerts" are
  **simulated** — clicking those buttons updates the on-screen demo data and
  shows a confirmation toast, but nothing is actually charged, texted, or
  emailed to anyone.
- The **Modules** screen (Admin ▸ Modules) is an honest snapshot of what's
  actually built today vs. what's still in progress — locked modules are
  clearly marked and explained, not just hidden.
- Use the **"Reset demo data"** link (top right, in the Admin view) at any
  time to wipe the browser's local copy and start over with fresh seeded
  data.

Please keep this distinction in mind when demoing it to a school — it's a
realistic **preview** of the product, not the product itself yet.

## Running it locally

No installation or build step is required — it's plain HTML, CSS, and
JavaScript. Two ways to view it:

1. **Just open it.** Double-click `index.html` (or drag it into a browser
   tab). Nearly everything works this way.
2. **Or use a tiny local server** (recommended, and needed for the "Mobile
   preview" role, which loads `index.html` again inside an iframe — some
   browsers restrict that over a plain `file://` link):
   ```
   cd school-portal
   python3 -m http.server 8000
   ```
   then open `http://localhost:8000` in your browser.

## Publishing it for free with GitHub Pages

You don't need to know `git` to do this — GitHub's website lets you upload
files directly. Steps below use the web UI, with the `git` command-line
alternative noted at the end for anyone who's comfortable with it.

1. **Create a GitHub account** at [github.com](https://github.com) if you
   don't already have one.
2. **Create a new repository.**
   - Click the **+** icon (top right) → **New repository**.
   - Name it something like `school-portal` (the name becomes part of your
     web address — see step 5).
   - Leave it **Public**, and don't check any of the "initialize with"
     boxes.
   - Click **Create repository**.
3. **Upload the files.**
   - On your new (empty) repository's page, click **uploading an existing
     file** (or **Add file → Upload files**).
   - Drag in every file from this folder: `index.html`, `styles.css`,
     `app.js`, `favicon.svg`, `README.md`, `LICENSE`, and `.gitignore`.
   - Scroll down and click **Commit changes**.
4. **Turn on GitHub Pages.**
   - Go to your repository's **Settings** tab.
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment → Source**, choose **Deploy from a
     branch**.
   - Under **Branch**, choose **main** and folder **/ (root)**, then click
     **Save**.
   - GitHub will take a minute or two to publish the site.
5. **Find your live link.**
   - Refresh the Settings → Pages screen — it will show a message like
     "Your site is live at `https://<your-username>.github.io/<repo-name>/`".
   - That's the link you can now send to anyone — it works on phones,
     tablets, and computers, and needs nothing installed.

### Updating it later

Whenever you want to change something (fix text, tweak a color, replace a
file):
- **Web UI:** open the file in your repository, click the pencil (✎) "edit
  this file" icon, make your change, and click **Commit changes**. GitHub
  Pages redeploys automatically within a minute or two.
- **Or replace a file:** use **Add file → Upload files** again with the new
  version — uploading a file with the same name overwrites the old one.
- **`git` command-line alternative**, if you're comfortable with it:
  ```
  git clone https://github.com/<your-username>/<repo-name>.git
  cd <repo-name>
  # copy in your updated files
  git add .
  git commit -m "Update school portal demo"
  git push
  ```

## License

See [`LICENSE`](./LICENSE) — MIT by default, which is a permissive choice
that lets you (and anyone you share this with) freely use, copy, and modify
the code. It's your product, so feel free to pick a different license or
remove it if you'd rather keep the code fully proprietary/unlicensed.
