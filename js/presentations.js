export function loadPresentations() {
    return fetch('./data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load presentations data.');
            }
            return response.json();
        })
        .then(data => {
            const { poster } = data;

            if (!poster || !Array.isArray(poster)) {
                throw new Error('Invalid API response format.');
            }

            // ==================================================
            // GROUP DATA
            // Category → Day → Theme → SessionType → Time
            // ==================================================
            const grouped = poster.reduce((acc, p) => {
                const { Category, Day, Theme, SessionType, Time } = p;

                acc[Category] ??= {};
                acc[Category][Day] ??= {};
                acc[Category][Day][Theme] ??= {};
                acc[Category][Day][Theme][SessionType] ??= {};
                acc[Category][Day][Theme][SessionType][Time] ??= [];

                acc[Category][Day][Theme][SessionType][Time].push(p);
                return acc;
            }, {});

            // ==================================================
            // NAVIGATION PANEL
            // ==================================================
            const navButtons = Object.keys(grouped).map(category => `
                <button class="nav-button" data-category="${category.replace(/\s+/g, '-')}">
                    <i class="fas fa-list"></i>
                    <span>${category}</span>
                </button>
            `).join('');

            const navPanel = `
                <nav id="navigation-footer" class="navigation-panel">
                    ${navButtons}
                </nav>
            `;

            // ==================================================
            // SEARCH SECTION
            // ==================================================
            const searchSection = `
                <section class="search-section" id="searchSection">
                    <input type="text" id="searchInput" placeholder="Search sessions, authors, organizations..." />
                    <button id="searchButton">Search</button>
                    <button id="searchClose" style="display:none;">
                        <i class="fas fa-close"></i>
                    </button>
                </section>
            `;

            const noResults = `
                <div id="noResults" class="no-results" style="display:none;">
                    <p>No results found</p>
                </div>
            `;

            // ==================================================
            // BUILD HTML
            // ==================================================
            const sections = Object.keys(grouped).map(category => {
                const dayBlocks = Object.keys(grouped[category]).map(day => {
                    const themeBlocks = Object.keys(grouped[category][day]).map(theme => {

                        const sessionBlocks = Object.keys(grouped[category][day][theme]).map(sessionType => {
                            return Object.keys(grouped[category][day][theme][sessionType]).map(time => {

                                const presentations =
                                    grouped[category][day][theme][sessionType][time];

                                const venue = presentations[0].Venue || '';

                                return `
                                    <div class="time-cluster">
                                        <div class="time-box">
                                            <p class="time session-type">${sessionType}</p>
                                            <p class="time">${time}</p>
                                            <p class="venue">
                                                <i class="fas fa-map-marker-alt"></i> ${venue}
                                            </p>
                                        </div>

                                        <div class="time-sessions">
                                            ${presentations.map(p => `
                                                <section class="agenda-box" id="presentation-${p['Sr.No.']}">
                                                    <div class="session-card">
                                                        <div class="session-content">
                                                            <h3 class="session-title">${p['Poster Name']}</h3>
                                                            <div class="groupPresenter">
                                                                <p><strong>Author:</strong> ${p['Author Name']}</p>
                                                                <p><strong>Organization:</strong> ${p['Organization']}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('');
                        }).join('');

                        return `
                            <div class="ribbon3"><p>${theme || 'No Theme'}</p></div>
                            ${sessionBlocks}
                        `;
                    }).join('');

                    return `
                        <div class="ribbon2"><p>${day}</p></div>
                        ${themeBlocks}
                    `;
                }).join('');

                return `
                    <div class="ribbon" id="category-${category.replace(/\s+/g, '-')}">
                        <p>${category}</p>
                    </div>
                    ${dayBlocks}
                `;
            }).join('');

            return navPanel + searchSection + noResults + sections;
        })
        .catch(error => {
            console.error(error);
            return `<div class="error-message">${error.message}</div>`;
        });
}

/* ======================================================
   GLOBAL EVENT HANDLERS
   ====================================================== */

document.addEventListener('click', (event) => {

    // ---------------- NAVIGATION ----------------
    const navBtn = event.target.closest('.nav-button');
    if (navBtn) {
        const category = navBtn.dataset.category;
        const target = document.getElementById(`category-${category}`);

        document.querySelectorAll('.nav-button')
            .forEach(btn => btn.classList.remove('active'));

        navBtn.classList.add('active');

        if (target) {
            window.scrollTo({
                top: target.offsetTop - 90,
                behavior: 'smooth'
            });
        }
    }

    // ---------------- SEARCH ----------------
    const searchBtn = event.target.closest('#searchButton');
    if (searchBtn) {
        const query = document.getElementById('searchInput')
            .value.toLowerCase().trim();

        const cards = document.querySelectorAll('.session-card');
        let matches = 0;

        cards.forEach(card => {
            const text = [
                card.querySelector('.session-title')?.textContent,
                card.querySelector('.groupPresenter')?.textContent,
                card.closest('.time-cluster')?.textContent
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const show = text.includes(query);
            card.style.display = show ? 'flex' : 'none';
            if (show) matches++;
        });

        document.querySelectorAll('.time-cluster').forEach(cluster => {
            cluster.style.display =
                cluster.querySelector('.session-card[style*="flex"]')
                    ? 'flex'
                    : 'none';
        });

        document.getElementById('noResults').style.display =
            matches === 0 ? 'flex' : 'none';

        document.getElementById('searchButton').style.display = 'none';
        document.getElementById('searchClose').style.display = 'flex';
    }

    // ---------------- RESET SEARCH ----------------
    const closeBtn = event.target.closest('#searchClose');
    if (closeBtn) {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchButton').style.display = 'flex';
        document.getElementById('searchClose').style.display = 'none';
        document.getElementById('noResults').style.display = 'none';

        document.querySelectorAll('.session-card')
            .forEach(card => card.style.display = 'flex');

        document.querySelectorAll('.time-cluster')
            .forEach(cluster => cluster.style.display = 'flex');

        document.querySelectorAll('.ribbon, .ribbon2, .ribbon3')
            .forEach(r => r.style.display = 'flex');
    }
});

// ---------------- ENTER KEY SUPPORT ----------------
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && document.activeElement.id === 'searchInput') {
        document.getElementById('searchButton').click();
    }
});