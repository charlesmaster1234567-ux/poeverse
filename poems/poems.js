/* ═══════════════════════════════════════════════════
   TheLongAfter — poems.js
   Full feature logic for all individual poem pages
═══════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────
   1. POEM IDENTITY
   Reads data-* from <body data-poem-id="...">
───────────────────────────────────────────────── */
const POEM_ID   = document.body.getAttribute('data-poem-id')   || 'poem';
const CATEGORY  = document.body.getAttribute('data-category')  || 'all';
const PREV_FILE = document.body.getAttribute('data-prev')      || null;
const NEXT_FILE = document.body.getAttribute('data-next')      || null;
const FAV_KEY   = 'fav_' + POEM_ID;


/* ─────────────────────────────────────────────────
   2. READING PROGRESS BAR
───────────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const scrollTop = document.documentElement.scrollTop;
  const total     = document.documentElement.scrollHeight - window.innerHeight;
  const pct       = total > 0 ? (scrollTop / total) * 100 : 0;
  const bar       = document.getElementById('progress-bar');
  if (bar) bar.style.width = pct + '%';
}, { passive: true });


/* ─────────────────────────────────────────────────
   3. TOAST HELPER
───────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}


/* ─────────────────────────────────────────────────
   4. READ ALOUD  (Web Speech API — line by line)
───────────────────────────────────────────────── */
let utterance   = null;
let isReading   = false;
let readLines   = [];
let currentLine = 0;

function toggleReadAloud() {
  const btn = document.getElementById('btn-read');
  if (isReading) {
    window.speechSynthesis.cancel();
    isReading = false;
    clearHighlights();
    if (btn) btn.classList.remove('active');
    if (btn) btn.setAttribute('aria-pressed', 'false');
    return;
  }
  if (!('speechSynthesis' in window)) {
    showToast('❌ Your browser does not support Read Aloud.');
    return;
  }

  readLines   = Array.from(
    document.querySelectorAll('.poem-body .poem-line, #poem-content p')
  ).filter(p => !p.classList.contains('stanza-break') && p.textContent.trim());

  currentLine = 0;
  isReading   = true;
  if (btn) { btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); }
  showToast('🔊 Reading aloud…');
  readLine(currentLine);
}

function readLine(index) {
  if (!isReading || index >= readLines.length) {
    isReading = false;
    clearHighlights();
    const btn = document.getElementById('btn-read');
    if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); }
    showToast('✅ Done reading.');
    return;
  }
  clearHighlights();
  const line = readLines[index];
  line.classList.add('reading-highlight');
  line.scrollIntoView({ behavior: 'smooth', block: 'center' });

  utterance       = new SpeechSynthesisUtterance(line.textContent);
  utterance.rate  = 0.88;
  utterance.pitch = 1.0;
  utterance.onend = () => { currentLine++; readLine(currentLine); };
  window.speechSynthesis.speak(utterance);
}

function clearHighlights() {
  document.querySelectorAll('.poem-line, #poem-content p').forEach(p => {
    p.classList.remove('reading-highlight');
  });
}


/* ─────────────────────────────────────────────────
   5. FOCUS MODE
───────────────────────────────────────────────── */
let focusActive = false;

function toggleFocus() {
  focusActive = !focusActive;
  document.body.classList.toggle('focus-mode', focusActive);
  const btn  = document.getElementById('btn-focus');
  const exit = document.getElementById('focus-exit');
  if (btn)  { btn.classList.toggle('active', focusActive); btn.setAttribute('aria-pressed', focusActive); }
  if (exit) { exit.hidden = !focusActive; }
  showToast(focusActive ? '🧘 Focus mode on — scroll freely' : '✅ Focus mode off');
}


/* ─────────────────────────────────────────────────
   6. FAVORITE  (per poem, localStorage)
───────────────────────────────────────────────── */
function toggleFavorite() {
  const isFav = localStorage.getItem(FAV_KEY) === 'true';
  localStorage.setItem(FAV_KEY, String(!isFav));
  applyFavUI(!isFav);
  showToast(isFav ? '💔 Removed from favorites' : '❤️ Added to favorites!');
}

function applyFavUI(state) {
  const btn  = document.getElementById('btn-fav');
  const icon = document.getElementById('heart-icon');
  if (btn)  { btn.classList.toggle('fav-active', state); btn.setAttribute('aria-pressed', state); }
  if (icon) icon.setAttribute('fill', state ? '#e05c5c' : 'none');
}

applyFavUI(localStorage.getItem(FAV_KEY) === 'true');


/* ─────────────────────────────────────────────────
   7. SHARE MODAL  — open / close
───────────────────────────────────────────────── */
function sharePoem() {
  const modal = document.getElementById('share-modal');
  if (modal) modal.removeAttribute('hidden');
}

function closeShareModal() {
  const modal = document.getElementById('share-modal');
  if (modal) modal.setAttribute('hidden', '');
}

document.getElementById('share-modal')?.addEventListener('click', e => {
  if (e.target.classList.contains('share-modal-overlay')) closeShareModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeShareModal();
});

function shareTo(platform) {
  const title    = getPoemTitle();
  const url      = encodeURIComponent(window.location.href);
  const text     = encodeURIComponent(`"${title}" — a poem by TheLongAfter`);
  let   shareURL = '';

  switch (platform) {
    case 'whatsapp':
      shareURL = `https://wa.me/?text=${text}%20${url}`;
      window.open(shareURL, '_blank');
      break;
    case 'twitter':
      shareURL = `https://twitter.com/intent/tweet?text=${text}&url=${url}&via=thelongafter`;
      window.open(shareURL, '_blank');
      break;
    case 'facebook':
      shareURL = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      window.open(shareURL, '_blank');
      break;
    case 'copy':
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToast('🔗 Link copied to clipboard!'))
        .catch(() => showToast('❌ Could not copy link.'));
      break;
  }
  closeShareModal();
}


/* ─────────────────────────────────────────────────
   8. COPY POEM TEXT
───────────────────────────────────────────────── */
async function copyPoem() {
  const title = getPoemTitle();
  const lines = Array.from(
    document.querySelectorAll('.poem-body .poem-line, #poem-content p')
  ).map(p => p.textContent.trim()).join('\n');

  const full = `${title}\n— TheLongAfter\n\n${lines}\n\n${window.location.href}`;
  try {
    await navigator.clipboard.writeText(full);
    showToast('📋 Poem copied to clipboard!');
  } catch {
    showToast('❌ Could not copy. Try manually.');
  }
}


/* ─────────────────────────────────────────────────
   9. PRINT POEM
───────────────────────────────────────────────── */
function printPoem() {
  window.print();
}


/* ─────────────────────────────────────────────────
   10. READING MODE — cycles Night → Sepia → Paper
───────────────────────────────────────────────── */
const READING_MODES = ['night', 'sepia', 'paper'];
const MODE_LABELS   = { night: 'Night', sepia: 'Sepia', paper: 'Paper' };
const MODE_CLASSES  = { night: '', sepia: 'mode-sepia', paper: 'mode-paper' };
let   currentMode   = localStorage.getItem('tla-read-mode') || 'night';

applyReadingMode(currentMode);

function cycleReadingMode() {
  const idx   = READING_MODES.indexOf(currentMode);
  currentMode = READING_MODES[(idx + 1) % READING_MODES.length];
  localStorage.setItem('tla-read-mode', currentMode);
  applyReadingMode(currentMode);
  showToast(`📖 Reading mode: ${MODE_LABELS[currentMode]}`);
}

function applyReadingMode(mode) {
  Object.values(MODE_CLASSES).forEach(cls => {
    if (cls) document.body.classList.remove(cls);
  });
  if (mode === 'sepia' || mode === 'paper') {
    document.body.classList.remove('light-mode');
  }
  if (MODE_CLASSES[mode]) document.body.classList.add(MODE_CLASSES[mode]);
  const label = document.getElementById('readmode-label');
  if (label) {
    const next = READING_MODES[(READING_MODES.indexOf(mode) + 1) % READING_MODES.length];
    label.textContent = MODE_LABELS[next];
  }
}


/* ─────────────────────────────────────────────────
   11. DARK / LIGHT THEME
───────────────────────────────────────────────── */
let isLight = localStorage.getItem('theme') === 'light';
applyTheme(isLight);

function toggleTheme() {
  document.body.classList.remove('mode-sepia', 'mode-paper');
  currentMode = 'night';
  localStorage.setItem('tla-read-mode', 'night');

  isLight = !isLight;
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  applyTheme(isLight);
}

function applyTheme(light) {
  document.body.classList.toggle('light-mode', light);
  const label = document.getElementById('theme-label');
  const icon  = document.getElementById('theme-icon');
  if (label) label.textContent = light ? 'Dark' : 'Light';
  if (icon) {
    icon.innerHTML = light
      ? `<circle cx="12" cy="12" r="5"/>
         <line x1="12" y1="1"  x2="12" y2="3"/>
         <line x1="12" y1="21" x2="12" y2="23"/>
         <line x1="4.22" y1="4.22"  x2="5.64"  y2="5.64"/>
         <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
         <line x1="1"  y1="12" x2="3"  y2="12"/>
         <line x1="21" y1="12" x2="23" y2="12"/>
         <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
         <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>`
      : `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
  }
}


/* ─────────────────────────────────────────────────
   12. FONT SIZE CONTROLS
───────────────────────────────────────────────── */
let fontSize = parseFloat(localStorage.getItem('poem-font-size')) || 1.15;
applyFont(fontSize);

function changeFontSize(dir) {
  fontSize = Math.min(2.2, Math.max(0.8, +(fontSize + dir * 0.1).toFixed(2)));
  localStorage.setItem('poem-font-size', fontSize);
  applyFont(fontSize);
  showToast(`🔡 Font: ${Math.round(fontSize * 100)}%`);
}

function applyFont(size) {
  document.documentElement.style.setProperty('--font-size', size + 'rem');
}


/* ─────────────────────────────────────────────────
   13. LINE SPACING CONTROLS
───────────────────────────────────────────────── */
let lineSpacing = parseFloat(localStorage.getItem('poem-line-spacing')) || 1.95;
applyLineSpacing(lineSpacing);

function changeLineSpacing(dir) {
  lineSpacing = Math.min(3.5, Math.max(1.2, +(lineSpacing + dir).toFixed(1)));
  localStorage.setItem('poem-line-spacing', lineSpacing);
  applyLineSpacing(lineSpacing);
  showToast(`↕ Spacing: ${lineSpacing.toFixed(1)}`);
}

function applyLineSpacing(val) {
  document.documentElement.style.setProperty('--line-spacing', val);
}


/* ─────────────────────────────────────────────────
   14. QUOTE SHARE BUBBLE
───────────────────────────────────────────────── */
let selectedText = '';

document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('touchend', handleTextSelection);

function handleTextSelection() {
  const selection = window.getSelection();
  const bubble    = document.getElementById('quote-bubble');
  const poemBody  = document.querySelector('.poem-body, #poem-content');
  if (!bubble || !poemBody) return;

  if (
    selection &&
    selection.toString().trim().length > 0 &&
    poemBody.contains(selection.anchorNode)
  ) {
    selectedText     = selection.toString().trim();
    const range      = selection.getRangeAt(0);
    const rect       = range.getBoundingClientRect();
    const wrapper    = document.querySelector('.poem-wrapper');
    const wRect      = wrapper ? wrapper.getBoundingClientRect() : { left: 0, top: 0 };

    bubble.hidden        = false;
    bubble.style.top     = (rect.top  - wRect.top  - 46 + window.scrollY) + 'px';
    bubble.style.left    = (rect.left - wRect.left + rect.width / 2 - 60) + 'px';
  } else {
    setTimeout(() => {
      if (!window.getSelection()?.toString().trim()) {
        bubble.hidden = true;
        selectedText  = '';
      }
    }, 200);
  }
}

function shareSelectedText() {
  if (!selectedText) return;
  const line = `"${selectedText}" — TheLongAfter\n${window.location.href}`;
  if (navigator.share) {
    navigator.share({ text: line }).catch(() => {});
  } else {
    navigator.clipboard.writeText(line)
      .then(() => showToast('📋 Line copied!'))
      .catch(()  => showToast('❌ Could not copy.'));
  }
  const bubble = document.getElementById('quote-bubble');
  if (bubble) bubble.hidden = true;
}


/* ─────────────────────────────────────────────────
   15. LINE CLICK HIGHLIGHT
───────────────────────────────────────────────── */
document.querySelectorAll('.poem-line, #poem-content p').forEach(line => {
  line.addEventListener('click', () => {
    const wasSelected = line.classList.contains('line-selected');
    document.querySelectorAll('.poem-line.line-selected, #poem-content p.line-selected')
      .forEach(l => l.classList.remove('line-selected'));
    if (!wasSelected) line.classList.add('line-selected');
  });
});


/* ─────────────────────────────────────────────────
   16. RELATED POEMS
───────────────────────────────────────────────── */
async function loadRelatedPoems() {
  const grid = document.getElementById('related-grid');
  if (!grid) return;

  try {
    const res   = await fetch('/poems.json');
    if (!res.ok) throw new Error('poems.json not found');
    const poems = await res.json();

    const related = poems
      .filter(p => p.category === CATEGORY && p.id !== POEM_ID)
      .slice(0, 4);

    if (related.length === 0) {
      grid.innerHTML = '<p class="related-loading">No related poems yet.</p>';
      return;
    }

    grid.innerHTML = related.map(p => `
      <a href="${p.filename}" class="related-card">
        <span class="related-card-number">${p.number}</span>
        <span class="related-card-title">${p.title}</span>
        <span class="related-card-category">${p.categoryLabel}</span>
        <span class="related-card-time">⏱ ${p.time} min read</span>
      </a>
    `).join('');

  } catch {
    if (grid) grid.innerHTML = '<p class="related-loading">Could not load related poems.</p>';
  }
}


/* ─────────────────────────────────────────────────
   17. WATERMARK BUILDER  (for PDF)
───────────────────────────────────────────────── */
function buildWatermarkDataURL(pageWmm, pageHmm) {
  const PPM    = 10;
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(pageWmm * PPM);
  canvas.height = Math.round(pageHmm * PPM);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const stamp = (fontSizeMm, xMm, yMm) => {
    ctx.save();
    ctx.translate(xMm * PPM, yMm * PPM);
    ctx.rotate(Math.PI / 4);
    ctx.font         = `bold ${fontSizeMm * PPM}px Georgia, serif`;
    ctx.fillStyle    = '#c9a84c';
    ctx.globalAlpha  = 0.07;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TheLongAfter', 0, 0);
    ctx.restore();
  };

  const grid = [
    [pageWmm * 0.20, pageHmm * 0.12],[pageWmm * 0.68, pageHmm * 0.12],
    [pageWmm * 0.20, pageHmm * 0.32],[pageWmm * 0.68, pageHmm * 0.32],
    [pageWmm * 0.20, pageHmm * 0.55],[pageWmm * 0.68, pageHmm * 0.55],
    [pageWmm * 0.20, pageHmm * 0.76],[pageWmm * 0.68, pageHmm * 0.76],
    [pageWmm * 0.20, pageHmm * 0.95],[pageWmm * 0.68, pageHmm * 0.95],
  ];
  grid.forEach(([x, y]) => stamp(9, x, y));
  stamp(18, pageWmm * 0.50, pageHmm * 0.50);

  return canvas.toDataURL('image/png');
}


/* ─────────────────────────────────────────────────
   17b. MOOD IMAGE LOADER
   — Converts the mood <img> to a base64 dataURL
     so jsPDF can embed it without CORS issues.
     Tries the <img> element first (already loaded
     by browser), falls back to fetch+FileReader.
───────────────────────────────────────────────── */
function getMoodImageDataURL() {
  return new Promise((resolve) => {

    /* ── Step 1: grab the <img> already on the page ── */
    const imgEl = document.querySelector('.poem-mood-image img');

    /* ── Step 2: build the URL we need ───────────────
       The HTML uses:  src="../images/mood/i-wonder-mood.jpeg"
       We resolve that to an absolute URL so fetch works
       even when the page is in /poems/ sub-folder.        */
    const rawSrc = imgEl ? imgEl.getAttribute('src') : null;

    /* Derive a clean absolute URL */
    let absoluteURL = null;
    if (rawSrc) {
      // Use <a> trick to resolve relative paths reliably
      const a  = document.createElement('a');
      a.href   = rawSrc;
      absoluteURL = a.href;   // e.g. https://thelongafter.onrender.com/images/mood/i-wonder-mood.jpeg
    }

    /* ── Step 3: if the <img> is already fully loaded
       and not broken, draw it onto a canvas instantly ── */
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0 && absoluteURL) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        canvas.getContext('2d').drawImage(imgEl, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.85);
        // If canvas gives a non-empty image, use it
        if (dataURL && dataURL.length > 100) {
          resolve({ dataURL, width: imgEl.naturalWidth, height: imgEl.naturalHeight });
          return;
        }
      } catch (canvasErr) {
        // Canvas tainted by CORS — fall through to fetch approach
        console.warn('Canvas tainted, trying fetch…', canvasErr.message);
      }
    }

    /* ── Step 4: fetch with credentials omitted (avoids
       CORS pre-flight issues for same-origin assets) ─── */
    if (!absoluteURL) {
      resolve(null);   // No image found at all
      return;
    }

    fetch(absoluteURL, { mode: 'cors', credentials: 'omit' })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then(blob => {
        const reader  = new FileReader();
        reader.onload = () => {
          /* We need width/height — create a temp Image to measure */
          const tmp   = new Image();
          tmp.onload  = () => resolve({
            dataURL : reader.result,
            width   : tmp.naturalWidth,
            height  : tmp.naturalHeight
          });
          tmp.onerror = () => resolve({
            dataURL : reader.result,
            width   : 800,   // safe fallback dimensions
            height  : 600
          });
          tmp.src = reader.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.warn('Mood image fetch failed:', err.message);
        resolve(null);   // PDF will still generate, just without image
      });
  });
}


/* ─────────────────────────────────────────────────
   18. DYNAMIC SCRIPT LOADER
───────────────────────────────────────────────── */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    /* If already loaded and jspdf is available, resolve immediately */
    if (window.jspdf && window.jspdf.jsPDF) { resolve(); return; }

    /* Remove any broken previous attempt */
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) existing.remove();

    const s   = document.createElement('script');
    s.src     = src;
    s.onload  = () => {
      /* Give the UMD bundle a tick to register window.jspdf */
      setTimeout(resolve, 100);
    };
    s.onerror = () => reject(new Error('Failed to load: ' + src));
    document.head.appendChild(s);
  });
}


/* ─────────────────────────────────────────────────
   19. DOWNLOAD AS PDF  ← MAIN FIX
───────────────────────────────────────────────── */
async function downloadPDF() {

  /* ── Disable button while working ───────────────── */
  const pdfBtn = document.getElementById('btn-pdf');
  if (pdfBtn) { pdfBtn.disabled = true; pdfBtn.style.opacity = '0.5'; }
  showToast('⏳ Generating PDF…');

  try {

    /* ── 1. Load jsPDF (handles defer + double-load) ─ */
    const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    await loadScript(JSPDF_CDN);

    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('jsPDF did not initialise correctly.');
    }

    /* ── 2. Gather poem data ─────────────────────── */
    const { jsPDF }  = window.jspdf;
    const title      = getPoemTitle();
    const category   = (document.querySelector('.category-badge')?.textContent || CATEGORY).trim();
    const number     = (document.querySelector('.number-badge')?.textContent   || '').trim();
    const dateText   = (document.querySelector('.poem-date')?.textContent       || '').trim();
    const poemLines  = Array.from(
      document.querySelectorAll('.poem-body .poem-line, #poem-content p')
    ).map(p => p.textContent.trim());

    /* ── 3. Load mood image (async, non-blocking) ── */
    showToast('⏳ Loading mood image…');
    const moodImg = await getMoodImageDataURL();

    /* ── 4. Create document ─────────────────────── */
    const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   // 210
    const pageH = doc.internal.pageSize.getHeight();  // 297

    /* ── Colour palette ──────────────────────────── */
    const C = {
      bg          : [14,  14,  14 ],   // near-black page background
      accent      : [150, 31,  114],   // deep magenta
      accentLight : [200, 80,  160],   // lighter magenta for sub-text
      gold        : [201, 168, 76 ],   // gold rule
      textBody    : [255, 214, 241],   // soft pink poem text
      textMuted   : [140, 140, 140],   // footer muted
      white       : [255, 255, 255],
    };

    /* ── Reusable: paint background + bars ──────── */
    function paintBackground() {
      doc.setFillColor(...C.bg);
      doc.rect(0, 0, pageW, pageH, 'F');

      // Top accent bar
      doc.setFillColor(...C.accent);
      doc.rect(0, 0, pageW, 3, 'F');

      // Bottom accent bar
      doc.setFillColor(...C.accent);
      doc.rect(0, pageH - 3, pageW, 3, 'F');
    }

    /* ── Reusable: add watermark ─────────────────── */
    const wmDataURL = buildWatermarkDataURL(pageW, pageH);
    function addWatermark() {
      doc.addImage(wmDataURL, 'PNG', 0, 0, pageW, pageH);
    }

    /* ── Reusable: add footer on current page ────── */
    function addFooter(pageNum, totalPages) {
      // Thin gold rule
      doc.setDrawColor(...C.gold);
      doc.setLineWidth(0.25);
      doc.line(14, pageH - 16, pageW - 14, pageH - 16);

      // Brand name
      doc.setTextColor(...C.accent);
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(8);
      doc.text('TheLongAfter', pageW / 2, pageH - 10, { align: 'center' });

      // URL
      doc.setTextColor(...C.textMuted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text(window.location.href, pageW / 2, pageH - 6, { align: 'center' });

      // Page number (if multi-page)
      if (totalPages > 1) {
        doc.setTextColor(...C.textMuted);
        doc.setFontSize(6);
        doc.text(`${pageNum} / ${totalPages}`, pageW - 14, pageH - 6, { align: 'right' });
      }
    }

    /* ══════════════════════════════════════════════
       PAGE 1 — MOOD IMAGE COVER
    ══════════════════════════════════════════════ */
    paintBackground();
    addWatermark();

    if (moodImg) {

      /* ── Calculate image placement ──────────────
         We want the image to fill most of the page
         but leave room for the title overlay below.
         Max image area: full width, top 65% of page  */
      const imgNaturalW = moodImg.width;
      const imgNaturalH = moodImg.height;
      const aspectRatio = imgNaturalW / imgNaturalH;

      const maxImgW = pageW;          // full width
      const maxImgH = pageH * 0.62;   // top 62 % of page

      let drawW = maxImgW;
      let drawH = drawW / aspectRatio;

      if (drawH > maxImgH) {
        drawH = maxImgH;
        drawW = drawH * aspectRatio;
      }

      const imgX = (pageW - drawW) / 2;
      const imgY = 3;   // start just below top bar

      /* Detect format from dataURL */
      const fmt = moodImg.dataURL.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(moodImg.dataURL, fmt, imgX, imgY, drawW, drawH);

      /* Gradient-like dark overlay at the bottom of the image
         (done as a series of semi-transparent black rects)     */
      const overlayTop    = imgY + drawH - 28;
      const overlaySteps  = 14;
      for (let s = 0; s < overlaySteps; s++) {
        const alpha = (s / overlaySteps) * 0.85;
        doc.setFillColor(14, 14, 14);
        doc.setGState(doc.GState({ opacity: alpha }));
        doc.rect(imgX, overlayTop + (s * 28 / overlaySteps), drawW, 28 / overlaySteps, 'F');
      }
      doc.setGState(doc.GState({ opacity: 1 }));   // reset opacity

      /* ── Mood caption badge ────────────────────── */
      const captionEl  = document.querySelector('.mood-image-caption');
      const captionTxt = captionEl ? captionEl.textContent.trim() : `${number} ${category}`;

      doc.setFillColor(...C.accent);
      doc.setGState(doc.GState({ opacity: 0.85 }));
      const badgeW = 38, badgeH = 7;
      const badgeX = 14, badgeY = imgY + 6;
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));

      doc.setTextColor(...C.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text(captionTxt.toUpperCase(), badgeX + badgeW / 2, badgeY + 4.5, { align: 'center' });

      /* ── Title block below the image ──────────── */
      const titleY = imgY + drawH + 10;

      // Thin gold rule above title
      doc.setDrawColor(...C.gold);
      doc.setLineWidth(0.35);
      doc.line(30, titleY - 4, pageW - 30, titleY - 4);

      // Site brand (small, above title)
      doc.setTextColor(...C.accent);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.text('T H E L O N G A F T E R', pageW / 2, titleY, { align: 'center' });

      // Poem title (large)
      doc.setTextColor(...C.white);
      doc.setFont('times', 'bold');
      doc.setFontSize(28);
      const wrappedTitle = doc.splitTextToSize(title.toUpperCase(), pageW - 30);
      doc.text(wrappedTitle, pageW / 2, titleY + 10, { align: 'center' });

      // Category + number
      const metaY = titleY + 10 + (wrappedTitle.length * 10) + 4;
      doc.setTextColor(...C.accentLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const metaParts = [category, number ? `No. ${number}` : '', dateText].filter(Boolean);
      doc.text(metaParts.join('  ·  '), pageW / 2, metaY, { align: 'center' });

      // Thin gold rule below meta
      doc.setDrawColor(...C.gold);
      doc.setLineWidth(0.25);
      doc.line(40, metaY + 4, pageW - 40, metaY + 4);

    } else {
      /* ── No mood image — plain cover ────────────── */
      // Large decorative quote mark
      doc.setTextColor(...C.accent);
      doc.setFont('times', 'bold');
      doc.setFontSize(120);
      doc.setGState(doc.GState({ opacity: 0.08 }));
      doc.text('\u201C', pageW / 2 - 20, pageH * 0.45, { align: 'center' });
      doc.setGState(doc.GState({ opacity: 1 }));

      // Brand
      doc.setTextColor(...C.accent);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('T H E L O N G A F T E R', 14, 16);

      // Gold rule
      doc.setDrawColor(...C.gold);
      doc.setLineWidth(0.4);
      doc.line(14, 22, pageW - 14, 22);

      // Title
      doc.setTextColor(...C.white);
      doc.setFont('times', 'bold');
      doc.setFontSize(32);
      const wrappedTitle = doc.splitTextToSize(title.toUpperCase(), pageW - 30);
      doc.text(wrappedTitle, pageW / 2, pageH * 0.38, { align: 'center' });

      // Category + number
      doc.setTextColor(...C.accentLight);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const metaParts = [category, number ? `No. ${number}` : '', dateText].filter(Boolean);
      doc.text(metaParts.join('  ·  '), pageW / 2, pageH * 0.38 + 14, { align: 'center' });

      // Gold rule below
      doc.setDrawColor(...C.gold);
      doc.setLineWidth(0.25);
      doc.line(35, pageH * 0.38 + 20, pageW - 35, pageH * 0.38 + 20);
    }

    addFooter(1, '?');   // page number finalised after all pages are added


    /* ══════════════════════════════════════════════
       PAGE 2+ — POEM TEXT
    ══════════════════════════════════════════════ */
    doc.addPage();
    paintBackground();
    addWatermark();

    /* ── Page 2 header ───────────────────────────── */
    doc.setTextColor(...C.accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('T H E L O N G A F T E R', 14, 12);

    doc.setTextColor(...C.accentLight);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.text(`— ${title}`, pageW - 14, 12, { align: 'right' });

    // Thin rule under header
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.25);
    doc.line(14, 15, pageW - 14, 15);

    /* ── Render poem lines ───────────────────────── */
    const LINE_H     = 9.0;    // mm between each line
    const STANZA_GAP = 4.5;    // extra gap every 4 lines
    const MARGIN_L   = 30;     // left / right margin for text
    const MAX_W      = pageW - MARGIN_L * 2;
    const FOOTER_Y   = pageH - 22;   // don't draw below here
    let   y          = 26;
    let   pageNum    = 2;

    /* Track pages for footer retrospective */
    const pageStarts = [];   // will store page numbers

    poemLines.forEach((rawLine, i) => {
      const line = rawLine.trim();

      // Blank line = stanza break
      if (!line) {
        y += STANZA_GAP;
        return;
      }

      const wrapped = doc.splitTextToSize(line, MAX_W);

      wrapped.forEach(segment => {
        /* ── New page if needed ──────────────── */
        if (y + LINE_H > FOOTER_Y) {
          addFooter(pageNum, '?');
          doc.addPage();
          pageNum++;
          paintBackground();
          addWatermark();

          // Continuation header
          doc.setTextColor(...C.accent);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.text('T H E L O N G A F T E R', 14, 12);

          doc.setTextColor(...C.accentLight);
          doc.setFont('times', 'italic');
          doc.setFontSize(9);
          doc.text(`— ${title} (cont.)`, pageW - 14, 12, { align: 'right' });

          doc.setDrawColor(...C.accent);
          doc.setLineWidth(0.25);
          doc.line(14, 15, pageW - 14, 15);

          y = 26;
        }

        // Draw line
        doc.setTextColor(...C.textBody);
        doc.setFont('times', 'italic');
        doc.setFontSize(13);
        doc.text(segment, pageW / 2, y, { align: 'center' });
        y += LINE_H;
      });

      // Extra space every 4 poem lines (visual stanza feel)
      if ((i + 1) % 4 === 0) y += 3;
    });

    /* ── Poem signature at the end ──────────────── */
    y += 6;
    if (y + 10 > FOOTER_Y) {
      addFooter(pageNum, '?');
      doc.addPage();
      pageNum++;
      paintBackground();
      addWatermark();
      y = 30;
    }

    doc.setDrawColor(...C.gold);
    doc.setLineWidth(0.25);
    doc.line(pageW / 2 - 20, y, pageW / 2 + 20, y);
    y += 6;

    doc.setTextColor(...C.accent);
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(10);
    doc.text('— TheLongAfter', pageW / 2, y, { align: 'center' });

    /* ── Last page footer ───────────────────────── */
    addFooter(pageNum, '?');

    /* ══════════════════════════════════════════════
       Now we know total pages: go back and fix them.
       jsPDF doesn't support retroactive editing, so
       we use a simple "Page X" on each page instead.
       The total was always '?' above; let's rewrite
       with the real count using putTotalPages trick.
    ══════════════════════════════════════════════ */
    // jsPDF 2.x supports this via internal.getNumberOfPages()
    const totalPages = doc.internal.getNumberOfPages();

    for (let pg = 1; pg <= totalPages; pg++) {
      doc.setPage(pg);

      // Overwrite page number area (small rect to clear old text)
      doc.setFillColor(...C.bg);
      doc.rect(pageW - 28, pageH - 9, 28, 5, 'F');

      if (totalPages > 1) {
        doc.setTextColor(...C.textMuted);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.text(`${pg} / ${totalPages}`, pageW - 14, pageH - 6, { align: 'right' });
      }
    }

    /* ── Save ───────────────────────────────────── */
    const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`${safeName}-thelongafter.pdf`);
    showToast('✅ PDF downloaded!');

  } catch (err) {
    console.error('PDF generation failed:', err);
    showToast(`❌ PDF failed: ${err.message}`);
  } finally {
    /* ── Re-enable button ───────────────────────── */
    if (pdfBtn) { pdfBtn.disabled = false; pdfBtn.style.opacity = ''; }
  }
}


/* ─────────────────────────────────────────────────
   20. HELPER — Get poem title from DOM
───────────────────────────────────────────────── */
function getPoemTitle() {
  return (
    document.querySelector('h1.poem-title')?.textContent.trim() ||
    document.querySelector('.poem-title')?.textContent.trim()   ||
    document.querySelector('#poem-heading')?.textContent.trim() ||
    document.title.split('–')[0].trim()                         ||
    'Poem'
  );
}


/* ─────────────────────────────────────────────────
   21. FOOTER YEAR
───────────────────────────────────────────────── */
function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}


/* ─────────────────────────────────────────────────
   22. NAVIGATION BUTTONS
───────────────────────────────────────────────── */
function initNavigation() {
  const prevBtn = document.getElementById('prev-poem-btn');
  const nextBtn = document.getElementById('next-poem-btn');
  if (prevBtn && !PREV_FILE) prevBtn.style.visibility = 'hidden';
  if (nextBtn && !NEXT_FILE) nextBtn.style.visibility = 'hidden';
}


/* ─────────────────────────────────────────────────
   23. KEYBOARD SHORTCUTS
───────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea')) return;

  switch (e.key) {
    case 'f': case 'F': toggleFavorite();   break;
    case 'r': case 'R': toggleReadAloud();  break;
    case 's': case 'S': sharePoem();        break;
    case 'p': case 'P': downloadPDF();      break;
    case 't': case 'T': toggleTheme();      break;
    case 'z': case 'Z': toggleFocus();      break;
    case 'Escape':       closeShareModal();  break;
    case 'ArrowLeft':
      if (PREV_FILE) window.location.href = PREV_FILE;
      break;
    case 'ArrowRight':
      if (NEXT_FILE) window.location.href = NEXT_FILE;
      break;
  }
});


/* ─────────────────────────────────────────────────
   24. BOOT
───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFooterYear();
  initNavigation();
  loadRelatedPoems();

  if (!localStorage.getItem('tla-poem-visited')) {
    setTimeout(() => {
      showToast('💡 Press P for PDF — Z for focus mode');
      localStorage.setItem('tla-poem-visited', 'true');
    }, 2000);
  }
});