// ------------------------------------------------------------------
// DJCHC — Theme & Layout switcher
// Builds a floating "Customise" panel that lets any visitor restyle the
// whole site (colour theme + page layout). The chosen combination is
// stored in localStorage and re-applied on every page load.
//
// Applying the saved choice as early as possible (see the tiny inline
// snippet in each page's <head>) avoids a flash of the default theme.
// This file only builds the UI and handles interaction.
// ------------------------------------------------------------------
(function () {
    "use strict";

    var THEME_KEY = "djchc-theme";
    var LAYOUT_KEY = "djchc-layout";
    var DEFAULT_THEME = "aurora";
    var DEFAULT_LAYOUT = "focus";

    // Two swatch colours per theme: [banner/base, accent dot]
    var THEMES = [
        { id: "heritage", name: "Heritage Gold", base: "linear-gradient(135deg,#b8860b,#daa520)", dot: "#1a1a2e" },
        { id: "lotus",    name: "Lotus Dawn",     base: "linear-gradient(135deg,#f4a259,#f6bd60)", dot: "#7a4419" },
        { id: "midnight", name: "Midnight Sapphire", base: "linear-gradient(135deg,#1f2748,#2b1d52)", dot: "#f0c85a" },
        { id: "emerald",  name: "Emerald Serenity", base: "linear-gradient(135deg,#1e7a5a,#2ea179)", dot: "#f5fbf7" },
        { id: "maroon",   name: "Royal Maroon",   base: "linear-gradient(135deg,#8e2436,#c0392b)", dot: "#e0a53f" },
        { id: "aurora",   name: "Hi-Tech Aurora", base: "linear-gradient(120deg,#4338ca,#06b6d4)", dot: "#ffffff" },
        { id: "sandalwood", name: "Sandalwood",  base: "linear-gradient(135deg,#b9762f,#e0c088)", dot: "#2e2a26" }
    ];

    var LAYOUTS = [
        { id: "classic", name: "Classic",  icon: "fa-align-center",  desc: "Balanced, familiar reading width" },
        { id: "wide",    name: "Wide",     icon: "fa-expand",        desc: "Roomy, immersive full-width feel" },
        { id: "comfort", name: "Comfort",  icon: "fa-text-height",   desc: "Larger text & generous spacing" },
        { id: "focus",   name: "Focus",    icon: "fa-clone",         desc: "Content on a floating sheet" }
    ];

    function getStored(key, fallback) {
        try { return localStorage.getItem(key) || fallback; }
        catch (e) { return fallback; }
    }
    function store(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* private mode: ignore */ }
    }

    function applyTheme(id) { document.documentElement.setAttribute("data-theme", id); }
    function applyLayout(id) { document.documentElement.setAttribute("data-layout", id); }

    // ---- build the UI ---------------------------------------------------
    function build() {
        var currentTheme = getStored(THEME_KEY, DEFAULT_THEME);
        var currentLayout = getStored(LAYOUT_KEY, DEFAULT_LAYOUT);
        applyTheme(currentTheme);
        applyLayout(currentLayout);

        // Floating action button
        var fab = document.createElement("button");
        fab.className = "tc-fab";
        fab.setAttribute("aria-label", "Customise appearance");
        fab.setAttribute("title", "Customise appearance");
        fab.innerHTML = '<i class="fas fa-palette"></i>';

        // Overlay + panel
        var overlay = document.createElement("div");
        overlay.className = "tc-overlay";

        var panel = document.createElement("aside");
        panel.className = "tc-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-label", "Appearance settings");
        panel.setAttribute("aria-hidden", "true");

        var themeCards = THEMES.map(function (t) {
            return '<button class="tc-theme" data-theme-id="' + t.id + '" type="button" aria-label="' + t.name + ' theme">' +
                       '<div class="tc-swatch" style="background:' + t.base + '"><span style="background:' + t.dot + '"></span></div>' +
                       '<div class="tc-name">' + t.name + '</div>' +
                   '</button>';
        }).join("");

        var layoutCards = LAYOUTS.map(function (l) {
            return '<button class="tc-layout" data-layout-id="' + l.id + '" type="button">' +
                       '<i class="fas ' + l.icon + '"></i>' +
                       '<span><span class="tc-l-name">' + l.name + '</span>' +
                       '<span class="tc-l-desc">' + l.desc + '</span></span>' +
                   '</button>';
        }).join("");

        panel.innerHTML =
            '<div class="tc-header">' +
                '<button class="tc-close" aria-label="Close">&times;</button>' +
                '<h3><i class="fas fa-wand-magic-sparkles"></i> Personalise</h3>' +
                '<p>Make this space feel like yours — pick a theme &amp; layout.</p>' +
            '</div>' +
            '<div class="tc-body">' +
                '<div class="tc-section-label"><i class="fas fa-palette"></i> Colour Theme</div>' +
                '<div class="tc-themes">' + themeCards + '</div>' +
                '<div class="tc-section-label"><i class="fas fa-table-cells-large"></i> Layout</div>' +
                '<div class="tc-layouts">' + layoutCards + '</div>' +
                '<button class="tc-reset" type="button"><i class="fas fa-rotate-left"></i> Reset to default</button>' +
            '</div>';

        document.body.appendChild(fab);
        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        // ---- state highlighting ----
        function refreshActive() {
            var theme = document.documentElement.getAttribute("data-theme");
            var layout = document.documentElement.getAttribute("data-layout");
            panel.querySelectorAll(".tc-theme").forEach(function (el) {
                el.classList.toggle("tc-active", el.getAttribute("data-theme-id") === theme);
            });
            panel.querySelectorAll(".tc-layout").forEach(function (el) {
                el.classList.toggle("tc-active", el.getAttribute("data-layout-id") === layout);
            });
        }
        refreshActive();

        // ---- open / close ----
        function open() {
            overlay.classList.add("tc-show");
            panel.classList.add("tc-open");
            panel.setAttribute("aria-hidden", "false");
        }
        function close() {
            overlay.classList.remove("tc-show");
            panel.classList.remove("tc-open");
            panel.setAttribute("aria-hidden", "true");
        }

        fab.addEventListener("click", open);
        overlay.addEventListener("click", close);
        panel.querySelector(".tc-close").addEventListener("click", close);
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") close();
        });

        // ---- selection handlers ----
        panel.querySelectorAll(".tc-theme").forEach(function (el) {
            el.addEventListener("click", function () {
                var id = el.getAttribute("data-theme-id");
                applyTheme(id);
                store(THEME_KEY, id);
                refreshActive();
            });
        });
        panel.querySelectorAll(".tc-layout").forEach(function (el) {
            el.addEventListener("click", function () {
                var id = el.getAttribute("data-layout-id");
                applyLayout(id);
                store(LAYOUT_KEY, id);
                refreshActive();
            });
        });
        panel.querySelector(".tc-reset").addEventListener("click", function () {
            applyTheme(DEFAULT_THEME);
            applyLayout(DEFAULT_LAYOUT);
            store(THEME_KEY, DEFAULT_THEME);
            store(LAYOUT_KEY, DEFAULT_LAYOUT);
            refreshActive();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", build);
    } else {
        build();
    }
})();
