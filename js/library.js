// Dynamic library loader for DJCHC.
//
// Data source: a public Google Drive folder via Drive API v3.
// The folder must be shared as "Anyone with the link can view".
//
// Setup:
//   1. Go to https://console.cloud.google.com/
//   2. Create a project (or use existing) → Enable "Google Drive API"
//   3. Create an API key (APIs & Services → Credentials → Create Credentials → API Key)
//   4. Restrict the key: Application restriction = HTTP referrers (add your domain),
//      API restriction = Google Drive API only
//   5. Paste the key below in DRIVE_API_KEY

const DRIVE_FOLDER_ID = "15zvi5TZhiCJms9In0cetVTwf2YDT80rX";
const DRIVE_API_KEY = "AIzaSyCtoOrB_b5wx6eJe27fkVWyC8ztF90l-S0";

const DRIVE_API_URL = "https://www.googleapis.com/drive/v3/files"
    + "?q='" + DRIVE_FOLDER_ID + "'+in+parents+and+trashed=false"
    + "&key=" + DRIVE_API_KEY
    + "&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink)"
    + "&orderBy=name"
    + "&pageSize=100";

const MIME_ICONS = {
    "application/pdf": "fa-file-pdf",
    "application/epub+zip": "fa-book",
    "image/jpeg": "fa-file-image",
    "image/png": "fa-file-image",
    "application/vnd.google-apps.document": "fa-file-word",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "fa-file-word",
    "text/plain": "fa-file-lines",
    "application/vnd.google-apps.folder": "fa-folder",
};

document.addEventListener("DOMContentLoaded", function () {
    var container = document.getElementById("library-list");
    if (!container) return;

    if (!DRIVE_API_KEY || DRIVE_API_KEY.startsWith("REPLACE_")) {
        renderStatus(container, "Library source is not configured yet. An admin needs to set DRIVE_API_KEY in js/library.js.", "warn");
        return;
    }

    fetch(DRIVE_API_URL)
        .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        })
        .then(function (data) {
            var files = data.files || [];
            if (files.length === 0) {
                renderStatus(container, "No books available in the library yet.", "info");
                return;
            }

            container.innerHTML = "";
            for (var i = 0; i < files.length; i++) {
                container.appendChild(renderFileCard(files[i]));
            }
        })
        .catch(function (err) {
            renderStatus(container, "Could not load library right now. Please try again later.", "error");
            console.error("Library fetch failed:", err);
        });
});

function renderFileCard(file) {
    var card = document.createElement("div");
    card.className = "card";

    var h3 = document.createElement("h3");
    var icon = document.createElement("i");
    icon.className = "fas " + getIcon(file.mimeType);
    h3.appendChild(icon);
    h3.appendChild(document.createTextNode(" " + cleanFileName(file.name)));
    card.appendChild(h3);

    var meta = document.createElement("p");
    meta.className = "author";
    var parts = [];
    if (file.mimeType) parts.push(formatType(file.mimeType));
    if (file.size) parts.push(formatSize(Number(file.size)));
    if (file.modifiedTime) parts.push(formatDate(file.modifiedTime));
    meta.textContent = parts.join(" • ");
    card.appendChild(meta);

    var actions = document.createElement("p");
    actions.className = "library-actions";

    var viewLink = document.createElement("a");
    viewLink.href = file.webViewLink || ("https://drive.google.com/file/d/" + file.id + "/view");
    viewLink.target = "_blank";
    viewLink.rel = "noopener";
    viewLink.className = "library-btn";
    viewLink.innerHTML = '<i class="fas fa-eye"></i> View';
    actions.appendChild(viewLink);

    var downloadLink = document.createElement("a");
    downloadLink.href = "https://drive.google.com/uc?export=download&id=" + file.id;
    downloadLink.target = "_blank";
    downloadLink.rel = "noopener";
    downloadLink.className = "library-btn";
    downloadLink.innerHTML = '<i class="fas fa-download"></i> Download';
    actions.appendChild(downloadLink);

    card.appendChild(actions);
    return card;
}

function cleanFileName(name) {
    return name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
}

function getIcon(mimeType) {
    return MIME_ICONS[mimeType] || "fa-file";
}

function formatType(mimeType) {
    if (mimeType.indexOf("pdf") !== -1) return "PDF";
    if (mimeType.indexOf("epub") !== -1) return "EPUB";
    if (mimeType.indexOf("image") !== -1) return "Image";
    if (mimeType.indexOf("word") !== -1 || mimeType.indexOf("document") !== -1) return "Document";
    if (mimeType.indexOf("text") !== -1) return "Text";
    return "File";
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

function formatDate(isoStr) {
    var d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function renderStatus(container, message, kind) {
    var color = kind === "error" ? "#c0392b" : kind === "warn" ? "#b8860b" : "#666";
    container.innerHTML = "";
    var p = document.createElement("p");
    p.className = "library-status";
    p.style.color = color;
    p.textContent = message;
    container.appendChild(p);
}
