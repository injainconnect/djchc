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
            { href: "donation.html", icon: "fa-hand-holding-heart", label: "Donation" }
        ];
        
        const chaturmasCommittees = [
            { href: "chaturmas.html", icon: "fa-calendar-check", label: "मुख्य पेज" },
            { href: "chaturmas-supply.html", icon: "fa-truck", label: "Procurement समिति" },
            { href: "chaturmas-food.html", icon: "fa-utensils", label: "आहारचर्या समिति" },
            { href: "chaturmas-finance.html", icon: "fa-coins", label: "Finance (वित्त समिति)" },
            { href: "chaturmas-cultural.html", icon: "fa-music", label: "सांस्कृतिक समिति" },
            { href: "chaturmas-publicity.html", icon: "fa-bullhorn", label: "प्रचार-प्रसार समिति" },
            { href: "chaturmas-health.html", icon: "fa-heartbeat", label: "स्वास्थ्य समिति" },
            { href: "chaturmas-accommodation.html", icon: "fa-bed", label: "विहार समिति" }
        ];
        
        const kalashSthapana = [
            { href: "kalash-main.html", icon: "fa-fire", label: "कलश स्थापना मुख्य" },
            { href: "kalash-details.html", icon: "fa-info-circle", label: "Kalash Details" }
        ];
        
        const initiatives = [
            { href: "library.html", icon: "fa-book", label: "Library" },
            { href: "mahila-mandal.html", icon: "fa-female", label: "Mahila Mandal" },
            { href: "pathshala.html", icon: "fa-chalkboard-teacher", label: "Pathshala" },
            { href: "contact.html", icon: "fa-envelope", label: "Contact Us" }
        ];
        
        nav.innerHTML = `
            <div class="logo">🙏 Digambar Jain Temples - Hyderabad</div>
            <button class="menu-toggle" aria-label="Toggle menu"><i class="fas fa-bars"></i></button>
            <ul>
                ${links.map(l => `<li><a href="${l.href}" class="${currentPage === l.href ? 'active' : ''}"><i class="fas ${l.icon}"></i> ${l.label}</a></li>`).join("")}
                <li class="dropdown">
                    <a href="#" class="dropdown-toggle"><i class="fas fa-calendar-check"></i> Chaturmas 2026 <i class="fas fa-chevron-down"></i></a>
                    <ul class="dropdown-menu">
                        ${chaturmasCommittees.map(c => `<li><a href="${c.href}" class="${currentPage === c.href ? 'active' : ''}"><i class="fas ${c.icon}"></i> ${c.label}</a></li>`).join("")}
                        <li class="dropdown-divider"></li>
                        <li class="nested-dropdown">
                            <a href="#" class="nested-toggle"><i class="fas fa-fire"></i> कलश स्थापना <i class="fas fa-chevron-right"></i></a>
                            <ul class="nested-dropdown-menu">
                                ${kalashSthapana.map(k => `<li><a href="${k.href}" class="${currentPage === k.href ? 'active' : ''}"><i class="fas ${k.icon}"></i> ${k.label}</a></li>`).join("")}
                            </ul>
                        </li>
                    </ul>
                </li>
                <li class="dropdown">
                    <a href="#" class="dropdown-toggle"><i class="fas fa-ellipsis-h"></i> More... <i class="fas fa-chevron-down"></i></a>
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
        const dropdownToggles = nav.querySelectorAll(".dropdown-toggle");
        const dropdowns = nav.querySelectorAll(".dropdown");
        
        dropdownToggles.forEach((toggle, index) => {
            toggle.addEventListener("click", function (e) {
                e.preventDefault();
                // Close all other dropdowns
                dropdowns.forEach((dropdown, i) => {
                    if (i !== index) {
                        dropdown.classList.remove("dropdown-open");
                    }
                });
                // Toggle current dropdown
                dropdowns[index].classList.toggle("dropdown-open");
            });
        });
        
        // Nested dropdown functionality for Kalash Sthapana
        const nestedToggles = nav.querySelectorAll(".nested-toggle");
        const nestedDropdowns = nav.querySelectorAll(".nested-dropdown");
        
        nestedToggles.forEach((toggle, index) => {
            toggle.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation(); // Prevent parent dropdown from closing
                // Close all other nested dropdowns
                nestedDropdowns.forEach((dropdown, i) => {
                    if (i !== index) {
                        dropdown.classList.remove("nested-open");
                    }
                });
                // Toggle current nested dropdown
                nestedDropdowns[index].classList.toggle("nested-open");
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (!nav.contains(e.target)) {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove("dropdown-open");
                });
                nestedDropdowns.forEach(dropdown => {
                    dropdown.classList.remove("nested-open");
                });
            }
        });
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
