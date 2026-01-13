export function loadSpeakers() {
    return fetch('./data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load speaker data.');
            }
            return response.json();
        })
        .then(data => {
            const { speakers } = data;
            if (!speakers || !Array.isArray(speakers)) {
                throw new Error('Invalid API response format.');
            }
            speakers.forEach((speaker, index) => {
                speaker.ID = `speaker-${index}-${speaker.Name.replace(/\s+/g, '-').toLowerCase()}`;
            });
            const groupedSpeakers = groupSpeakersByCategory(speakers);

            const searchSection = `
            <section class="search-section" id="searchSection">
                <input type="text" id="searchInput" placeholder="Search for speakers..." />
                <button id="searchButton">Search</button>
                <button style="display:none" id="searchClose">
                    <i class="fas fa-close"></i>
                </button>
            </section>
            `;

            const getCategoryIcon = (category) => {
                const c = category.toLowerCase();

                if (c.includes('keynote')) return 'fa-user';
                if (c.includes('inaugural') || c.includes('opening')) return 'fa-bell';
                if (c.includes('chair')) return 'fa-user-tie';
                if (c.includes('panel')) return 'fa-users';
                if (c.includes('verbal') || c.includes('oral')) return 'fa-microphone';
                if (c.includes('poster')) return 'fa-rectangle-list';
                if (c.includes('speaker')) return 'fa-microphone';
                if (c.includes('presenter')) return 'fa-user';

                return 'fa-user';
            };


            
            const navButtons = Object.keys(groupedSpeakers)
            .filter(category => category !== 'Search') 
            .map(category => {
                const iconClass = getCategoryIcon(category);

                if (category === 'Other' && !groupedSpeakers[category]?.length) {
                    return ''; 
                }
                return `
                    <button class="nav-button" id="nav-${category}" data-category="${category}">
                        <i class="fas ${iconClass}"></i>
                        <span>${category}</span>
                    </button>
                `;
            })
            .join('');
            
            const navPanel = `
                <nav id="navigation-footer" class="navigation-panel">
                    ${navButtons}
                </nav>
            `;
            

            const speakerGroups = Object.keys(groupedSpeakers).map(category => {
                const speakersInCategory = groupedSpeakers[category];
                return `
                    <div class="ribbon" id="category-${category}" 
                        ${category === 'Other' && groupedSpeakers[category]?.length === 0 ? 'style="display:none;"' : ''}>
                        <p>${category}</p>
                    </div>
                        <div class="card">
                            ${speakersInCategory.map(speaker => `
                        </div>
                            <section class="profcard" id="${speaker.ID}" onclick="openSpeakerProfile('${speaker.ID}')">
                               <div class="bands">
                                    <div class="band-avatar">
                                        <img src="${speaker.FullPath}" 
                                            onerror="this.onerror=null; this.src='${speaker.df}';">
                                    </div>
                                    <div class="content-box-b">
                                        <h3>${speaker.Name}</h3>
                                        <h4 style="font-weight: normal;">${speaker.Designation || ""} | ${speaker.Organization || ""}</h4>
                                        <p style ="display:none"> ${speaker.Bio || "No biography available."} </p>
                                        <h5>${getSessions(speaker.SessionTitle, speaker.Topic, speaker.Day, speaker.Time, speaker.Venue)} </h5>
                                    </div>
                                </div>
                            </section>
                            `).join('')}
                        </div>
                `;
            }).join('');

            const modalContainer = `
            <div id="speakerModal" class="modal">
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <div id="modal-body"></div>
                </div>
            </div>
        `;

            return navPanel +  searchSection + speakerGroups + modalContainer;
        })
        .catch(error => {
            return `<div class="error-message">Please reload the page: ${error.message}</div>`;
        });
}


function groupSpeakersByCategory(speakers) {

    // Normalize category names safely
    const normalize = (cat) => (cat || 'Other').trim();

    // Group speakers by ParticipantCatagory
    const grouped = speakers.reduce((acc, speaker) => {
        const category = normalize(speaker.ParticipantCatagory);
        if (!acc[category]) acc[category] = [];
        acc[category].push(speaker);
        return acc;
    }, {});

    const categories = Object.keys(grouped);

    // Explicit priority buckets
    const keynote = categories.filter(c => c.toLowerCase().includes('keynote'));
    const inaugural = categories.filter(c => c.toLowerCase().includes('inaugural'));
    const panelist = categories.filter(c => c.toLowerCase().includes('panelist'));
    const verbal = categories.filter(c => c.toLowerCase().includes('verbal'));
    const poster = categories.filter(c => c.toLowerCase().includes('poster'));

    // Everything else → alphabetical
    const middle = categories.filter(c =>
        !keynote.includes(c) &&
        !inaugural.includes(c) &&
        !verbal.includes(c) &&
        !poster.includes(c)
    ).sort((a, b) => a.localeCompare(b));

    // Final ordered category list
    const sortedCategories = [
        ...keynote,
        ...inaugural,
        ...panelist,
        ...middle,
        ...verbal,
        ...poster
    ];

    // Sort speakers inside each category
    const sortedGrouped = sortedCategories.reduce((acc, category) => {

        grouped[category].sort((a, b) => {
            const sa = a.SerialNumber ? parseInt(a.SerialNumber, 10) : Infinity;
            const sb = b.SerialNumber ? parseInt(b.SerialNumber, 10) : Infinity;

            if (sa !== sb) return sa - sb;
            return a.Name.localeCompare(b.Name);
        });

        acc[category] = grouped[category];
        return acc;
    }, {});

    return sortedGrouped;
}


function getSessions(sessionTitle, topic, day, time, venue) {
    const titles = sessionTitle ? sessionTitle.split(';') : [];
    const topics = topic ? topic.split(';') : [];
    const days = day ? day.split(';') : [];
    const times = time ? time.split(';') : [];
    const venues = venue ? venue.split(';') : [];

    const maxLength = Math.max(
        titles.length,
        topics.length,
        days.length,
        times.length,
        venues.length
    );

    let sessionHtml = '';

    for (let i = 0; i < maxLength; i++) {
        sessionHtml += `
            <div class="session-item">
                ${titles[i]?.trim() ? `<div style="font-style: italic;">Session: ${titles[i].trim()}</div>` : ''}
                <div style="margin-left: 10px;">${topics[i]?.trim() || 'TBA'}</div>
                <div style="margin-left: 10px; margin-bottom: 5px;">
                    ${days[i]?.trim() || 'Date - TBA'} |
                    ${times[i]?.trim() || 'Time - TBA'} |
                    ${venues[i]?.trim() || 'Venue - TBA'}
                </div>
            </div>
        `;
    }

    return sessionHtml;
}



document.addEventListener('click', (event) => {
    const button = event.target.closest('.nav-button');
    const searchButton = event.target.closest('#searchButton');
    const searchClose = event.target.closest('#searchClose');
    const speakerCard = event.target.closest('.profcard');

    if (button) {
        document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        const targetCategory = button.getAttribute('data-category');
        const targetSection = document.getElementById(`category-${targetCategory}`);
        if (targetSection) {
            setTimeout(() => {
                window.scrollTo({
                    top: targetSection.offsetTop - 90,
                    behavior: "smooth"
                });
            }, 100);
        }
    } else if (searchButton) {
        const searchInput = document.getElementById("searchInput");
        const allSpeakers = document.querySelectorAll(".profcard");
        const query = searchInput.value.toLowerCase().trim();

        if (query) {
            allSpeakers.forEach(speaker => {
                const speakerName = speaker.querySelector("h3").textContent.toLowerCase();
                speaker.style.display = speakerName.includes(query) ? "flex" : "none";
            });

            document.getElementById("searchButton").style.display = "none";
            document.getElementById("searchClose").style.display = "block";
        } else {
            allSpeakers.forEach(speaker => speaker.style.display = 'flex');
        }
    } else if (searchClose) {
        document.getElementById("searchInput").value = "";
        document.getElementById("searchButton").style.display = "block";
        document.getElementById("searchClose").style.display = "none";
        document.querySelectorAll(".profcard").forEach(speaker => speaker.style.display = 'flex');
    } else if (speakerCard) {
        openSpeakerProfile(speakerCard.id);
    }
});

// Handle Enter key press for search input
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && document.activeElement.id === 'searchInput') {
        document.getElementById('searchButton').click();
    }
});


window.openSpeakerProfile = function(speakerID) {
    const speaker = document.getElementById(speakerID);
    if (!speaker) return;

    const modal = document.getElementById('speakerModal');
    const modalBody = document.getElementById('modal-body');


    modalBody.innerHTML = `
        <div class="band">
            <div class="band-avatar">
                <img src="${speaker.querySelector('img').src}" onerror="this.onerror=null; this.src='${speaker.df}';">
            </div>
            <div class="band2">
                <h2>${speaker.querySelector('h3').textContent}</h2>
                <p style="font-weight: normal">
                    ${speaker.querySelector('h4').textContent.replace('|', '<br>')}
                </p>
            </div>
        </div>
        <p>${speaker.querySelector('p:nth-of-type(1)').textContent}</p>
        <div class="ribbon">Sessions</div>
        <div class="band3">
            ${Array.from(speaker.querySelectorAll('.session-item'))
                .map(session => `
                    <div class="session-card_a">
                        ${session.innerHTML}
                    </div>
                `).join('')}
        </div>

        
        
        
    `;
        

    modal.classList.add('active');
    modal.style.display = 'block';  // Ensure the modal is visible

    // Add close event listener
    document.querySelector('.close-button').addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
};


function closeModal() {
    const modal = document.getElementById('speakerModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}
