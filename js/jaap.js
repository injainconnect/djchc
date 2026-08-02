// Dynamic jaap loader for DJCHC.
//
// Data sources — Google Sheets published as CSV, same pattern as
// js/news.js.
//
// One-form-per-jaap model:
//   - JAAPS_SHEET_CSV_URL          →  registry of jaaps (Jaaps tab)
//   - each jaap row has its own    →  submissions_csv_url pointing at
//                                     a dedicated Google Form's tab
//
// Trustees replace JAAPS_SHEET_CSV_URL with the published-to-web CSV
// URL of the Jaaps tab. Each jaap row's submissions_csv_url is the
// published URL of its dedicated Submissions-<id> tab.
//
// Two views, controlled by the URL:
//   jaap.html                                → list of active jaaps
//   jaap.html?id=<jaap_id>                   → single-jaap detail
//
// Expected columns:
//   Jaaps tab:         id | mantra_devanagari | mantra_transliteration
//                      | description | target_count | starts_at
//                      | deadline_at | submissions_form_url
//                      | submissions_csv_url | visibility | status
//
//   Submissions-<id>:  Timestamp | Name | Count | Note
//                      (auto-created when a Google Form is linked)

// Live: DJCHC Jaaps sheet, "Jaaps" tab published to web as CSV.
// To swap: File → Share → Publish to web → pick Jaaps tab → CSV → copy URL.
// Local fallback for dev: "data/jaaps.csv".
const JAAPS_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdGIco39vvhWULFItyR85qjhKuYyQfZOBRoLnAmpYFM_acbOap0-MEiQbizZPk4K1UskNI-KJ91TK-/pub?gid=0&single=true&output=csv";

// Defensive caps — drop any single submission with more counts than
// a very keen practitioner could plausibly log in one sitting.
// Trolls typing 999999999 into the form get quietly dropped.
const MAX_COUNT_PER_ROW = 100000;
const RECENT_LIMIT = 10;

document.addEventListener("DOMContentLoaded", function () {
    const root = document.getElementById("jaap-root");
    if (!root) return;

    const id = new URLSearchParams(location.search).get("id");
    fetchCsv(JAAPS_SHEET_CSV_URL)
        .then(function (jaapRows) {
            const jaaps = parseJaaps(jaapRows);
            if (id) return renderDetail(root, jaaps, id);
            return renderList(root, jaaps);
        })
        .catch(function (err) {
            console.error("Jaap load failed:", err);
            renderStatus(root, "Could not load jaaps right now. Please try again later.", "error");
        });
});

// ---------- List view ---------- //

function renderList(root, jaaps) {
    // Only show active + public jaaps in the list; link-only jaaps are
    // reachable via their direct URL, not surfaced here.
    const visible = jaaps.filter(function (j) {
        return j.status === "active" && j.visibility === "public";
    });

    root.innerHTML = "";

    const intro = document.createElement("p");
    intro.className = "events-intro";
    intro.textContent = "Join a group jaap. Every mala counts toward the shared target.";
    root.appendChild(intro);

    if (visible.length === 0) {
        renderStatus(root, "No active jaaps right now. Check back soon.", "info");
        return Promise.resolve();
    }

    // Each jaap has its own submissions CSV. Fetch in parallel, then
    // render cards as data arrives. If a fetch fails, that card shows 0.
    const totals = visible.map(function (j) {
        if (!j.submissions_csv_url) return Promise.resolve(0);
        return fetchCsv(j.submissions_csv_url)
            .then(function (rows) {
                return parseSubmissions(rows).reduce(function (a, s) { return a + s.count; }, 0);
            })
            .catch(function (err) {
                console.error("Submissions load failed for " + j.id + ":", err);
                return 0;
            });
    });
    return Promise.all(totals).then(function (counts) {
        visible.forEach(function (j, i) {
            root.appendChild(renderJaapCard(j, counts[i]));
        });
    });
}

function renderJaapCard(j, total) {
    const card = document.createElement("div");
    card.className = "jaap-card";

    const mantra = document.createElement("div");
    mantra.className = "jaap-mantra";
    mantra.textContent = j.mantra_devanagari;
    card.appendChild(mantra);

    if (j.mantra_transliteration) {
        const t = document.createElement("div");
        t.className = "jaap-translit";
        t.textContent = j.mantra_transliteration;
        card.appendChild(t);
    }

    if (j.description) {
        const d = document.createElement("p");
        d.className = "jaap-desc";
        d.textContent = j.description;
        card.appendChild(d);
    }

    const p = computeProgress(j, total);

    const num = document.createElement("div");
    num.className = "jaap-progress-num";
    num.appendChild(document.createTextNode(formatInt(total)));
    const of = document.createElement("span");
    of.className = "of";
    of.textContent = " / " + formatInt(j.target_count);
    num.appendChild(of);
    card.appendChild(num);

    card.appendChild(buildProgressBar(p));
    card.appendChild(buildProgressLabel(p));

    const cta = document.createElement("a");
    cta.className = "jaap-cta";
    cta.href = "jaap.html?id=" + encodeURIComponent(j.id);
    cta.innerHTML = '<i class="fas fa-arrow-right"></i>';
    cta.appendChild(document.createTextNode(" Open jaap"));

    const row = document.createElement("div");
    row.className = "jaap-cta-row";
    row.appendChild(cta);
    card.appendChild(row);

    return card;
}

// ---------- Detail view ---------- //

function renderDetail(root, jaaps, id) {
    const jaap = jaaps.find(function (j) { return j.id === id; });
    if (!jaap) {
        renderStatus(root, "Jaap not found. It may have been archived or the link is incorrect.", "warn");
        return Promise.resolve();
    }

    if (!jaap.submissions_csv_url) {
        // Jaap exists in the registry but no submissions URL yet — render
        // the empty detail view rather than a hard error.
        paintDetail(root, jaap, 0, []);
        return Promise.resolve();
    }
    return fetchCsv(jaap.submissions_csv_url)
        .then(function (rows) {
            const subs = parseSubmissions(rows);
            const total = subs.reduce(function (a, s) { return a + s.count; }, 0);
            paintDetail(root, jaap, total, subs);
        })
        .catch(function (err) {
            console.error("Submissions load failed for " + id + ":", err);
            paintDetail(root, jaap, 0, []);
        });
}

function paintDetail(root, j, total, subs) {
    root.innerHTML = "";

    const mantra = document.createElement("div");
    mantra.className = "jaap-mantra jaap-mantra-detail";
    mantra.textContent = j.mantra_devanagari;
    root.appendChild(mantra);

    if (j.mantra_transliteration) {
        const t = document.createElement("div");
        t.className = "jaap-translit jaap-translit-detail";
        t.textContent = j.mantra_transliteration;
        root.appendChild(t);
    }

    // Status-specific banner
    if (j.status === "completed") {
        const banner = document.createElement("div");
        banner.className = "jaap-banner-success";
        banner.textContent = "🌸 Target reached. Thank you to every participant.";
        root.appendChild(banner);
    } else if (j.status === "missed") {
        const banner = document.createElement("div");
        banner.className = "jaap-banner-missed";
        banner.textContent = "Deadline passed. Every count still added merit — thank you.";
        root.appendChild(banner);
    }

    if (j.description) {
        const d = document.createElement("p");
        d.className = "jaap-desc";
        d.style.textAlign = "center";
        d.textContent = j.description;
        root.appendChild(d);
    }

    const p = computeProgress(j, total);

    const num = document.createElement("div");
    num.className = "jaap-progress-num";
    num.appendChild(document.createTextNode(formatInt(total)));
    const of = document.createElement("span");
    of.className = "of";
    of.textContent = " / " + formatInt(j.target_count);
    num.appendChild(of);
    root.appendChild(num);

    root.appendChild(buildProgressBar(p));
    root.appendChild(buildProgressLabel(p));

    // Meta line: dates + status
    const meta = document.createElement("div");
    meta.className = "jaap-meta";
    meta.style.justifyContent = "center";
    meta.appendChild(metaItem("fa-play", "Started " + formatDate(j.starts_at)));
    meta.appendChild(metaItem("fa-flag-checkered", "Deadline " + formatDate(j.deadline_at)));
    const statusPill = document.createElement("span");
    statusPill.className = "jaap-status-pill status-" + j.status;
    statusPill.textContent = j.status;
    meta.appendChild(statusPill);
    root.appendChild(meta);

    // Behind-pace nudge on active jaaps only
    if (j.status === "active" && p.behindPercent >= 10) {
        const nudge = document.createElement("div");
        nudge.className = "jaap-banner-behind";
        nudge.textContent =
            "The group is " + p.behindPercent + "% behind pace. Every mala today helps.";
        root.appendChild(nudge);
    }

    // Contribute button — only on active jaaps
    if (j.status === "active" && j.submissions_form_url) {
        const row = document.createElement("div");
        row.className = "jaap-cta-row";

        const contribute = document.createElement("a");
        contribute.className = "jaap-cta";
        contribute.href = j.submissions_form_url;
        contribute.target = "_blank";
        contribute.rel = "noopener";
        contribute.innerHTML = '<i class="fas fa-plus-circle"></i>';
        contribute.appendChild(document.createTextNode(" Add my count"));
        row.appendChild(contribute);

        const back = document.createElement("a");
        back.className = "jaap-cta is-secondary";
        back.href = "jaap.html";
        back.innerHTML = '<i class="fas fa-list"></i>';
        back.appendChild(document.createTextNode(" All jaaps"));
        row.appendChild(back);

        root.appendChild(row);
    } else {
        const row = document.createElement("div");
        row.className = "jaap-cta-row";
        const back = document.createElement("a");
        back.className = "jaap-cta is-secondary";
        back.href = "jaap.html";
        back.innerHTML = '<i class="fas fa-list"></i>';
        back.appendChild(document.createTextNode(" All jaaps"));
        row.appendChild(back);
        root.appendChild(row);
    }

    // Recent submissions
    if (subs.length > 0) {
        const wrap = document.createElement("div");
        wrap.className = "jaap-recent";
        const h = document.createElement("h3");
        h.textContent = "Recent submissions";
        wrap.appendChild(h);

        const ul = document.createElement("ul");
        ul.className = "jaap-recent-list";
        const recent = subs.slice().sort(function (a, b) { return b.timestampMs - a.timestampMs; }).slice(0, RECENT_LIMIT);
        recent.forEach(function (s) {
            const li = document.createElement("li");
            const name = document.createElement("span");
            name.className = "r-name";
            name.textContent = s.name || "Anonymous";
            const count = document.createElement("span");
            count.className = "r-count";
            count.textContent = "+" + formatInt(s.count);
            const when = document.createElement("span");
            when.className = "r-when";
            when.textContent = relativeTime(s.timestampMs);
            li.appendChild(name);
            li.appendChild(count);
            li.appendChild(when);
            ul.appendChild(li);
        });
        wrap.appendChild(ul);
        root.appendChild(wrap);
    }
}

// ---------- Parsing ---------- //

function parseJaaps(rows) {
    if (rows.length < 2) return [];
    const idx = headerIndex(rows[0], [
        "id", "mantra_devanagari", "mantra_transliteration", "description",
        "target_count", "starts_at", "deadline_at",
        "submissions_form_url", "submissions_csv_url", "visibility", "status"
    ]);
    return rows.slice(1)
        .map(function (r) {
            return {
                id: cell(r, idx.id),
                mantra_devanagari: cell(r, idx.mantra_devanagari),
                mantra_transliteration: cell(r, idx.mantra_transliteration),
                description: cell(r, idx.description),
                target_count: intOrZero(cell(r, idx.target_count)),
                starts_at: cell(r, idx.starts_at),
                deadline_at: cell(r, idx.deadline_at),
                submissions_form_url: cell(r, idx.submissions_form_url),
                submissions_csv_url: cell(r, idx.submissions_csv_url),
                visibility: (cell(r, idx.visibility) || "public").toLowerCase(),
                status: (cell(r, idx.status) || "active").toLowerCase()
            };
        })
        .filter(function (j) { return j.id && j.mantra_devanagari && j.target_count > 0; });
}

function parseSubmissions(rows) {
    if (rows.length < 2) return [];
    // Google Forms creates a "Timestamp" column, capitalized.
    const idx = headerIndex(rows[0], ["Timestamp", "Name", "Count", "Note"]);
    return rows.slice(1)
        .map(function (r) {
            const raw = intOrZero(cell(r, idx.Count));
            return {
                timestampMs: parseTimestamp(cell(r, idx.Timestamp)),
                name: cell(r, idx.Name),
                count: raw > 0 && raw <= MAX_COUNT_PER_ROW ? raw : 0,
                note: cell(r, idx.Note)
            };
        })
        .filter(function (s) { return s.count > 0; });
}

function headerIndex(headerRow, wanted) {
    const lower = headerRow.map(function (h) { return (h || "").trim().toLowerCase(); });
    const out = {};
    wanted.forEach(function (name) { out[name] = lower.indexOf(name.toLowerCase()); });
    return out;
}

function cell(row, i) { return i === -1 ? "" : (row[i] || "").trim(); }

// ---------- Progress ---------- //

function computeProgress(j, total) {
    const target = j.target_count;
    const now = Date.now();
    const start = parseTimestamp(j.starts_at);
    const end = parseTimestamp(j.deadline_at);
    const spanMs = end - start;

    const percent = target > 0 ? Math.min(100, Math.floor((total / target) * 100)) : 0;

    let daysLeft = 0;
    let elapsedFrac = 0;
    let expectedNow = 0;
    let behindPercent = 0;
    let bandClass = "is-onpace";
    let label = "";

    if (j.status === "completed") {
        bandClass = "is-success";
        label = "Target reached · " + percent + "%";
    } else if (j.status === "missed") {
        bandClass = "is-missed";
        label = "Deadline passed · " + percent + "%";
    } else if (!spanMs || isNaN(spanMs)) {
        label = percent + "%";
    } else {
        daysLeft = Math.max(0, Math.ceil((end - now) / (24 * 3600 * 1000)));
        elapsedFrac = Math.min(1, Math.max(0, (now - start) / spanMs));
        expectedNow = target * elapsedFrac;
        if (total >= target) {
            bandClass = "is-success";
            label = "Target reached · " + daysLeft + " day" + plural(daysLeft) + " to spare";
        } else if (expectedNow <= 0) {
            bandClass = "is-onpace";
            label = daysLeft + " day" + plural(daysLeft) + " left";
        } else {
            const paceRatio = total / expectedNow;   // 1.0 = on pace
            if (paceRatio >= 1.05) {
                bandClass = "is-ahead";
                const ahead = Math.round((paceRatio - 1) * 100);
                label = daysLeft + " day" + plural(daysLeft) + " left · " + ahead + "% ahead of pace";
            } else if (paceRatio >= 0.95) {
                bandClass = "is-onpace";
                label = daysLeft + " day" + plural(daysLeft) + " left · on pace";
            } else {
                bandClass = "is-behind";
                behindPercent = Math.round((1 - paceRatio) * 100);
                label = daysLeft + " day" + plural(daysLeft) + " left · " + behindPercent + "% behind pace";
            }
        }
    }

    return { percent: percent, bandClass: bandClass, label: label, daysLeft: daysLeft, behindPercent: behindPercent };
}

function buildProgressBar(p) {
    const bar = document.createElement("div");
    bar.className = "jaap-bar";
    const fill = document.createElement("div");
    fill.className = "jaap-bar-fill " + p.bandClass;
    fill.style.width = p.percent + "%";
    bar.appendChild(fill);
    return bar;
}

function buildProgressLabel(p) {
    const el = document.createElement("div");
    el.className = "jaap-progress-label";
    el.textContent = p.label;
    return el;
}

// ---------- Utilities ---------- //

function metaItem(icon, text) {
    const span = document.createElement("span");
    span.className = "jaap-meta-item";
    span.innerHTML = '<i class="fas ' + icon + '"></i> ';
    span.appendChild(document.createTextNode(text));
    return span;
}

function fetchCsv(url) {
    return fetch(url, { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
        .then(parseCsv);
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

function intOrZero(s) {
    if (s == null) return 0;
    const n = parseInt(String(s).replace(/[, ]/g, ""), 10);
    return isNaN(n) || n < 0 ? 0 : n;
}

function formatInt(n) {
    // Indian numbering (1,25,000) reads naturally for this audience.
    try { return n.toLocaleString("en-IN"); }
    catch (_) { return String(n); }
}

function formatDate(s) {
    const t = parseTimestamp(s);
    if (isNaN(t)) return s || "";
    const d = new Date(t);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function parseTimestamp(s) {
    if (!s) return NaN;
    // Prefer ISO ("YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS") — trustee-recommended shape.
    const iso = String(s).replace(" ", "T");
    const t = Date.parse(iso);
    if (!isNaN(t)) return t;
    // Fallback for Google Sheets' default display format ("01-Aug-2026"),
    // which most browsers parse but a few (older WebViews) don't.
    const m = String(s).match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (m) {
        const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
        const mon = months[m[2].toLowerCase()];
        if (mon !== undefined) return Date.UTC(+m[3], mon, +m[1]);
    }
    return NaN;
}

function relativeTime(ms) {
    if (!ms || isNaN(ms)) return "";
    const diff = Date.now() - ms;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return Math.round(diff / 60000) + "m ago";
    if (diff < 86400000) return Math.round(diff / 3600000) + "h ago";
    return Math.round(diff / 86400000) + "d ago";
}

function plural(n) { return n === 1 ? "" : "s"; }

// Minimal RFC-4180-ish CSV parser (same shape as js/news.js).
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
