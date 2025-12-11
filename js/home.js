export function loadHome() {
    // Fetch data from the external JSON file
    return fetch('https://script.google.com/macros/s/AKfycbzx0238_k60cEv0bxNJ8mDK78Dbc0-9DmkF4rnaFZgbwINhVfnZzkEbCnRFq8NzbLCYNw/exec')
        .then(response => {
            if (!response.ok) {
                throw new Error('Please wait..and reload the page.');
            }
            return response.json();
        })
        .then((data) => {
            const { general, updates } = data;

            // Check if the response contains the expected structure
            if (!general || !updates) {
                throw new Error('Invalid API response format.');
            }

            // HTML content generation
            const htmlContent = `
                <section class="bghead">
                    <p>${general.greeting || ''}</p>
                    <h1>${general.name || ''}</h1>
                    <h2>${general.theme || ''}</h2>
                    <p>${general.date || ''}</p>
                    <p>${general.venue || ''}</p>
                    <div class="buttons">  
                        <a href="${general.registration_link || '#'}" target="_blank" class="button">Register here</a>
                    </div>
                </section>
                
                <section class="home">
                    <p>${general.description1 || ''}</p>
                    <p>${general.description2 || ''}</p>
                    <p>${general.description3 || ''}</p>
                  
                    <div class="card-container">
                        <div class="card">
                            <div class="card-content">
                                <h1>${general.speakers || '0'}</h1>
                                <h2>Speakers and Presenters</h2>
                            </div>
                            <div class="card-image">
                                <img src="./images/flex-3.png" alt="Speakers Image" onerror="this.onerror=null; this.src='default-image.png';">
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-image">
                                <img src="./images/flex-4.png" alt="Attendees Image" onerror="this.onerror=null; this.src='default-image.png';">
                            </div>
                            <div class="card-content">
                                <h1>${general.registrations || '0'}</h1>
                                <h2>Attendees</h2>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-content">
                                <h1>${general.countries || '0'}</h1>
                                <h2>Countries Represented</h2>
                            </div>
                            <div class="card-image">
                                <img src="./images/flex-2.jpg" alt="Countries Image" onerror="this.onerror=null; this.src='default-image.png';">
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-image">
                                <img src="./images/flex-5.png" alt="Organizations Image" onerror="this.onerror=null; this.src='default-image.png';">
                            </div>
                            <div class="card-content">
                                <h1>${general.organizations || '0'}</h1>
                                <h2>Organizations Represented</h2>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="update">
                    <h3>Conference Updates</h3>
                    <ul>
                        ${updates
                          .map(update => `
                            <li>
                                ${update.description || ''}
                                ${update.link 
                                  ? `<a href="${update.link}" target="_blank" style="margin-left: 5px;" class="button";">Click here</a>` 
                                  : ''}
                            </li>`).join('')}
                    </ul>
                </section>

                <div class="ribbon">
                    <p>Thematic Areas</p>
                </div>
                
                ${generateThemesSection()}

            `;
            return htmlContent;
        })
        .catch((error) => {
            return `<div class="error-message">Please wait 5 second and reload the page again</div>`;
        });
}

// Helper function for thematic areas
function generateThemesSection() {
    const themes = [
        { image: "images/gsac25theme1.jpg", title: "Monitoring WASH and climate", description: "To showcase systems, policies, and strategies for measuring and monitoring WASH outcomes in different countries." },
        { image: "images/gsac25theme2.jpg", title: "Governance for inclusive and climate resilient WASH", description: "To showcase systems, policies, and strategies for measuring and monitoring WASH outcomes in different countries." },
        { image: "images/gsac25theme3.jpg", title: "Financing climate resilient WASH", description: "To showcase systems, policies, and strategies for measuring and monitoring WASH outcomes in different countries." },
        { image: "images/gsac25theme4.jpg", title: "WASH innovations in technology and service delivery", description: "To showcase systems, policies, and strategies for measuring and monitoring WASH outcomes in different countries." }
    ];

    return themes.map(theme => `
        <section class="home theme-box">
            <img src="${theme.image}" alt="${theme.title}" onerror="this.onerror=null; this.src='default-image.png';">
            <div class="content-box">
                <h3>${theme.title}</h3>
                <p>${theme.description}</p>
            </div>
        </section>
    `).join('');
}
