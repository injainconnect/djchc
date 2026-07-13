# DJCHC — Digambar Jain Centre of Hi-Tec City, Hyderabad

Static website for the DJCHC community — two Digambar Jain temples serving the Hi-Tec City, Madhapur, Gachibowli, Nallagandla, and Financial District areas of Hyderabad.

Live pages: Home, News, Events, Library, Chaturmas 2026, Mahila Mandal, Pathshala, Contact.

## Tech stack

- Plain HTML + CSS + vanilla JavaScript
- No build step, no framework, no dependencies to install
- Font Awesome loaded from a CDN
- Deployable to any static host (GitHub Pages, Netlify, S3, etc.)

## Run locally

Serve the folder over HTTP (opening `index.html` directly with `file://` will break the dynamic news loader):

```bash
# From the repo root
python -m http.server 8000
```

Open http://localhost:8000.

Alternatives: `npx serve .` (Node), or the VS Code **Live Server** extension.

## Repo layout

```
├── index.html, about.html, news.html, events.html,
│   library.html, chaturmas.html, mahila-mandal.html,
│   pathshala.html, contact.html   ← one file per page
├── css/style.css                   ← all styling
├── js/
│   ├── common.js                   ← injects the shared nav + footer on every page
│   └── news.js                     ← fetches news from the Google Sheet and renders cards
├── data/
│   └── news.csv                    ← local fixture / reference schema for the news sheet
├── CLAUDE.md                       ← guidance for AI coding assistants
└── README.md
```

## Editing content

### News (dynamic — no redeploy required)

The News page reads live from a Google Sheet published as CSV. To update news:

1. Open the **DJCHC News** Google Sheet.
2. Add / edit / hide rows. Columns are **Title | Date | Body | Published**.
   - Set `Published` to `TRUE` to show a row, `FALSE` to hide it.
   - `Date` can be `YYYY-MM-DD` (best), `Month YYYY`, or free text. Numeric dates sort newest-first automatically.
   - Blank lines inside a `Body` cell (Alt+Enter) become paragraph breaks on the site.
3. Google republishes the CSV automatically. Changes appear on the site within ~1–2 minutes (occasionally up to 5).

**Wiring:** the sheet's published CSV URL is set in `js/news.js` → `NEWS_SHEET_CSV_URL`. To swap sheets, replace that URL.

**Local fallback:** `data/news.csv` mirrors the same schema and can be used for offline testing by pointing `NEWS_SHEET_CSV_URL` at `"data/news.csv"`.

### All other pages

Edit the corresponding `.html` file directly, commit, and push (site redeploys via your static host).

## Adding a new page

1. Copy an existing page (e.g. `about.html`) as your starting point — every page uses the same skeleton.
2. Update the `<title>`, banner, and section content.
3. **Add the page to the nav** — edit the appropriate array in `js/common.js`:
   - For main navigation: add to the `links` array
   - For "Important Initiatives" dropdown: add to the `initiatives` array
4. Reuse existing style classes (`.card`, `.highlight`, `.contact-grid`, `.book-grid`) rather than adding new ones.

## Deployment

Push to `main` — if this repo is served via GitHub Pages (or any auto-deploying static host), the site updates automatically. No build to run.

Note: for the News feature, only the *initial* wiring requires a deploy. After that, all news edits happen in the Google Sheet.
