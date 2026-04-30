// ===== APP DATA =====
const appsData = [
    {
        id: 1,
        name: "REDSOUL",
        category: "Entertainment",
        icon: "fas fa-check-circle",
        color: "#6c5ce7",
        shortDesc: "Smart task management with AI-powered prioritization and team collaboration features.",
        fullDesc: "TaskFlow is a comprehensive task management application that uses AI to help you prioritize your work. It features smart scheduling, team collaboration, progress tracking, and detailed analytics to boost your productivity.",
        features: [
            "AI-powered task prioritization",
            "Team collaboration & sharing",
            "Calendar integration",
            "Progress analytics & reports",
            "Custom workflows & automations"
        ],
        technologies: ["React", "Node.js", "MongoDB", "OpenAI API"],
        rating: 4.8,
        downloads: "2.3K",
        date: "Jan 2024",
        link: "https://poemetry.onrender.com",
        github: "#"
    },
    {
        id: 2,
        name: "WeatherLens",
        category: "utility",
        icon: "fas fa-cloud-sun",
        color: "#00cec9",
        shortDesc: "Beautiful weather app with real-time forecasts, radar maps, and severe weather alerts.",
        fullDesc: "WeatherLens provides hyperlocal weather data with stunning visualizations. Get accurate forecasts, interactive radar maps, severe weather alerts, and historical weather data all in a beautifully designed interface.",
        features: [
            "Real-time weather updates",
            "Interactive radar maps",
            "7-day & hourly forecasts",
            "Severe weather alerts",
            "Air quality index"
        ],
        technologies: ["Flutter", "Dart", "OpenWeather API", "MapBox"],
        rating: 4.6,
        downloads: "1.8K",
        date: "Mar 2024",
        link: "#",
        github: "#"
    },
    {
        id: 3,
        name: "BeatMaker",
        category: "entertainment",
        icon: "fas fa-music",
        color: "#fd79a8",
        shortDesc: "Create music beats and loops with an intuitive drag-and-drop studio interface.",
        fullDesc: "BeatMaker is a browser-based music production tool that lets you create professional-quality beats and loops. With a library of 500+ sounds and an intuitive interface, making music has never been easier.",
        features: [
            "500+ sound library",
            "Drag-and-drop beat creation",
            "Multi-track mixing",
            "Export in WAV & MP3",
            "Community sharing"
        ],
        technologies: ["Web Audio API", "Vue.js", "Tone.js", "Firebase"],
        rating: 4.7,
        downloads: "890",
        date: "Feb 2024",
        link: "#",
        github: "#"
    },
    {
        id: 4,
        name: "FitTrack",
        category: "health",
        icon: "fas fa-heartbeat",
        color: "#e17055",
        shortDesc: "Complete fitness companion with workout plans, nutrition tracking, and progress photos.",
        fullDesc: "FitTrack is your all-in-one fitness companion. Track workouts, log meals, monitor your progress with photos, and follow personalized workout plans. Integrates with popular wearables for seamless health data syncing.",
        features: [
            "Custom workout plans",
            "Nutrition & calorie tracking",
            "Progress photo timeline",
            "Wearable device integration",
            "Exercise video tutorials"
        ],
        technologies: ["React Native", "Python", "PostgreSQL", "HealthKit"],
        rating: 4.9,
        downloads: "3.1K",
        date: "Dec 2023",
        link: "#",
        github: "#"
    },
    {
        id: 5,
        name: "BudgetWise",
        category: "finance",
        icon: "fas fa-wallet",
        color: "#00b894",
        shortDesc: "Personal finance manager with smart budgeting, expense analysis, and savings goals.",
        fullDesc: "BudgetWise helps you take control of your finances. Set budgets, track expenses automatically, analyze spending patterns, and reach your savings goals with intelligent recommendations and visual reports.",
        features: [
            "Automatic expense categorization",
            "Budget creation & alerts",
            "Savings goal tracker",
            "Spending analytics & charts",
            "Bank account sync"
        ],
        technologies: ["Next.js", "Prisma", "Plaid API", "Chart.js"],
        rating: 4.5,
        downloads: "1.5K",
        date: "Apr 2024",
        link: "#",
        github: "#"
    },
    {
        id: 6,
        name: "NoteNest",
        category: "productivity",
        icon: "fas fa-sticky-note",
        color: "#a29bfe",
        shortDesc: "Beautiful note-taking app with markdown support, tags, and real-time sync across devices.",
        fullDesc: "NoteNest is a elegant note-taking application that supports rich text and markdown. Organize your notes with tags and notebooks, search instantly, and access your notes from any device with real-time sync.",
        features: [
            "Rich text & markdown editor",
            "Tags & notebook organization",
            "Full-text search",
            "Real-time cloud sync",
            "Dark & light themes"
        ],
        technologies: ["Electron", "React", "CouchDB", "Markdown-it"],
        rating: 4.4,
        downloads: "950",
        date: "May 2024",
        link: "#",
        github: "#"
    },
    {
        id: 7,
        name: "PixelBoard",
        category: "entertainment",
        icon: "fas fa-palette",
        color: "#e84393",
        shortDesc: "Collaborative pixel art canvas where you can create and share art with friends in real-time.",
        fullDesc: "PixelBoard is a multiplayer pixel art platform where creativity meets collaboration. Draw pixel art on shared canvases in real-time, participate in community challenges, and build a gallery of your creations.",
        features: [
            "Real-time collaborative canvas",
            "Custom color palettes",
            "Layer system",
            "Community challenges",
            "Export & share creations"
        ],
        technologies: ["Canvas API", "Socket.io", "Express", "Redis"],
        rating: 4.3,
        downloads: "670",
        date: "Mar 2024",
        link: "#",
        github: "#"
    },
    {
        id: 8,
        name: "MediMind",
        category: "health",
        icon: "fas fa-brain",
        color: "#0984e3",
        shortDesc: "Guided meditation and mindfulness app with personalized sessions and mood tracking.",
        fullDesc: "MediMind offers guided meditation sessions tailored to your needs. Track your mood, build mindfulness habits, explore sleep stories, and achieve inner calm with our library of 200+ guided sessions.",
        features: [
            "200+ guided meditations",
            "Mood tracking & insights",
            "Sleep stories & sounds",
            "Streak & habit tracking",
            "Breathing exercises"
        ],
        technologies: ["Swift", "SwiftUI", "CloudKit", "AVFoundation"],
        rating: 4.8,
        downloads: "2.1K",
        date: "Jan 2024",
        link: "#",
        github: "#"
    },
    {
        id: 9,
        name: "QuickConvert",
        category: "utility",
        icon: "fas fa-exchange-alt",
        color: "#fdcb6e",
        shortDesc: "Universal file converter supporting 100+ formats for documents, images, audio, and video.",
        fullDesc: "QuickConvert is a powerful file conversion tool that handles 100+ file formats. Convert documents, images, audio, and video files quickly and securely. All processing happens locally for maximum privacy.",
        features: [
            "100+ supported formats",
            "Batch conversion",
            "Local processing (no upload)",
            "Custom quality settings",
            "Drag & drop interface"
        ],
        technologies: ["Rust", "WebAssembly", "FFmpeg", "Tauri"],
        rating: 4.6,
        downloads: "1.2K",
        date: "Feb 2024",
        link: "#",
        github: "#"
    },
    {
        id: 10,
        name: "CryptoWatch",
        category: "finance",
        icon: "fas fa-chart-line",
        color: "#f39c12",
        shortDesc: "Real-time cryptocurrency tracker with portfolio management and price alert notifications.",
        fullDesc: "CryptoWatch keeps you on top of the crypto market. Track real-time prices for 1000+ cryptocurrencies, manage your portfolio, set price alerts, and analyze market trends with advanced charting tools.",
        features: [
            "Real-time price tracking",
            "Portfolio management",
            "Price alert notifications",
            "Advanced charting tools",
            "News aggregation"
        ],
        technologies: ["Angular", "D3.js", "CoinGecko API", "Firebase"],
        rating: 4.4,
        downloads: "780",
        date: "Apr 2024",
        link: "#",
        github: "#"
    },
    {
        id: 11,
        name: "CodeSnap",
        category: "utility",
        icon: "fas fa-code",
        color: "#636e72",
        shortDesc: "Create beautiful code screenshots with syntax highlighting, themes, and custom backgrounds.",
        fullDesc: "CodeSnap transforms your code into stunning visual snippets. Choose from 30+ themes, customize fonts and backgrounds, add watermarks, and export in multiple formats. Perfect for sharing on social media.",
        features: [
            "30+ syntax themes",
            "Custom backgrounds & gradients",
            "Multiple export formats",
            "Font customization",
            "Auto language detection"
        ],
        technologies: ["Svelte", "Prism.js", "html2canvas", "Vercel"],
        rating: 4.7,
        downloads: "1.6K",
        date: "May 2024",
        link: "#",
        github: "#"
    },
    {
        id: 12,
        name: "QuizMaster",
        category: "entertainment",
        icon: "fas fa-question-circle",
        color: "#d63031",
        shortDesc: "Interactive quiz platform with multiplayer support, leaderboards, and custom quiz creation.",
        fullDesc: "QuizMaster is an engaging quiz platform where learning meets fun. Play solo or compete with friends in real-time multiplayer quizzes. Create your own quizzes, climb leaderboards, and challenge the community.",
        features: [
            "Real-time multiplayer",
            "Custom quiz builder",
            "Global leaderboards",
            "20+ quiz categories",
            "Achievement system"
        ],
        technologies: ["React", "Socket.io", "PostgreSQL", "Docker"],
        rating: 4.5,
        downloads: "920",
        date: "Mar 2024",
        link: "#",
        github: "#"
    }
];

// ===== DOM ELEMENTS =====
const appsGrid = document.getElementById('appsGrid');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
const navbar = document.querySelector('.navbar');
const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');
const noResults = document.getElementById('noResults');
const particlesContainer = document.getElementById('particles');

let currentFilter = 'all';
let currentSearch = '';

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    renderApps(appsData);
    createParticles();
    animateStats();
    setupScrollSpy();
});

// ===== RENDER APPS =====
function renderApps(apps) {
    appsGrid.innerHTML = '';
    
    if (apps.length === 0) {
        noResults.classList.add('show');
        return;
    }

    noResults.classList.remove('show');

    apps.forEach((app, index) => {
        const card = document.createElement('div');
        card.className = 'app-card';
        card.dataset.category = app.category;
        card.style.transitionDelay = `${index * 0.08}s`;

        card.innerHTML = `
            <div class="card-header">
                <div class="card-icon" style="background: linear-gradient(135deg, ${app.color}, ${app.color}99)">
                    <i class="${app.icon}"></i>
                </div>
                <div class="card-header-text">
                    <h3>${app.name}</h3>
                    <span class="card-category">${app.category}</span>
                </div>
            </div>
            <p class="card-description">${app.shortDesc}</p>
            <div class="card-tags">
                ${app.technologies.slice(0, 3).map(tech => `<span class="card-tag">${tech}</span>`).join('')}
            </div>
            <div class="card-footer">
                <span class="card-rating">
                    <i class="fas fa-star"></i> ${app.rating}
                </span>
                <span class="card-downloads">
                    <i class="fas fa-download"></i> ${app.downloads}
                </span>
                <span class="card-arrow">
                    <i class="fas fa-arrow-right"></i>
                </span>
            </div>
        `;

        card.addEventListener('click', () => openModal(app));
        appsGrid.appendChild(card);

        // Trigger animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.classList.add('visible');
            });
        });
    });
}

// ===== FILTER & SEARCH =====
function filterAndSearch() {
    let filtered = appsData;

    if (currentFilter !== 'all') {
        filtered = filtered.filter(app => app.category === currentFilter);
    }

    if (currentSearch) {
        const search = currentSearch.toLowerCase();
        filtered = filtered.filter(app =>
            app.name.toLowerCase().includes(search) ||
            app.shortDesc.toLowerCase().includes(search) ||
            app.category.toLowerCase().includes(search) ||
            app.technologies.some(tech => tech.toLowerCase().includes(search))
        );
    }

    renderApps(filtered);
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        filterAndSearch();
    });
});

searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    filterAndSearch();
});

// ===== MODAL =====
function openModal(app) {
    document.getElementById('modalIcon').innerHTML = `<i class="${app.icon}"></i>`;
    document.getElementById('modalIcon').style.background = `linear-gradient(135deg, ${app.color}, ${app.color}99)`;
    document.getElementById('modalTitle').textContent = app.name;
    document.getElementById('modalCategory').textContent = app.category;
    document.getElementById('modalDescription').textContent = app.fullDesc;
    document.getElementById('modalRating').textContent = `${app.rating} / 5.0`;
    document.getElementById('modalDownloads').textContent = `${app.downloads} downloads`;
    document.getElementById('modalDate').textContent = app.date;
    document.getElementById('modalLink').href = app.link;
    document.getElementById('modalGithub').href = app.github;

    const featuresList = document.getElementById('modalFeatures');
    featuresList.innerHTML = app.features.map(f => `<li>${f}</li>`).join('');

    const techTags = document.getElementById('modalTech');
    techTags.innerHTML = app.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('');

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ===== MOBILE MENU =====
navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
    });
});

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== SCROLL SPY =====
function setupScrollSpy() {
    const sections = document.querySelectorAll('header[id], section[id]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id || entry.target.closest('[id]')?.id;
                if (id) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    }, { threshold: 0.3, rootMargin: '-70px 0px 0px 0px' });

    sections.forEach(section => observer.observe(section));
}

// ===== STATS COUNTER =====
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => observer.observe(num));
}

function animateCounter(el, target) {
    const duration = 2000;
    const start = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.floor(eased * target);

        el.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target.toLocaleString();
        }
    }

    requestAnimationFrame(update);
}

// ===== PARTICLES =====
function createParticles() {
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${8 + Math.random() * 12}s`;
        particle.style.animationDelay = `${Math.random() * 10}s`;
        particle.style.width = `${2 + Math.random() * 4}px`;
        particle.style.height = particle.style.width;

        const colors = ['#6c5ce7', '#00cec9', '#fd79a8', '#a29bfe', '#fdcb6e'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        particlesContainer.appendChild(particle);
    }
}

// ===== CONTACT FORM =====
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Message sent successfully! 🎉');
    contactForm.reset();
});

// ===== TOAST =====
function showToast(message) {
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== SMOOTH REVEAL ON SCROLL =====
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.about-section, .contact-section, .stats').forEach(section => {
    revealObserver.observe(section);
});