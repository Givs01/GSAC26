document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const navItems = document.querySelectorAll("#navigation-footer button");
    const loader = document.getElementById("loader");

    let loaderTimeout;
    let reloadTimeout;
    let activeSection = sessionStorage.getItem("activeSection") || "home";

    /* ---------- Loader ---------- */
    const showLoader = () => {
        clearTimeout(loaderTimeout);
        loader.classList.add("active");
    };

    const hideLoader = () => {
        loaderTimeout = setTimeout(() => {
            loader.classList.remove("active");
        }, 300);
    };

    /* ---------- Session ---------- */
    const saveToSession = (key, value) => {
        sessionStorage.setItem(key, JSON.stringify(value));
    };

    const loadFromSession = (key) => {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    };

    const memoryCache = new Map();

    const appendFooter = (html) => `
        ${html}
        <br>
        <section class="org">
            <h3>Organizers</h3>
            <img src="images/org_logo.jpg"
                 onerror="this.onerror=null;this.src='default-image.png'">
        </section>
    `;

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    /* ---------- Fetch ---------- */
    const fetchSectionData = async (section, render = true) => {
        if (memoryCache.has(section)) {
            if (render) {
                content.innerHTML = memoryCache.get(section);
                hideLoader();
            }
            return;
        }

        showLoader();

        try {
            const module = await import(`./${section}.js`);
            const fn = module[`load${capitalize(section)}`];
            const html = fn ? await fn() : "";

            const finalHtml = appendFooter(html);

            memoryCache.set(section, finalHtml);
            saveToSession(section, finalHtml);

            if (render) {
                content.innerHTML = finalHtml;
                hideLoader();
            }
        } catch (e) {
            console.error(`Failed loading ${section}`, e);
        }
    };

    /* ---------- Load Section ---------- */
    const loadSection = async (section, refresh = false) => {
        showLoader();
        activeSection = section;
        sessionStorage.setItem("activeSection", section);

        const cached = loadFromSession(section);

        if (!refresh && cached) {
            content.innerHTML = cached;
            hideLoader();
            fetchSectionData(section, false);
        } else {
            await fetchSectionData(section, true);
        }

        createScrollToTopButton();
    };

    /* ---------- Navigation UI ---------- */
    const setActiveNav = (section) => {
        navItems.forEach(btn => btn.classList.remove("active"));
        const btn = document.querySelector(
            `#navigation-footer button[data-section="${section}"]`
        );
        if (btn) btn.classList.add("active");
    };
    

    /* ---------- Preload ---------- */
    const preloadSections = () => {
        ["home","programme","speakers","presentations","venue"]
            .forEach(s => fetchSectionData(s, false));
    };

    /* ---------- Init ---------- */
    const hash = window.location.hash.replace("#", "");
    activeSection = hash || activeSection;

    setActiveNav(activeSection);
    loadSection(activeSection);
    setTimeout(preloadSections, 4000);

    /* ---------- Click ---------- */
    navItems.forEach(btn => {
        btn.addEventListener("click", async () => {
            const section = btn.dataset.section;
            if (section === activeSection) return;

            setActiveNav(section);
            history.pushState({ section }, "", `#${section}`);
            await loadSection(section);
            window.scrollTo(0, 1);
        });
    });

    /* ---------- Back / Forward ---------- */
    window.addEventListener("popstate", (e) => {
        const section = e.state?.section || "home";
        setActiveNav(section);
        loadSection(section);
    });

    /* ---------- Scroll To Top ---------- */
    function createScrollToTopButton() {
        if (document.getElementById("scrollToTop")) return;

        const btn = document.createElement("button");
        btn.id = "scrollToTop";
        btn.innerHTML = '<i class="fa fa-circle-chevron-up"></i>';
        document.body.appendChild(btn);

        window.addEventListener("scroll", () => {
            btn.classList.toggle("visible", window.scrollY > 200);
        });

        btn.onclick = () =>
            window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

/* JS: Unified Install Banner for Android & iOS */
let deferredPrompt;

// Android PWA
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const banner = document.getElementById("install-banner");
    if (banner) banner.classList.remove("hidden");
});

document.getElementById("install-btn")?.addEventListener("click", async () => {
    const banner = document.getElementById("install-banner");
    if (banner) banner.classList.add("hidden");

    if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
    }
});

// Close button
document.getElementById("install-close")?.addEventListener("click", () => {
    document.getElementById("install-banner")?.classList.add("hidden");
});

// iOS devices
// Update your iOS detection block
window.addEventListener("load", () => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = ("standalone" in window.navigator) && (window.navigator.standalone);

    if (isIos && !isStandalone) {
        const banner = document.getElementById("install-banner");
        const installBtn = document.getElementById("install-btn");
        
        if (banner && installBtn) {
            banner.classList.remove("hidden");
            installBtn.textContent = "Tap Share then 'Add to Home Screen'";
            // On iOS, we don't 'click' to install, so we can disable the button 
            // or just use it as a label.
            installBtn.style.background = "transparent";
            installBtn.style.color = "white";
        }
    }
});

// Remove banner after app installed
window.addEventListener("appinstalled", () => {
    document.getElementById("install-banner")?.remove();
});
