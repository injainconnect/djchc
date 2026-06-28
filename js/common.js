// Common nav and footer for all DJCHC pages
document.addEventListener("DOMContentLoaded", function () {
    const currentPage = location.pathname.split("/").pop() || "index.html";

    // Navigation
    const nav = document.getElementById("common-nav");
    if (nav) {
        const links = [
            { href: "index.html", icon: "fa-home", label: "Home" },
            { href: "news.html", icon: "fa-newspaper", label: "News" },
            { href: "library.html", icon: "fa-book", label: "Library" },
            { href: "chaturmas.html", icon: "fa-calendar-check", label: "Chaturmas 2026" },
            { href: "mahila-mandal.html", icon: "fa-female", label: "Mahila Mandal" },
            { href: "pathshala.html", icon: "fa-chalkboard-teacher", label: "Pathshala" },
            { href: "about.html", icon: "fa-info-circle", label: "About Us" },
            { href: "contact.html", icon: "fa-envelope", label: "Contact Us" }
        ];
        nav.innerHTML = `
            <div class="logo">🙏 Digambar Jain Temples of Hyderabad</div>
            <button class="menu-toggle" aria-label="Toggle menu"><i class="fas fa-bars"></i></button>
            <ul>
                ${links.map(l => `<li><a href="${l.href}" class="${currentPage === l.href ? 'active' : ''}"><i class="fas ${l.icon}"></i> ${l.label}</a></li>`).join("")}
            </ul>
        `;
        // Hamburger toggle
        nav.querySelector(".menu-toggle").addEventListener("click", function () {
            nav.querySelector("ul").classList.toggle("open");
        });
    }

    // Footer
    const footer = document.getElementById("common-footer");
    if (footer) {
        footer.innerHTML = `
            <p>&copy; 2026 DJCHC - Digambar Jain Centre of Hi-Tec City, Hyderabad</p>
            <p style="font-size:0.85rem; margin-top:8px;">
                <a href="index.html" style="color:#daa520; text-decoration:none;">Home</a> |
                <a href="news.html" style="color:#daa520; text-decoration:none;">News</a> |
                <a href="about.html" style="color:#daa520; text-decoration:none;">About Us</a> |
                <a href="contact.html" style="color:#daa520; text-decoration:none;">Contact Us</a>
            </p>
        `;
    }
});
