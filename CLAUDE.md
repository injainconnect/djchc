# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static informational website for **DJCHC — Digambar Jain Centre of Hi-Tec City, Hyderabad** (a temple community). Plain HTML + CSS + a small amount of vanilla JS. No build step, no bundler, no npm, no framework, no server-side code. Font Awesome is loaded from a CDN.

## Running locally

The site must be served over HTTP (not `file://`) because `js/news.js` uses `fetch()` for the CSV data source. Any static server works:

```
python -m http.server 8000
```

Then browse to http://localhost:8000. There are no tests, no linter, no build.

## Architecture

### Shared chrome via `js/common.js`

Every page has empty placeholders:

```html
<nav id="common-nav"></nav>
...
<footer id="common-footer"></footer>
<script src="js/common.js"></script>
```

`js/common.js` injects the nav and footer at `DOMContentLoaded`, and sets the `active` class on the nav link matching `location.pathname`. **When you add a new page, you must also add its entry to the appropriate array in `js/common.js`** — either the main `links` array or the `initiatives` array for the "Important Initiatives" dropdown. The HTML file alone will not surface in the nav.

### Page skeleton

Every page follows the same structure — copy an existing page rather than writing HTML from scratch:

```html
<head> ...same CDN + css/style.css... </head>
<body>
  <nav id="common-nav"></nav>
  <div class="banner"> <h1>...</h1> <p>...</p> </div>
  <div class="container">
    <section> <h2>...</h2> ... </section>
  </div>
  <footer id="common-footer"></footer>
  <script src="js/common.js"></script>
</body>
```

Reusable style hooks in `css/style.css`: `.banner`, `.container`, `.card`, `.highlight`, `.contact-grid` (2-col), `.book-grid` (2-col). Prefer these over new classes.

### Dynamic news pattern (extendable to other pages)

`news.html` is the one exception to "static content". It renders an empty `<div id="news-list">` and defers to `js/news.js`, which:

1. Fetches a Google Sheet published as CSV (`NEWS_SHEET_CSV_URL` constant at the top of the file)
2. Parses with an inline RFC-4180-ish parser (`parseCsv`) — no external deps
3. Filters `Published=TRUE`, sorts by `Date` descending
4. Renders one `.card` per row using `textContent` (not `innerHTML`) so cell content can't inject markup

`data/news.csv` is a **local fixture** with the same schema — used for offline testing and as reference for the column layout (`Title | Date | Body | Published`). Do not delete it.

If asked to make another page dynamic (events, chaturmas, library), replicate this pattern: separate `js/<page>.js`, its own sheet or its own tab (each tab has a distinct `gid` in the publish URL), and matching `data/<page>.csv` fixture.

### Content editing model

- News content: edit the Google Sheet, not the code. Changes propagate in ~1–2 minutes (Google's publish-to-web CSV cache).
- All other pages: content lives in the HTML directly — edit and redeploy.
- Chaturmas page embeds a Google Form and a WhatsApp invite link — if those URLs need changing, they're in `chaturmas.html`.

### Cross-page duplication to watch

`contact.html` duplicates the "Who We Are / Our Values / What We Do" sections from `about.html`. If asked to update DJCHC's mission/values wording, update both files.

## Conventions

- Two-space indent in HTML, four-space indent in JS (matches existing files).
- Do not introduce a build step, package.json, or framework. The zero-tooling nature is intentional — trustees edit files directly.
- Do not inline the Font Awesome CSS or vendor it locally unless explicitly asked; the CDN is fine.
- User-facing text is bilingual (English + Hindi in Devanagari). Preserve Devanagari characters exactly; do not transliterate.
- Line endings: repo is edited on Windows; git may warn about LF↔CRLF conversion — safe to ignore.
