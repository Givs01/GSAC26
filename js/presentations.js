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

            // Group: Category → Day → Theme → SessionType → Time
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

            // Build HTML
            const sections = Object.keys(grouped).map(category => {
                const dayBlocks = Object.keys(grouped[category]).map(day => {
                    const themeBlocks = Object.keys(grouped[category][day]).map(theme => {
                        // Build sessions grouped by SessionType → Time
                        const sessionBlocks = Object.keys(grouped[category][day][theme]).map(sessionType => {
                            return Object.keys(grouped[category][day][theme][sessionType]).map(time => {
                                const presentations = grouped[category][day][theme][sessionType][time];
                                const venue = presentations[0].Venue || '';

                                return `
                                    <div class="time-cluster">
                                        <!-- LEFT: TIME + LOCATION -->
                                        <div class="time-box">
                                            <p class="time">${sessionType}</p>
                                            <p class="time">${time}</p>
                                            <p class="venue">
                                                <i class="fas fa-map-marker-alt"></i> ${venue}
                                            </p>
                                        </div>

                                        <!-- RIGHT: PRESENTATIONS -->
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

                        // Theme ribbon once per theme
                        return `
                            <div class="ribbon3"><p>${theme || 'No Theme'}</p></div>
                            ${sessionBlocks}
                        `;
                    }).join('');

                    // Day ribbon once per day
                    return `
                        <div class="ribbon2"><p>${day}</p></div>
                        ${themeBlocks}
                    `;
                }).join('');

                // Category ribbon
                return `
                    <div class="ribbon" id="category-${category.replace(/\s+/g, '-')}">
                        <p>${category}</p>
                    </div>
                    ${dayBlocks}
                `;
            }).join('');

            return sections;
        })
        .catch(error => {
            console.error('Error loading presentations data:', error);
            return `<div class="error-message">${error.message}</div>`;
        });
}

// Global Event Delegation for Navigation & Search
document.addEventListener('click', (event) => {
    const button = event.target.closest('.nav-button');
    if (button) {
        const category = button.dataset.category;
        const targetSection = document.querySelector(`#category-${category}`);
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        if (targetSection) {
            setTimeout(() => {
                window.scrollTo({
                    top: targetSection.offsetTop - 90,
                    behavior: "smooth"
                });
            }, 100);
        }
    }

    if (event.target.id === 'searchButton') {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        document.getElementById("searchButton").style.display = "none";
        document.getElementById("searchClose").style.display = "block";

        document.querySelectorAll(".session-card").forEach(card => {
            const title = card.querySelector(".session-title")?.textContent.toLowerCase() || '';
            const author = card.querySelector(".groupPresenter p")?.textContent.toLowerCase() || '';
            card.style.display = (title.includes(query) || author.includes(query)) ? "flex" : "none";
        });
    }

    if (event.target.id === 'searchClose') {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchButton').style.display = 'block';
        document.getElementById('searchClose').style.display = 'none';
        document.querySelectorAll(".session-card").forEach(card => card.style.display = 'flex');
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && document.activeElement.id === 'searchInput') {
        document.getElementById('searchButton').click();
    }
});
