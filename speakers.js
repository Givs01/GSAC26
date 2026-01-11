export function loadSpeakers() {
    return fetch('./data.json')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load speaker data');
            return res.json();
        })
        .then(({ speakers }) => {
            if (!Array.isArray(speakers)) throw new Error('Invalid data');

            speakers.forEach((s, i) => {
                s.ID = `speaker-${i}-${s.Name.replace(/\s+/g, '-').toLowerCase()}`;
            });

            const grouped = sortGroupedCategories(groupSpeakersByCategory(speakers));

            const searchSection = `
                <section class="search-section">
                    <input id="searchInput" placeholder="Search for speakers...">
                    <button id="searchButton">Search</button>
                    <button id="searchClose" style="display:none">
                        <i class="fas fa-close"></i>
                    </button>
                </section>
            `;

            const navPanel = `
                <nav class="navigation-panel">
                    ${Object.keys(grouped).map(cat => `
                        <button class="nav-button" data-category="${cat}">
                            <i class="fas ${getCategoryIcon(cat)}"></i>
                            <span>${cat}</span>
                        </button>
                    `).join('')}
                </nav>
            `;

            const content = Object.keys(grouped).map(cat => `
                <div class="ribbon" id="category-${cat}">
                    <p>${cat}</p>
                </div>

                <!-- FLEX ROW FIX HERE -->
                <div class="card">
                    ${grouped[cat].map(s => `
                        <section class="profcard" id="${s.ID}" onclick="openSpeakerProfile('${s.ID}')">
                            <div class="bands">
                                <img src="${s.FullPath}" onerror="this.onerror=null;this.src='${s.df}'">
                                <div class="content-box-b">
                                    <h3>${s.Name}</h3>
                                    <h4 style="font-style: italic; font-weight: normal">${s.Designation || '-'}</h4>
                                    <h4>${s.Organization || '-'}</h4>

                                    <!-- SESSION DETAILS FIX -->
                                    <div class="sessions">
                                        ${getSessions(s.SessionTitle, s.Day, s.Time, s.Venue)}
                                    </div>

                                    <p class="bio" style="display:none">
                                        ${s.Bio || 'No biography available.'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    `).join('')}
                </div>
            `).join('');

            const modal = `
                <div id="speakerModal" class="modal">
                    <div class="modal-content">
                        <span class="close-button">&times;</span>
                        <div id="modal-body"></div>
                    </div>
                </div>
            `;

            return navPanel + searchSection + content + modal;
        })
        .catch(err => `<div class="error-message">${err.message}</div>`);
}

/* =====================
   HELPERS
===================== */

function groupSpeakersByCategory(speakers) {
    return speakers.reduce((a, s) => {
        const c = s.ParticipantCatagory?.trim() || 'Other';
        (a[c] ||= []).push(s);
        return a;
    }, {});
}

function sortGroupedCategories(grouped) {
    const categories = Object.keys(grouped);

    const priority = category => {
        const c = category.toLowerCase();

        if (c.includes('keynote')) return 1;
        if (c.includes('inaugural')) return 2;
        if (c.includes('panel')) return 3;
        if (c.includes('verbal')) return 98;
        if (c.includes('poster')) return 99;

        return 50; // middle → alphabetical group
    };

    return categories
        .sort((a, b) => {
            const pa = priority(a);
            const pb = priority(b);

            // Priority decides first
            if (pa !== pb) return pa - pb;

            // Same priority → alphabetical
            return a.localeCompare(b);
        })
        .reduce((acc, category) => {
            acc[category] = grouped[category].sort((x, y) => {
                const sx = parseInt(x.SerialNumber) || Infinity;
                const sy = parseInt(y.SerialNumber) || Infinity;
                return sx !== sy ? sx - sy : x.Name.localeCompare(y.Name);
            });
            return acc;
        }, {});
}


function getCategoryIcon(cat) {
    const k = cat.toLowerCase();
    if (k.includes('keynote')) return 'fa-microphone-alt';
    if (k.includes('chair')) return 'fa-user-tie';
    if (k.includes('panel')) return 'fa-users';
    if (k.includes('poster')) return 'fa-file-alt';
    return 'fa-user';
}

/* =====================
   SESSION HTML (FIXED)
===================== */

function getSessions(title, day, time, venue) {
    if (!title) return '';

    const t = title.split(',');
    const d = (day || '').split(',');
    const ti = (time || '').split(',');
    const v = (venue || '').split(',');

    return t.map((x, i) => `
        <div class="session">
            <strong>${t.length > 1 ? `Session ${i + 1}` : 'Session'}:</strong>
            ${x.trim()}<br>
            ${d[i]?.trim() || 'TBA'} |
            ${ti[i]?.trim() || 'TBA'} |
            Venue: ${v[i]?.trim() || 'TBA'}
        </div>
    `).join('');
}

/* =====================
   EVENTS & MODAL
===================== */

document.addEventListener('click', e => {
    const nav = e.target.closest('.nav-button');
    const card = e.target.closest('.profcard');

    if (nav) {
        document.querySelectorAll('.nav-button').forEach(b => b.classList.remove('active'));
        nav.classList.add('active');
        document.getElementById(`category-${nav.dataset.category}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (card) openSpeakerProfile(card.id);
});

window.openSpeakerProfile = id => {
    const s = document.getElementById(id);
    if (!s) return;

    document.getElementById('modal-body').innerHTML = `
        <div class="band">
            <img src="${s.querySelector('img').src}">
            <div>
                <h2>${s.querySelector('h3').textContent}</h2>
                <p>${s.querySelector('.designation').textContent}</p>
                <p><b>${s.querySelector('h4:nth-of-type(2)').textContent}</b></p>
            </div>
        </div>
        <p>${s.querySelector('.bio').textContent}</p>
        <div class="ribbon">Sessions</div>
        ${s.querySelector('.sessions').innerHTML}
    `;

    const modal = document.getElementById('speakerModal');
    modal.style.display = 'block';
    modal.classList.add('active');
    modal.querySelector('.close-button').onclick = closeModal;
    modal.onclick = e => e.target === modal && closeModal();
};

function closeModal() {
    const m = document.getElementById('speakerModal');
    m.classList.remove('active');
    setTimeout(() => m.style.display = 'none', 300);
}
