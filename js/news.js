// Dynamic news loader for DJCHC.
//
// Data source: a Google Sheet published as CSV.
// See README section "Editing news" for the sheet setup steps.
//
// Expected columns (row 1 must be the header):
//   Title | Date | Body | Published
// - Title:     short headline (plain text)
// - Date:      any date the browser can parse (e.g. "2026-07-13", "July 2026")
// - Body:      the news paragraph. Blank lines become paragraph breaks.
// - Published: TRUE / FALSE. Only TRUE rows are shown.

// Google Sheet "DJCHC News", published to web as CSV (File → Share → Publish to web).
// To edit news content, open the sheet, edit rows, then wait ~1-2 minutes for Google
// to refresh the published CSV. To swap the source, change this URL.
// A local fallback exists at data/news.csv (used only if you point this back to it).

const NEWS_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQEFDbwxcUW1afkQzY4zl2d85lvK9GSsSIAynsPbiSviDoxFiUg3MEuHVx888B04xGAvLnj4l0QeC9J/pub?output=csv";

document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("news-list");
    if (!container) return;

    if (!NEWS_SHEET_CSV_URL || NEWS_SHEET_CSV_URL.startsWith("REPLACE_")) {
        renderStatus(container, "News source is not configured yet. An admin needs to publish the Google Sheet and set NEWS_SHEET_CSV_URL in js/news.js.", "warn");
        return;
    }

    fetch(NEWS_SHEET_CSV_URL, { cache: "no-store" })
        .then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.text();
        })
        .then(csv => {
            const rows = parseCsv(csv);
            if (rows.length < 2) {
                renderStatus(container, "No news items available yet.", "info");
                return;
            }
            const header = rows[0].map(h => h.trim().toLowerCase());
            const idx = {
                title: header.indexOf("title"),
                date: header.indexOf("date"),
                body: header.indexOf("body"),
                published: header.indexOf("published")
            };
            if (idx.title === -1 || idx.date === -1 || idx.body === -1) {
                renderStatus(container, "News sheet is missing required columns (Title, Date, Body).", "error");
                return;
            }

            const items = rows.slice(1)
                .map(r => ({
                    title: (r[idx.title] || "").trim(),
                    date: (r[idx.date] || "").trim(),
                    body: (r[idx.body] || "").trim(),
                    published: idx.published === -1 ? true : /^(true|yes|1|y)$/i.test((r[idx.published] || "").trim())
                }))
                .filter(n => n.published && n.title)
                .sort((a, b) => {
                    const da = Date.parse(a.date);
                    const db = Date.parse(b.date);
                    if (isNaN(da) && isNaN(db)) return 0;
                    if (isNaN(da)) return 1;
                    if (isNaN(db)) return -1;
                    return db - da;
                });

            if (items.length === 0) {
                renderStatus(container, "No news items available yet.", "info");
                return;
            }

            container.innerHTML = "";
            for (const n of items) {
                container.appendChild(renderCard(n));
            }
        })
        .catch(err => {
            renderStatus(container, "Could not load news right now. Please try again later.", "error");
            console.error("News fetch failed:", err);
        });
});

function renderCard(n) {
    const card = document.createElement("div");
    card.className = "card";

    const h3 = document.createElement("h3");
    h3.textContent = n.title;
    card.appendChild(h3);

    if (n.date) {
        const dateDiv = document.createElement("div");
        dateDiv.className = "date";
        dateDiv.innerHTML = '<i class="fas fa-calendar"></i> ';
        dateDiv.appendChild(document.createTextNode(n.date));
        card.appendChild(dateDiv);
    }

    for (const para of n.body.split(/\n\s*\n/)) {
        const p = document.createElement("p");
        p.textContent = para.trim();
        if (p.textContent) card.appendChild(p);
    }

    return card;
}

function renderStatus(container, message, kind) {
    const color = kind === "error" ? "#c0392b" : kind === "warn" ? "#b8860b" : "#666";
    container.innerHTML = "";
    const p = document.createElement("p");
    p.className = "news-status";
    p.style.color = color;
    p.textContent = message;
    container.appendChild(p);
}

// Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes ("")
// and newlines inside quoted cells. Google Sheets' published CSV follows this.
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else { inQuotes = false; }
            } else {
                field += c;
            }
        } else {
            if (c === '"') inQuotes = true;
            else if (c === ',') { row.push(field); field = ""; }
            else if (c === '\n' || c === '\r') {
                if (c === '\r' && text[i + 1] === '\n') i++;
                row.push(field); field = "";
                if (row.length > 1 || row[0] !== "") rows.push(row);
                row = [];
            } else {
                field += c;
            }
        }
    }
    if (field !== "" || row.length > 0) {
        row.push(field);
        if (row.length > 1 || row[0] !== "") rows.push(row);
    }
    return rows;
}
