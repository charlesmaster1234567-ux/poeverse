/* ============================================================
   TheLongAfter — script.js
   Written specifically for index.html structure
   ============================================================ */

'use strict';

/* ============================================================
   STATE
   ============================================================ */
const State = {
  poems:        [],
  activeFilter: 'all',
  activeSort:   'default',
  poemsLoaded:  false,
  isSearchOpen: false,
  isNavOpen:    false,
  theme:        'dark',
};


/* ============================================================
   UTILS
   ============================================================ */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function todayIndex(len) {
  const d = new Date();
  return (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % len;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function lsGet(key, def) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
  catch { return def; }
}

function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* full */ }
}


/* ============================================================
   1. LOAD POEMS FROM poems.json
   ============================================================ */
async function loadPoems() {
  const grid = document.getElementById('poemsGrid');
  if (!grid) return;

  // Skeleton while loading
  grid.innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="poem-card" style="opacity:0.4;pointer-events:none;" aria-hidden="true">
      <div class="poem-card-header">
        <span class="poem-number">···</span>
        <span class="poem-category">Loading</span>
      </div>
      <h3 class="poem-card-title" style="background:#333;color:transparent;border-radius:4px;">Loading poem title</h3>
      <p class="poem-preview" style="background:#2a2a2a;color:transparent;border-radius:4px;">Loading preview text here...</p>
      <div class="poem-card-footer">
        <span class="poem-time">⏱ 1 min</span>
      </div>
    </div>
  `).join('');

  try {
    const res = await fetch('/poems.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const poems = await res.json();

    if (!Array.isArray(poems) || !poems.length) {
      throw new Error('poems.json is empty');
    }

    State.poems      = poems;
    State.poemsLoaded = true;

    // Update counts
    const total = poems.length;
    const vc = document.getElementById('visibleCount');
    const tc = document.getElementById('totalCount');
    const hs = document.getElementById('heroStatPoems');
    if (vc) vc.textContent = total;
    if (tc) tc.textContent = total;
    if (hs) hs.textContent = total + '+';

    // Render all cards
    grid.innerHTML = poems.map((poem, i) => buildCard(poem, i)).join('');

    // Boot card features
    initFavoriteButtons();
    initCategoryTabs();
    initSortSelect();
    initViewToggle();
    initPoemOfDay(poems);
    initSearchOverlay(poems);
    updateFavoritesCount();

    // Restore saved view preference
    const savedView = lsGet('tla-view', 'grid');
    if (savedView === 'list') {
      document.querySelector('.view-btn[data-view="list"]')?.click();
    }

    // Apply URL hash filter
    applyHashFilter();

  } catch (e) {
    console.error('[TLA] loadPoems:', e);
    grid.innerHTML = `
      <div style="text-align:center;padding:60px 20px;grid-column:1/-1;">
        <div style="font-size:3rem;margin-bottom:12px;">⚠️</div>
        <h3>Could not load poems</h3>
        <p style="opacity:.6;margin:8px 0 20px;">Check your connection and try again.</p>
        <button onclick="loadPoems()" style="padding:10px 24px;background:#8B0000;color:#fff;border:none;border-radius:999px;cursor:pointer;">↻ Retry</button>
      </div>
    `;
  }
}

/* Build one poem card HTML string */
function buildCard(poem, index) {
  const id       = esc(poem.id            ?? 'poem_' + index);
  const title    = esc(poem.title         ?? 'Untitled');
  const number   = esc(poem.number        ?? '✦');
  const category = esc(poem.category      ?? 'other');
  const catLabel = esc(poem.categoryLabel ?? poem.category ?? 'Poem');
  const preview  = esc(poem.preview       ?? '');
  const time     = poem.time              ?? 1;
  const filename = esc(poem.filename      ?? '#');
  const isFav    = getFavorites().includes(poem.id ?? 'poem_' + index);

  return `
    <article
      class="poem-card"
      data-category="${category}"
      data-id="${id}"
      data-title="${title}"
      data-time="${time}"
      data-index="${index}"
      role="article"
      tabindex="0"
      aria-label="${title}"
    >
      <div class="poem-card-header">
        <span class="poem-number" aria-hidden="true">${number}</span>
        <span class="poem-category">${catLabel}</span>
      </div>

      <h3 class="poem-card-title">${title}</h3>

      <p class="poem-preview">${preview}</p>

      <div class="poem-card-footer">
        <span class="poem-time">
          <span aria-hidden="true">⏱</span>
          <span>${time} min read</span>
        </span>
        <a
          href="poems/${filename}"
          class="poem-read-btn"
          aria-label="Read ${title}"
        >
          Read <span aria-hidden="true">→</span>
        </a>
      </div>

      <div class="poem-card-actions">
        <button
          class="card-action-btn favorite ${isFav ? 'is-favorite' : ''}"
          data-id="${id}"
          aria-label="${isFav ? 'Remove from' : 'Add to'} favorites"
          aria-pressed="${isFav}"
        >
          <span class="icon-unfavorited">🤍</span>
          <span class="icon-favorited">❤️</span>
        </button>
      </div>
    </article>
  `;
}


/* ============================================================
   2. LOADER
   ============================================================ */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  const hide = () => {
    loader.style.transition = 'opacity 0.6s ease';
    loader.style.opacity    = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      loader.setAttribute('aria-busy', 'false');
    }, 650);
  };

  if (document.readyState === 'complete') {
    setTimeout(hide, 500);
  } else {
    window.addEventListener('load', () => setTimeout(hide, 500));
  }
}


/* ============================================================
   3. SCROLL PROGRESS BAR
   ============================================================ */
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const st    = document.documentElement.scrollTop;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? clamp((st / total) * 100, 0, 100) + '%' : '0%';
  }, { passive: true });
}


/* ============================================================
   4. NAVBAR — hamburger + dropdown
   ============================================================ */
function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('navHamburger');
  const navLinks  = document.getElementById('navLinks');
  let   lastY     = 0;

  // Scroll hide/show
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (navbar) {
      navbar.classList.toggle('scrolled', y > 50);
      if (y > 200) {
        navbar.classList.toggle('hidden', y > lastY);
      } else {
        navbar.classList.remove('hidden');
      }
    }
    lastY = y;
  }, { passive: true });

  // ── Hamburger ──
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      State.isNavOpen = !State.isNavOpen;
      navLinks.classList.toggle('open', State.isNavOpen);
      hamburger.setAttribute('aria-expanded', State.isNavOpen);
    });
  }

  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    if (State.isNavOpen && navbar && !navbar.contains(e.target)) {
      State.isNavOpen = false;
      navLinks?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
    }
  });

  // Close nav when any nav link (not dropdown toggle) is clicked
  navLinks?.querySelectorAll('a.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      State.isNavOpen = false;
      navLinks.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
    });
  });

  // ── Dropdown ──
  // Target the menu div, not the button
  const dropToggle = document.querySelector('.dropdown-toggle');
  const dropMenu   = document.querySelector('.dropdown-menu');

  if (dropToggle && dropMenu) {

    dropToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropMenu.classList.toggle('open');
      dropToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropToggle.contains(e.target) && !dropMenu.contains(e.target)) {
        dropMenu.classList.remove('open');
        dropToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Escape closes dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropMenu.classList.contains('open')) {
        dropMenu.classList.remove('open');
        dropToggle.setAttribute('aria-expanded', 'false');
        dropToggle.focus();
      }
    });

    // Dropdown item clicks
    dropMenu.querySelectorAll('.dropdown-item[data-filter]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const filter = item.getAttribute('data-filter');
        dropMenu.classList.remove('open');
        dropToggle.setAttribute('aria-expanded', 'false');
        // Close mobile nav too
        State.isNavOpen = false;
        navLinks?.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
        // Filter and scroll
        filterPoems(filter);
        document.getElementById('poems')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }
}


/* ============================================================
   5. THEME TOGGLE
   ============================================================ */
function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  // Restore saved theme
  const saved = lsGet('tla-theme', 'dark');
  applyTheme(saved);

  btn.addEventListener('click', () => {
    const next = State.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    lsSet('tla-theme', next);
  });
}

function applyTheme(theme) {
  State.theme = theme;
  document.body.classList.toggle('light-mode', theme === 'light');
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', theme === 'light');
  }
}


/* ============================================================
   6. BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.hidden = window.scrollY < 400;
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ============================================================
   7. FILTER POEMS BY CATEGORY
   ============================================================ */
function filterPoems(category) {
  State.activeFilter = category;

  const cards   = document.querySelectorAll('#poemsGrid .poem-card');
  let   visible = 0;

  cards.forEach(card => {
    const show = category === 'all' || card.dataset.category === category;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  // No results message
  const noResults = document.getElementById('noResults');
  if (noResults) noResults.hidden = visible > 0;

  // Update count
  const vc = document.getElementById('visibleCount');
  if (vc) vc.textContent = visible;

  // Sync category tabs
  document.querySelectorAll('.category-tab').forEach(tab => {
    const active = tab.dataset.category === category;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active);
  });

  // Update URL hash
  if (category === 'all') {
    history.replaceState(null, '', location.pathname);
  } else {
    history.replaceState(null, '', '#' + category);
  }
}

function initCategoryTabs() {
  // Category tab buttons
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => filterPoems(tab.dataset.category));
  });

  // Footer [data-filter] links
  document.querySelectorAll('.footer [data-filter]').forEach(el => {
    el.addEventListener('click', (e) => {
      const filter = el.getAttribute('data-filter');
      if (!filter) return;
      e.preventDefault();
      filterPoems(filter);
      document.getElementById('poems')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function applyHashFilter() {
  const hash  = location.hash.replace('#', '').trim();
  const valid = ['sonnets', 'heartbreak', 'chichewa', 'love', 'spiritual', 'nature', 'other'];
  if (hash && valid.includes(hash)) {
    filterPoems(hash);
    document.getElementById('poems')?.scrollIntoView({ behavior: 'smooth' });
  }
}

window.addEventListener('hashchange', () => {
  if (State.poemsLoaded) applyHashFilter();
});


/* ============================================================
   8. SORT POEMS
   ============================================================ */
function initSortSelect() {
  const select = document.getElementById('sortSelect');
  if (!select) return;

  select.value = lsGet('tla-sort', 'default');

  select.addEventListener('change', () => {
    lsSet('tla-sort', select.value);
    sortGrid(select.value);
  });
}

function sortGrid(key) {
  const grid  = document.getElementById('poemsGrid');
  if (!grid)  return;

  const cards = Array.from(grid.querySelectorAll('.poem-card'));

  cards.sort((a, b) => {
    const tA = (a.dataset.title || '').toLowerCase();
    const tB = (b.dataset.title || '').toLowerCase();
    const iA = parseInt(a.dataset.index) || 0;
    const iB = parseInt(b.dataset.index) || 0;
    const rA = parseInt(a.dataset.time)  || 0;
    const rB = parseInt(b.dataset.time)  || 0;

    switch (key) {
      case 'title-asc':    return tA.localeCompare(tB);
      case 'title-desc':   return tB.localeCompare(tA);
      case 'newest':       return iB - iA;
      case 'oldest':       return iA - iB;
      case 'reading-time': return rA - rB;
      default:             return iA - iB;
    }
  });

  const frag = document.createDocumentFragment();
  cards.forEach(c => frag.appendChild(c));
  grid.appendChild(frag);
}


/* ============================================================
   9. VIEW TOGGLE  (grid / list)
   ============================================================ */
function initViewToggle() {
  const grid = document.getElementById('poemsGrid');
  const btns = document.querySelectorAll('.view-btn');
  if (!grid || !btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;

      // Toggle grid class
      if (view === 'list') {
        grid.classList.add('poems-list');
      } else {
        grid.classList.remove('poems-list');
      }

      // Toggle active state on buttons
      btns.forEach(b => {
        const active = b.dataset.view === view;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active);
      });

      lsSet('tla-view', view);
    });
  });
}


/* ============================================================
   10. POEM OF THE DAY
   ============================================================ */
function initPoemOfDay(poems) {
  if (!poems?.length) return;

  const poem = poems[todayIndex(poems.length)];
  const d    = new Date();

  const potdTitle    = document.getElementById('potdPoemTitle');
  const potdExcerpt  = document.getElementById('potdExcerpt');
  const potdCategory = document.getElementById('potdCategory');
  const potdDate     = document.getElementById('potdDate');
  const potdReadBtn  = document.getElementById('potdReadBtn');

  if (potdTitle)    potdTitle.textContent    = poem.title        || '';
  if (potdExcerpt)  potdExcerpt.textContent  = poem.preview      || '';
  if (potdCategory) potdCategory.textContent = poem.categoryLabel || poem.category || '';
  if (potdDate)     potdDate.textContent     = d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  if (potdReadBtn) {
    potdReadBtn.onclick = () => {
      window.location.href = 'poems/' + poem.filename;
    };
  }
}


/* ============================================================
   11. SEARCH OVERLAY
   ============================================================ */
function initSearchOverlay(poems) {

  const overlay      = document.getElementById('searchOverlay');
  const openBtn      = document.getElementById('searchToggle');
  const closeBtn     = document.getElementById('searchOverlayClose');
  const input        = document.getElementById('poemSearch');
  const clearBtn     = document.getElementById('searchClear');
  const resultsList  = document.getElementById('searchResultsList');
  const resultsCount = document.getElementById('searchResultsCount');
  const hintBtns     = document.querySelectorAll('.search-hint-btn');
  const voiceBtn     = document.getElementById('voiceSearch');

  if (!overlay || !openBtn) {
    console.warn('[TLA] Search: missing overlay or openBtn');
    return;
  }

  // ── Open ──
  function openSearch() {
    State.isSearchOpen = true;
    overlay.classList.add('active');
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input?.focus(), 80);
  }

  // ── Close ──
  function closeSearch() {
    State.isSearchOpen = false;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (input)        input.value              = '';
    if (resultsList)  resultsList.innerHTML    = '';
    if (resultsCount) resultsCount.textContent = '';
    if (clearBtn)     clearBtn.hidden          = true;
    openBtn?.focus();
  }

  // ── Wire up open button ──
  // Remove existing listeners by replacing the node
  const freshOpenBtn = openBtn.cloneNode(true);
  openBtn.parentNode?.replaceChild(freshOpenBtn, openBtn);
  freshOpenBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openSearch();
  });

  // ── Close button ──
  closeBtn?.addEventListener('click', closeSearch);

  // ── Click on the dark backdrop (not the content box) ──
  overlay.addEventListener('click', (e) => {
    const content = overlay.querySelector('.search-overlay-content');
    if (content && !content.contains(e.target)) {
      closeSearch();
    }
  });

  // ── Escape key ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && State.isSearchOpen) closeSearch();
    // '/' opens search
    if (e.key === '/' && !State.isSearchOpen &&
        !e.target.matches('input, textarea, select')) {
      e.preventDefault();
      openSearch();
    }
  });

  // ── Hint buttons ──
  hintBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (input) {
        input.value = btn.dataset.search || '';
        input.dispatchEvent(new Event('input'));
        input.focus();
      }
    });
  });

  // ── Live search ──
  const doSearch = debounce((q) => {
    if (!q) {
      if (resultsList)  resultsList.innerHTML    = '';
      if (resultsCount) resultsCount.textContent = '';
      return;
    }

    const qLow    = q.toLowerCase();
    const matches = poems.filter(p => {
      return [p.title, p.category, p.categoryLabel, p.preview, p.date]
        .join(' ')
        .toLowerCase()
        .includes(qLow);
    });

    if (resultsCount) {
      resultsCount.textContent =
        matches.length + ' poem' + (matches.length !== 1 ? 's' : '') + ' found';
    }

    if (resultsList) {
      if (matches.length) {
        resultsList.innerHTML = matches.map(p => `
          <a href="poems/${esc(p.filename)}" class="search-result-item">
            <span class="result-number" aria-hidden="true">${esc(p.number ?? '✦')}</span>
            <span class="result-title">${esc(p.title)}</span>
            <span class="result-category">${esc(p.categoryLabel ?? p.category ?? '')}</span>
            <span class="result-preview">${esc(p.preview ?? '')}</span>
            <span class="result-time">⏱ ${p.time ?? 1} min read</span>
          </a>
        `).join('');
      } else {
        resultsList.innerHTML = `
          <div style="text-align:center;padding:32px;opacity:.6;">
            <div style="font-size:2rem;margin-bottom:8px;">📭</div>
            <p>No poems matched <strong>"${esc(q)}"</strong></p>
          </div>
        `;
      }
    }
  }, 220);

  input?.addEventListener('input', () => {
    const q = input.value.trim();
    if (clearBtn) clearBtn.hidden = !q;
    doSearch(q);
  });

  // ── Clear button ──
  clearBtn?.addEventListener('click', () => {
    if (input) { input.value = ''; input.focus(); }
    if (resultsList)  resultsList.innerHTML    = '';
    if (resultsCount) resultsCount.textContent = '';
    if (clearBtn)     clearBtn.hidden          = true;
  });

  // ── Voice search ──
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (voiceBtn && SR) {
    const rec  = new SR();
    rec.lang   = 'en-US';
    rec.onstart  = () => voiceBtn.classList.add('listening');
    rec.onend    = () => voiceBtn.classList.remove('listening');
    rec.onresult = (e) => {
      if (input) {
        input.value = e.results[0][0].transcript;
        input.dispatchEvent(new Event('input'));
      }
    };
    rec.onerror = () => {
      voiceBtn.classList.remove('listening');
      showToast('Voice search failed.', 'error');
    };
    voiceBtn.addEventListener('click', () => {
      try { rec.start(); } catch { rec.stop(); }
    });
  } else {
    if (voiceBtn) voiceBtn.style.display = 'none';
  }
}


/* ============================================================
   12. FAVORITES
   ============================================================ */
function getFavorites() {
  return lsGet('tla-favorites', []);
}

function toggleFavorite(id) {
  let favs = getFavorites();
  const had = favs.includes(id);
  if (had) {
    favs = favs.filter(f => f !== id);
    showToast('Removed from favorites', 'info');
  } else {
    favs.push(id);
    showToast('Added to favorites ❤️', 'success');
  }
  lsSet('tla-favorites', favs);
  refreshFavoriteBtn(id, !had);
  updateFavoritesCount();
}

function refreshFavoriteBtn(id, isFav) {
  document.querySelectorAll(`.card-action-btn.favorite[data-id="${CSS.escape(id)}"]`)
    .forEach(btn => {
      btn.classList.toggle('is-favorite', isFav);
      btn.setAttribute('aria-pressed', isFav);
    });
}

function updateFavoritesCount() {
  const el = document.getElementById('statFavorites');
  if (el) el.textContent = getFavorites().length;
}

function initFavoriteButtons() {
  const grid = document.getElementById('poemsGrid');
  if (!grid) return;

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.card-action-btn.favorite');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(btn.dataset.id);
  });

  // Restore saved favorites state
  const favs = getFavorites();
  grid.querySelectorAll('.card-action-btn.favorite').forEach(btn => {
    const isFav = favs.includes(btn.dataset.id);
    btn.classList.toggle('is-favorite', isFav);
    btn.setAttribute('aria-pressed', isFav);
  });
}


/* ============================================================
   13. FAVORITES MODAL
   ============================================================ */
function initFavoritesModal() {
  const modal    = document.getElementById('favoritesModal');
  const overlay  = document.getElementById('favoritesModalOverlay');
  const closeBtn = document.getElementById('favoritesModalClose');
  const list     = document.getElementById('favoritesList');
  const empty    = document.getElementById('favoritesEmpty');
  const viewBtn  = document.getElementById('viewFavorites');

  if (!modal) return;

  function openModal() {
    const favs = getFavorites();
    if (list) list.innerHTML = '';

    if (!favs.length) {
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      if (list) {
        favs.forEach(id => {
          const card = document.querySelector(`.poem-card[data-id="${CSS.escape(id)}"]`);
          if (!card) return;
          const title = card.dataset.title || 'Poem';
          const href  = card.querySelector('.poem-read-btn')?.getAttribute('href') || '#';
          const cat   = card.querySelector('.poem-category')?.textContent || '';
          const time  = card.dataset.time || 1;
          const a     = document.createElement('a');
          a.href      = href;
          a.className = 'favorites-item';
          a.innerHTML = `
            <div>
              <span style="font-weight:600;">❤️ ${esc(title)}</span>
              <span style="opacity:.6;font-size:.8rem;display:block;">${esc(cat)} · ${time} min</span>
            </div>
            <span>→</span>
          `;
          list.appendChild(a);
        });
      }
    }

    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  viewBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}


/* ============================================================
   14. READING STATS
   ============================================================ */
function initReadingStats() {
  // Increment visits
  const visits = (lsGet('tla-visits', 0) || 0) + 1;
  lsSet('tla-visits', visits);
  const visitsEl = document.getElementById('statVisits');
  if (visitsEl) visitsEl.textContent = visits;

  // Restore read count
  const read = lsGet('tla-poems-read', 0) || 0;
  applyReadStats(read);

  // Track when a poem link is clicked
  document.getElementById('poemsGrid')?.addEventListener('click', (e) => {
    if (!e.target.closest('.poem-read-btn')) return;
    const newRead = (lsGet('tla-poems-read', 0) || 0) + 1;
    lsSet('tla-poems-read', newRead);
    applyReadStats(newRead);
  });

  // Clear stats
  document.getElementById('clearStats')?.addEventListener('click', () => {
    lsSet('tla-poems-read', 0);
    lsSet('tla-favorites',  []);
    applyReadStats(0);
    updateFavoritesCount();
    document.querySelectorAll('.card-action-btn.favorite').forEach(btn => {
      btn.classList.remove('is-favorite');
      btn.setAttribute('aria-pressed', 'false');
    });
    showToast('Stats cleared 🗑️', 'info');
  });
}

function applyReadStats(count) {
  const total = State.poems.length || 15;
  const sp    = document.getElementById('statPoems');
  const st    = document.getElementById('statTime');
  const pb    = document.getElementById('poemsProgressBar');
  if (sp) sp.textContent   = count;
  if (st) st.textContent   = count + 'm';
  if (pb) pb.style.width   = clamp((count / total) * 100, 0, 100) + '%';
}


/* ============================================================
   15. TESTIMONIALS SLIDER
   ============================================================ */
function initTestimonials() {
  const slider   = document.getElementById('testimonialsSlider');
  const dotsWrap = document.getElementById('testimonialsDots');
  const prevBtn  = document.getElementById('prevTestimonial');
  const nextBtn  = document.getElementById('nextTestimonial');

  if (!slider) return;

  const cards = slider.querySelectorAll('.testimonial-card');
  if (!cards.length) return;

  let current = 0;
  let timer;
  const dots = [];

  function goTo(i) {
    current = ((i % cards.length) + cards.length) % cards.length;
    slider.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, j) => {
      d.classList.toggle('active', j === current);
      d.setAttribute('aria-selected', j === current);
    });
  }

  if (dotsWrap) {
    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'testimonial-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
      dot.addEventListener('click', () => { goTo(i); reset(); });
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });
  }

  prevBtn?.addEventListener('click', () => { goTo(current - 1); reset(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); reset(); });

  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', start);

  function start() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5000);
  }
  function reset() { clearInterval(timer); start(); }

  goTo(0);
  start();
}


/* ============================================================
   16. SUBMIT POEM FORM
   ============================================================ */
function initSubmitForm() {
  const form     = document.getElementById('submitPoemForm');
  const textarea = document.getElementById('poemContent');
  const counter  = document.getElementById('charCount');

  textarea?.addEventListener('input', () => {
    if (counter) counter.textContent = textarea.value.length + ' / 5000 characters';
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    let first = null;

    const fields = [
      { id: 'poetName',     errId: 'poetNameError',    msg: 'Please enter your name.'    },
      { id: 'poetEmail',    errId: 'poetEmailError',   msg: 'Please enter your email.'   },
      { id: 'poemTitle',    errId: 'poemTitleError',   msg: 'Please enter a title.'      },
      { id: 'poemCategory', errId: 'poemCategoryError',msg: 'Please select a category.'  },
      { id: 'poemContent',  errId: 'poemContentError', msg: 'Please enter your poem.'    },
    ];

    fields.forEach(({ id, errId, msg }) => {
      const el    = document.getElementById(id);
      const errEl = document.getElementById(errId);
      const empty = !el?.value.trim();
      if (errEl) errEl.textContent = empty ? msg : '';
      if (empty) { valid = false; first = first ?? el; }
    });

    const agree    = document.getElementById('agreeTerms');
    const agreeErr = document.getElementById('agreeTermsError');
    if (agree && !agree.checked) {
      if (agreeErr) agreeErr.textContent = 'You must agree to the terms.';
      valid = false;
      first = first ?? agree;
    } else {
      if (agreeErr) agreeErr.textContent = '';
    }

    if (!valid) { first?.focus(); return; }

    showToast('Poem submitted! Thank you ✍️', 'success');
    form.reset();
    if (counter) counter.textContent = '0 / 5000 characters';
  });
}


/* ============================================================
   17. CONTACT FORM
   ============================================================ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = document.getElementById('contactName')?.value.trim();
    const email   = document.getElementById('contactEmail')?.value.trim();
    const message = document.getElementById('contactMessage')?.value.trim();

    if (!name || !email || !message) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    showToast("Message sent! I'll get back to you soon 📬", 'success');
    form.reset();
  });
}


/* ============================================================
   18. NEWSLETTER FORM
   ============================================================ */
function initNewsletterForm() {
  const form  = document.getElementById('newsletterForm');
  const input = document.getElementById('newsletterEmail');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input?.value.trim()) {
      showToast('Please enter your email.', 'error');
      return;
    }
    showToast('Subscribed! Welcome to the Poetry Circle ✨', 'success');
    form.reset();
  });
}


/* ============================================================
   19. KEYBOARD SHORTCUTS MODAL
   ============================================================ */
function initKeyboardShortcuts() {
  const modal    = document.getElementById('shortcutsModal');
  const overlay  = document.getElementById('shortcutsOverlay');
  const closeBtn = document.getElementById('shortcutsClose');
  const showBtn  = document.getElementById('showShortcuts');

  if (!modal) return;

  const open  = () => { modal.removeAttribute('hidden'); closeBtn?.focus(); };
  const close = () => { modal.setAttribute('hidden', ''); showBtn?.focus(); };

  showBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === '?') open();
    if (e.key === 'Escape') close();
    if (e.key === 't' || e.key === 'T') document.getElementById('themeToggle')?.click();
  });
}


/* ============================================================
   20. COOKIE BANNER
   ============================================================ */
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (!banner || lsGet('tla-cookies')) return;

  setTimeout(() => banner.removeAttribute('hidden'), 1800);

  document.getElementById('acceptCookies')?.addEventListener('click', () => {
    lsSet('tla-cookies', 'accepted');
    banner.setAttribute('hidden', '');
    showToast('Cookies accepted 🍪', 'info');
  });
  document.getElementById('declineCookies')?.addEventListener('click', () => {
    lsSet('tla-cookies', 'declined');
    banner.setAttribute('hidden', '');
  });
  document.getElementById('customizeCookies')?.addEventListener('click', () => {
    showToast('Cookie customisation coming soon.', 'info');
  });
}


/* ============================================================
   21. HERO PARTICLES
   ============================================================ */
function initHeroParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const symbols = ['✦', '·', '˙', '∗', '⁕', '❋', '✧', '◦'];
  const frag    = document.createDocumentFragment();

  for (let i = 0; i < 30; i++) {
    const s       = document.createElement('span');
    s.className   = 'particle';
    s.textContent = symbols[i % symbols.length];
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = [
      'position:absolute',
      `left:${Math.random() * 100}%`,
      `top:${Math.random() * 100}%`,
      `opacity:${(Math.random() * 0.4 + 0.1).toFixed(2)}`,
      `font-size:${(Math.random() * 14 + 7).toFixed(0)}px`,
      `animation:float ${(Math.random() * 6 + 4).toFixed(1)}s ease-in-out ${(Math.random() * 4).toFixed(1)}s infinite alternate`,
      'pointer-events:none',
      'user-select:none',
    ].join(';');
    frag.appendChild(s);
  }

  container.appendChild(frag);
}


/* ============================================================
   22. TOAST NOTIFICATIONS
   ============================================================ */
function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  // Remove duplicate
  container.querySelectorAll('.toast').forEach(t => {
    if (t.dataset.msg === msg) t.remove();
  });

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast  = document.createElement('div');
  toast.className   = `toast toast-${type}`;
  toast.dataset.msg = msg;
  toast.setAttribute('role', 'alert');
  toast.innerHTML   = `
    <span aria-hidden="true">${icons[type] ?? 'ℹ️'}</span>
    <span>${esc(msg)}</span>
    <button style="background:none;border:none;cursor:pointer;margin-left:auto;opacity:.7;color:inherit;"
            aria-label="Dismiss">✕</button>
  `;

  toast.querySelector('button')?.addEventListener('click', () => dismiss(toast));
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

  const t = setTimeout(() => dismiss(toast), duration);
  toast.addEventListener('mouseenter', () => clearTimeout(t));
  toast.addEventListener('mouseleave', () => setTimeout(() => dismiss(toast), 1500));
}

function dismiss(toast) {
  toast.classList.remove('show');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}


/* ============================================================
   23. FOOTER YEAR
   ============================================================ */
function initFooterYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = new Date().getFullYear();
}


/* ============================================================
   24. SMOOTH SCROLL
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


/* ============================================================
   25. RESET FILTERS BUTTON
   ============================================================ */
function initResetFilters() {
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    filterPoems('all');
    const select = document.getElementById('sortSelect');
    if (select) { select.value = 'default'; sortGrid('default'); }
    showToast('Filters reset', 'info');
  });
}


/* ============================================================
   26. CARD KEYBOARD NAVIGATION (Enter / Space opens poem)
   ============================================================ */
function initCardKeyboard() {
  const grid = document.getElementById('poemsGrid');
  if (!grid) return;

  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.poem-card');
    if (!card) return;
    if (e.target.closest('button, a')) return;
    e.preventDefault();
    card.querySelector('.poem-read-btn')?.click();
  });
}


/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // Non-poem features
  initLoader();
  initScrollProgress();
  initNavbar();
  initThemeToggle();
  initBackToTop();
  initHeroParticles();
  initTestimonials();
  initSubmitForm();
  initContactForm();
  initNewsletterForm();
  initKeyboardShortcuts();
  initCookieBanner();
  initFavoritesModal();
  initReadingStats();
  initFooterYear();
  initSmoothScroll();
  initResetFilters();

  // Load poems — boots favorites, tabs, sort,
  // view toggle, poem-of-day, search
  loadPoems();

});