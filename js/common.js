// Common nav and footer for all DJCHC pages
document.addEventListener("DOMContentLoaded", function () {
    const currentPage = location.pathname.split("/").pop() || "index.html";

    // Navigation
    const nav = document.getElementById("common-nav");
    if (nav) {
        const links = [
            { href: "index.html", icon: "fa-home", label: "Home" },
            { href: "news.html", icon: "fa-newspaper", label: "News" },
            { href: "events.html", icon: "fa-calendar-alt", label: "Events" },
            { href: "library.html", icon: "fa-book", label: "Library" },
            { href: "chaturmas.html", icon: "fa-calendar-check", label: "Chaturmas 2026" },
            { href: "contact.html", icon: "fa-envelope", label: "Contact Us" }
        ];
        
        const initiatives = [
            { href: "mahila-mandal.html", icon: "fa-female", label: "Mahila Mandal" },
            { href: "pathshala.html", icon: "fa-chalkboard-teacher", label: "Pathshala" }
        ];
        
        nav.innerHTML = `
            <div class="logo">🙏 Digambar Jain Temples of Hyderabad</div>
            <button class="menu-toggle" aria-label="Toggle menu"><i class="fas fa-bars"></i></button>
            <ul>
                ${links.map(l => `<li><a href="${l.href}" class="${currentPage === l.href ? 'active' : ''}"><i class="fas ${l.icon}"></i> ${l.label}</a></li>`).join("")}
                <li class="dropdown">
                    <a href="#" class="dropdown-toggle"><i class="fas fa-star"></i> Important Initiatives <i class="fas fa-chevron-down"></i></a>
                    <ul class="dropdown-menu">
                        ${initiatives.map(i => `<li><a href="${i.href}" class="${currentPage === i.href ? 'active' : ''}"><i class="fas ${i.icon}"></i> ${i.label}</a></li>`).join("")}
                    </ul>
                </li>
            </ul>
        `;
        // Hamburger toggle
        nav.querySelector(".menu-toggle").addEventListener("click", function () {
            nav.querySelector("ul").classList.toggle("open");
        });
        
        // Dropdown toggle functionality
        const dropdownToggle = nav.querySelector(".dropdown-toggle");
        const dropdown = nav.querySelector(".dropdown");
        if (dropdownToggle && dropdown) {
            dropdownToggle.addEventListener("click", function (e) {
                e.preventDefault();
                dropdown.classList.toggle("dropdown-open");
            });
            
            // Close dropdown when clicking outside
            document.addEventListener("click", function (e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove("dropdown-open");
                }
            });
        }
    }

    // Footer
    const footer = document.getElementById("common-footer");
    if (footer) {
        footer.innerHTML = `
            <p>&copy; 2026 DJCHC - Digambar Jain Centre of Hi-Tec City, Hyderabad</p>
            <p style="font-size:0.85rem; margin-top:8px;">
                <a href="index.html" style="color:var(--color-accent); text-decoration:none;">Home</a> |
                <a href="news.html" style="color:var(--color-accent); text-decoration:none;">News</a> |
                <a href="about.html" style="color:var(--color-accent); text-decoration:none;">About Us</a> |
                <a href="contact.html" style="color:var(--color-accent); text-decoration:none;">Contact Us</a>
            </p>
        `;
    }
});
