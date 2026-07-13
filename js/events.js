// Dynamic events loader for DJCHC.
//
// Data source: a Google Sheet published as CSV (same mechanism as js/news.js).
// See README section "Editing events" for the sheet setup steps.
//
// Expected columns (row 1 must be the header, in any order):
//   Title | Date | Time | Location | Description | Category | Published
// - Title:       short event name (plain text)
// - Date:        a date the browser can parse (e.g. "2026-08-20", "August 2026")
// - Time:        free text, e.g. "6:00 AM onwards" (optional)
// - Location:    free text venue (optional)
// - Description: the event details. Blank lines become paragraph breaks.
// - Category:    a short tag, e.g. "Festival", "Youth", "Seva" (optional)
// - Published:   TRUE / FALSE. Only TRUE rows are shown.

// Google Sheet "DJCHC Events", published to web as CSV (File -> Share -> Publish to web).
// To edit events, open the sheet, edit rows, then wait ~1-2 minutes for Google to
// refresh the published CSV. To swap the source, change this URL.
// A local fixture exists at data/events.csv (used for offline testing / column reference).
const EVENTS_SHEET_CSV_URL = "REPLACE_WITH_PUBLISHED_EVENTS_CSV_URL";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("events-list");
    if (!container) return;

    // If the sheet is not configured yet, fall back to the local fixture so the
    // page still renders beautifully during development / before publishing.
    const source = (!EVENTS_SHEET_CSV_URL || EVENTS_SHEET_CSV_URL.startsWith("REPLACE_"))
        ? "data/events.csv"
        : EVENTS_SHEET_CSV_URL;

    fetch(source, { cache: "no-store" })
        .then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.text();
        })
        .then(csv => {
            const rows = parseCsv(csv);
            if (rows.length < 2) {
                renderStatus(container, "No events available yet.", "info");
                return;
            }
            const header = rows[0].map(h => h.trim().toLowerCase());
            const idx = {
                title: header.indexOf("title"),
                date: header.indexOf("date"),
                time: header.indexOf("time"),
                location: header.indexOf("location"),
                description: header.indexOf("description"),
                category: header.indexOf("category"),
                published: header.indexOf("published")
            };
            if (idx.title === -1 || idx.date === -1 || idx.description === -1) {
                renderStatus(container, "Events sheet is missing required columns (Title, Date, Description).", "error");
                return;
            }

            const cell = (r, i) => (i === -1 ? "" : (r[i] || "").trim());

            const items = rows.slice(1)
                .map(r => ({
                    title: cell(r, idx.title),
                    date: cell(r, idx.date),
                    time: cell(r, idx.time),
                    location: cell(r, idx.location),
                    description: cell(r, idx.description),
                    category: cell(r, idx.category),
                    published: idx.published === -1 ? true : /^(true|yes|1|y)$/i.test(cell(r, idx.published)),
                    ts: Date.parse(cell(r, idx.date))
                }))
                .filter(e => e.published && e.title);

            if (items.length === 0) {
                renderStatus(container, "No events available yet.", "info");
                return;
            }

            renderEvents(container, items);
        })
        .catch(err => {
            renderStatus(container, "Could not load events right now. Please try again later.", "error");
            console.error("Events fetch failed:", err);
        });
});

function renderEvents(container, items) {
    // Midnight today, so an event happening later today still counts as upcoming.
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    for (const e of items) {
        e.isPast = !isNaN(e.ts) && e.ts < todayStart;
    }

    // Upcoming first (soonest at the top), then past events (most recent first).
    const upcoming = items.filter(e => !e.isPast)
        .sort((a, b) => sortByDate(a, b, true));
    const past = items.filter(e => e.isPast)
        .sort((a, b) => sortByDate(a, b, false));

    container.innerHTML = "";

    const filters = buildFilters();
    container.appendChild(filters.bar);

    const upSection = document.createElement("div");
    upSection.className = "event-group";
    upSection.dataset.group = "upcoming";
    if (upcoming.length) {
        upSection.appendChild(groupHeading("fa-star", "Upcoming Events"));
        upcoming.forEach(e => upSection.appendChild(renderEventCard(e)));
    } else {
        upSection.appendChild(emptyNote("No upcoming events scheduled right now. Please check back soon."));
    }
    container.appendChild(upSection);

    const pastSection = document.createElement("div");
    pastSection.className = "event-group";
    pastSection.dataset.group = "past";
    pastSection.style.display = "none";
    if (past.length) {
        pastSection.appendChild(groupHeading("fa-clock-rotate-left", "Past Events"));
        past.forEach(e => pastSection.appendChild(renderEventCard(e)));
    } else {
        pastSection.appendChild(emptyNote("No past events to show yet."));
    }
    container.appendChild(pastSection);

    // Filter behaviour: All / Upcoming / Past
    filters.bar.addEventListener("click", function (ev) {
        const btn = ev.target.closest(".event-filter-btn");
        if (!btn) return;
        const mode = btn.dataset.filter;
        filters.bar.querySelectorAll(".event-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        upSection.style.display = (mode === "past") ? "none" : "";
        pastSection.style.display = (mode === "upcoming") ? "none" : "";
    });
}

function sortByDate(a, b, ascending) {
    const da = a.ts, db = b.ts;
    if (isNaN(da) && isNaN(db)) return 0;
    if (isNaN(da)) return 1;
    if (isNaN(db)) return -1;
    return ascending ? da - db : db - da;
}

function buildFilters() {
    const bar = document.createElement("div");
    bar.className = "event-filters";
    bar.innerHTML = `
        <button class="event-filter-btn active" data-filter="upcoming"><i class="fas fa-star"></i> Upcoming</button>
        <button class="event-filter-btn" data-filter="all"><i class="fas fa-calendar-alt"></i> All</button>
        <button class="event-filter-btn" data-filter="past"><i class="fas fa-clock-rotate-left"></i> Past</button>
    `;
    // Default view shows only upcoming; toggle handler flips past visibility.
    return { bar };
}

function groupHeading(icon, text) {
    const h = document.createElement("h2");
    h.className = "event-group-heading";
    h.innerHTML = `<i class="fas ${icon}"></i> `;
    h.appendChild(document.createTextNode(text));
    return h;
}

function emptyNote(text) {
    const p = document.createElement("p");
    p.className = "news-status";
    p.textContent = text;
    return p;
}

function renderEventCard(e) {
    const card = document.createElement("article");
    card.className = "event-card" + (e.isPast ? " is-past" : "");

    // Left: a date badge (day + month + year). Falls back gracefully for free-text dates.
    const badge = document.createElement("div");
    badge.className = "event-date-badge";
    if (!isNaN(e.ts)) {
        const d = new Date(e.ts);
        badge.innerHTML =
            `<span class="edb-day">${d.getDate()}</span>` +
            `<span class="edb-month">${MONTHS[d.getMonth()]}</span>` +
            `<span class="edb-year">${d.getFullYear()}</span>`;
    } else {
        const span = document.createElement("span");
        span.className = "edb-text";
        span.textContent = e.date || "TBA";
        badge.appendChild(span);
    }
    card.appendChild(badge);

    // Right: the event body.
    const body = document.createElement("div");
    body.className = "event-body";

    const topRow = document.createElement("div");
    topRow.className = "event-top-row";
    const h3 = document.createElement("h3");
    h3.textContent = e.title;
    topRow.appendChild(h3);
    if (e.category) {
        const tag = document.createElement("span");
        tag.className = "event-tag tag-" + e.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        tag.textContent = e.category;
        topRow.appendChild(tag);
    }
    body.appendChild(topRow);

    const meta = document.createElement("div");
    meta.className = "event-meta";
    if (e.time) meta.appendChild(metaItem("fa-clock", e.time));
    if (e.location) meta.appendChild(metaItem("fa-location-dot", e.location));
    if (meta.childNodes.length) body.appendChild(meta);

    for (const para of e.description.split(/\n\s*\n/)) {
        const p = document.createElement("p");
        p.textContent = para.trim();
        if (p.textContent) body.appendChild(p);
    }

    card.appendChild(body);
    return card;
}

function metaItem(icon, text) {
    const span = document.createElement("span");
    span.className = "event-meta-item";
    span.innerHTML = `<i class="fas ${icon}"></i> `;
    span.appendChild(document.createTextNode(text));
    return span;
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
