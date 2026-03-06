// ===== FLOATING ACTION BUTTON =====
function toggleFabMenu() {
  const fabMenu = document.querySelector('.fab-menu');
  fabMenu.classList.toggle('show');
}

function fabAction(action) {
  const fabMenu = document.querySelector('.fab-menu');
  fabMenu.classList.remove('show');

  switch(action) {
    case 'theme':
      document.getElementById('themeToggle').click();
      break;
    case 'music':
      toggleMusicPanel();
      break;
    case 'favorites':
      const favoritesSection = document.getElementById('favoritesSection');
      favoritesSection.style.display = favoritesSection.style.display === 'none' ? 'block' : 'none';
      break;
    case 'stats':
      const statsSection = document.querySelector('.stats-section');
      statsSection.style.display = statsSection.style.display === 'none' ? 'block' : 'none';
      break;
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.fab') && !e.target.closest('.fab-menu')) {
    document.querySelector('.fab-menu').classList.remove('show');
  }
});

// ===== MUSIC PLAYER CORE =====
let audioCtx = null;
let currentTrack = null;

function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function fadeOutAndStop(track) {
  if (!track || !audioCtx) return;
  const g = track.mainGain;
  const now = audioCtx.currentTime;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(g.gain.value, now);
  g.gain.linearRampToValueAtTime(0, now + 1.2);
  setTimeout(() => {
    try {
      if (track.cleanup) track.cleanup();
    } catch (e) {}
    if (track.nodes) track.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} });
  }, 1400);
}

function toggleMusicPanel() {
  const controls = document.getElementById('musicControls');
  controls.classList.toggle('show');
}

function setMusicVolume(value) {
  document.getElementById('volumeValue').textContent = value + '%';
  const vol = value / 100;
  if (currentTrack && currentTrack.mainGain) {
    if (!audioCtx) return;
    currentTrack.mainGain.gain.cancelScheduledValues(audioCtx.currentTime);
    currentTrack.mainGain.gain.setValueAtTime(vol, audioCtx.currentTime);
  }
  const music = JSON.parse(localStorage.getItem('music')) || { type: 'none', url: null, volume: 30 };
  music.volume = Number(value);
  localStorage.setItem('music', JSON.stringify(music));
}

// Generator: ocean (filtered noise with slow LFO)
function startOcean(volume = 0.3) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const size = ctx.sampleRate * 2;
  const b = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = b.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const src = ctx.createBufferSource();
  src.buffer = b;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.03;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 600;
  lfo.connect(lfoGain);
  lfoGain.connect(lp.frequency);
  const mainGain = ctx.createGain();
  mainGain.gain.value = 0;
  src.connect(lp).connect(mainGain).connect(ctx.destination);
  lfo.start();
  src.start();
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
  return {
    type: 'ocean_long',
    nodes: [src, lp, lfo, lfoGain],
    mainGain,
    cleanup: () => { try { lfo.stop(); src.stop(); } catch (e) {} }
  };
}

// Generator: siren meditation
function startSirenMeditation(volume = 0.25) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 220;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 60;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.9;
  const fb = ctx.createGain();
  fb.gain.value = 0.4;
  const mainGain = ctx.createGain();
  mainGain.gain.value = 0;
  osc.connect(delay).connect(fb).connect(delay);
  delay.connect(mainGain).connect(ctx.destination);
  osc.start();
  lfo.start();
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
  return {
    type: 'siren_meditation',
    nodes: [osc, lfo, lfoGain, delay, fb],
    mainGain,
    cleanup: () => { try { osc.stop(); lfo.stop(); } catch (e) {} }
  };
}

// Generator: instrumental pad
function startInstrumental(volume = 0.28) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = 220;
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = 330;
  o2.detune.value = 5;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.05;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 15;
  lfo.connect(lfoGain);
  lfoGain.connect(o1.frequency);
  lfoGain.connect(o2.frequency);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1000;
  const mainGain = ctx.createGain();
  mainGain.gain.value = 0;
  const merger = ctx.createGain();
  o1.connect(merger);
  o2.connect(merger);
  merger.connect(lp).connect(mainGain).connect(ctx.destination);
  o1.start();
  o2.start();
  lfo.start();
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2);
  return {
    type: 'instrumental_long',
    nodes: [o1, o2, lfo, lfoGain, lp],
    mainGain,
    cleanup: () => { try { o1.stop(); o2.stop(); lfo.stop(); } catch (e) {} }
  };
}

// Generator: OM chant
function startOMChant(volume = 0.24) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const fundamental = ctx.createOscillator();
  fundamental.type = 'sine';
  fundamental.frequency.value = 136;
  const overtone1 = ctx.createOscillator();
  overtone1.type = 'sine';
  overtone1.frequency.value = 272;
  const overtone2 = ctx.createOscillator();
  overtone2.type = 'sine';
  overtone2.frequency.value = 408;
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.06;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 20;
  lfo.connect(lfoGain);
  lfoGain.connect(fundamental.frequency);
  const mainGain = ctx.createGain();
  mainGain.gain.value = 0;
  const merger = ctx.createGain();
  fundamental.connect(merger);
  overtone1.connect(merger);
  overtone2.connect(merger);
  merger.connect(mainGain).connect(ctx.destination);
  fundamental.start();
  overtone1.start();
  overtone2.start();
  lfo.start();
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2.5);
  return {
    type: 'om_chant',
    nodes: [fundamental, overtone1, overtone2, lfo, lfoGain],
    mainGain,
    cleanup: () => { try { fundamental.stop(); overtone1.stop(); overtone2.stop(); lfo.stop(); } catch (e) {} }
  };
}

// Generator: vocal meditation
function startVocalMeditation(volume = 0.28) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 200;
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 205;
  osc2.detune.value = 8;
  const lfo1 = ctx.createOscillator();
  lfo1.type = 'sine';
  lfo1.frequency.value = 0.04;
  const lfoGain1 = ctx.createGain();
  lfoGain1.gain.value = 25;
  lfo1.connect(lfoGain1);
  lfoGain1.connect(osc1.frequency);
  const mainGain = ctx.createGain();
  mainGain.gain.value = 0;
  const merger = ctx.createGain();
  osc1.connect(merger);
  osc2.connect(merger);
  merger.connect(mainGain).connect(ctx.destination);
  osc1.start();
  osc2.start();
  lfo1.start();
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2);
  return {
    type: 'vocal_meditation',
    nodes: [osc1, osc2, lfo1, lfoGain1],
    mainGain,
    cleanup: () => { try { osc1.stop(); osc2.stop(); lfo1.stop(); } catch (e) {} }
  };
}

// Generator: flute meditation
function startFluteMeditate(volume = 0.26) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const flutePitch = ctx.createOscillator();
  flutePitch.type = 'triangle';
  flutePitch.frequency.value = 520;
  const vibratoLFO = ctx.createOscillator();
  vibratoLFO.type = 'sine';
  vibratoLFO.frequency.value = 5.2;
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 12;
  vibratoLFO.connect(vibratoGain);
  vibratoGain.connect(flutePitch.frequency);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  const mainGain = ctx.createGain();
  mainGain.gain.value = 0;
  flutePitch.connect(lp).connect(mainGain).connect(ctx.destination);
  flutePitch.start();
  vibratoLFO.start();
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.8);
  return {
    type: 'flute_meditate',
    nodes: [flutePitch, vibratoLFO, vibratoGain, lp],
    mainGain,
    cleanup: () => { try { flutePitch.stop(); vibratoLFO.stop(); } catch (e) {} }
  };
}

// Brahms Lullaby (fallback generator)
async function startBrahmsLullaby(volume = 0.3) {
  ensureAudioCtx();
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 440;
  const env = audioCtx.createGain();
  env.gain.value = 0;
  osc.connect(env).connect(audioCtx.destination);
  osc.start();
  env.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 1.2);
  return { type: 'brahms_lullaby', nodes: [osc], mainGain: env, cleanup: () => { try { osc.stop(); } catch (e) {} } };
}

// Rain generator
function startRain(volume = 0.3) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const size = ctx.sampleRate * 1;
  const b = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = b.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * 0.8;
  const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q = 0.8;
  const trem = ctx.createOscillator(); trem.type = 'sine'; trem.frequency.value = 6 + Math.random() * 3;
  const tremGain = ctx.createGain(); tremGain.gain.value = 0.5;
  trem.connect(tremGain);
  const mainGain = ctx.createGain(); mainGain.gain.value = 0;
  tremGain.connect(mainGain.gain);
  src.connect(hp).connect(bp).connect(mainGain).connect(ctx.destination);
  trem.start(); src.start();
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);
  return {
    type: 'rain_long',
    nodes: [src, hp, bp, trem, tremGain],
    mainGain,
    cleanup: () => { try { trem.stop(); src.stop(); } catch (e) {} }
  };
}

function startChant(volume = 0.26) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 110;
  const det = ctx.createOscillator(); det.type = 'sine'; det.frequency.value = 112; det.detune.value = 4;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
  const mainGain = ctx.createGain(); mainGain.gain.value = 0;
  osc.connect(lp); det.connect(lp); lp.connect(mainGain).connect(ctx.destination);
  osc.start(); det.start();
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.8);
  return { type: 'chant_long', nodes: [osc, det, lp], mainGain, cleanup: () => { try { osc.stop(); det.stop(); } catch (e) {} } };
}

function startChoir(volume = 0.28) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const oscs = [];
  const merger = ctx.createGain();
  for (let i = 0; i < 4; i++) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 220 + i * 7; o.detune.value = i * 6;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.03 + i * 0.01;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 10 + i * 6;
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);
    o.connect(merger);
    o.start(); lfo.start();
    oscs.push(o, lfo, lfoGain);
  }
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
  const mainGain = ctx.createGain(); mainGain.gain.value = 0;
  merger.connect(lp).connect(mainGain).connect(ctx.destination);
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2.2);
  return { type: 'choir_long', nodes: oscs.concat([lp]), mainGain, cleanup: () => { try { oscs.forEach(n => n.stop && n.stop()); } catch (e) {} } };
}

function startForest(volume = 0.32) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const size = ctx.sampleRate * 2;
  const b = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = b.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
  const mainGain = ctx.createGain(); mainGain.gain.value = 0;
  src.connect(lp).connect(mainGain).connect(ctx.destination);
  src.start();
  const birdOsc = ctx.createOscillator(); birdOsc.type = 'triangle'; birdOsc.frequency.value = 1200;
  const birdGain = ctx.createGain(); birdGain.gain.value = 0;
  birdOsc.connect(birdGain).connect(ctx.destination);
  birdOsc.start();
  let birdTimer = setInterval(() => {
    const t = ctx.currentTime;
    birdGain.gain.cancelScheduledValues(t);
    birdGain.gain.setValueAtTime(0, t);
    birdGain.gain.linearRampToValueAtTime(0.18, t + 0.01);
    birdGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6 + Math.random() * 1.2);
    birdOsc.frequency.setValueAtTime(1000 + Math.random() * 1800, t);
  }, 4000 + Math.random() * 4000);
  mainGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.6);
  return { type: 'forest_long', nodes: [src, lp, birdOsc, birdGain], mainGain, cleanup: () => { clearInterval(birdTimer); try { birdOsc.stop(); src.stop(); } catch (e) {} } };
}

function startBells(volume = 0.22) {
  ensureAudioCtx();
  const ctx = audioCtx;
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 440;
  const env = ctx.createGain(); env.gain.value = 0;
  const delay = ctx.createDelay(); delay.delayTime.value = 1.1;
  const fb = ctx.createGain(); fb.gain.value = 0.45;
  osc.connect(env).connect(delay).connect(ctx.destination);
  delay.connect(fb).connect(delay);
  osc.start();
  env.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2);
  return { type: 'bells_long', nodes: [osc, env, delay, fb], mainGain: env, cleanup: () => { try { osc.stop(); } catch (e) {} } };
}

let isPaused = false;

function updateNowPlaying(text) {
  const el = document.getElementById('nowPlaying');
  if (el) el.textContent = 'Now Playing: ' + (text || '—');
}

function clearActiveTrackUI() {
  document.querySelectorAll('.track-card.active').forEach(c => c.classList.remove('active'));
}

async function playMusic(type, cardElem) {
  clearActiveTrackUI();
  if (cardElem && cardElem.classList) cardElem.classList.add('active');

  if (currentTrack) {
    fadeOutAndStop(currentTrack);
    currentTrack = null;
  }

  if (type === 'none') {
    updateNowPlaying('—');
    localStorage.setItem('music', JSON.stringify({ type: 'none', url: null, volume: document.getElementById('volumeSlider').value }));
    return;
  }

  const prevBtn = document.getElementById('btnPlayPause');
  if (prevBtn) prevBtn.textContent = '⏯️ Play/Pause';
  updateNowPlaying((cardElem && cardElem.querySelector('.track-title')) ? cardElem.querySelector('.track-title').textContent : type);
  
  const volume = (parseInt(document.getElementById('volumeSlider').value, 10) || 30) / 100;
  let newTrack = null;
  
  try {
    if (type === 'ocean_long') newTrack = startOcean(volume);
    else if (type === 'rain_long') newTrack = startRain(volume);
    else if (type === 'siren_meditation') newTrack = startSirenMeditation(volume);
    else if (type === 'instrumental_long') newTrack = startInstrumental(volume);
    else if (type === 'chant_long') newTrack = startChant(volume);
    else if (type === 'choir_long') newTrack = startChoir(volume);
    else if (type === 'forest_long') newTrack = startForest(volume);
    else if (type === 'bells_long') newTrack = startBells(volume);
    else if (type === 'om_chant') newTrack = startOMChant(volume);
    else if (type === 'vocal_meditation') newTrack = startVocalMeditation(volume);
    else if (type === 'flute_meditate') newTrack = startFluteMeditate(volume);
    else if (type === 'brahms_lullaby') newTrack = await startBrahmsLullaby(volume);
    else {
      alert('Unknown track type');
      clearActiveTrackUI();
      updateNowPlaying('—');
      return;
    }
    currentTrack = newTrack;
    localStorage.setItem('music', JSON.stringify({ type: newTrack.type, url: newTrack.url || null, volume: Math.round(volume * 100) }));
  } catch (err) {
    console.error(err);
    alert('Failed to start track: ' + err.message);
    clearActiveTrackUI();
    updateNowPlaying('—');
  }
}

function togglePauseResume() {
  if (!audioCtx) { alert('No audio playing'); return; }
  if (audioCtx.state === 'running') {
    audioCtx.suspend().then(() => {
      isPaused = true;
      const btn = document.getElementById('btnPlayPause');
      if (btn) btn.textContent = '▶ Resume';
    });
  } else {
    audioCtx.resume().then(() => {
      isPaused = false;
      const btn = document.getElementById('btnPlayPause');
      if (btn) btn.textContent = '⏯️ Play/Pause';
    });
  }
}

function stopMusic() {
  if (currentTrack) {
    fadeOutAndStop(currentTrack);
    currentTrack = null;
  }
  clearActiveTrackUI();
  updateNowPlaying('—');
  if (audioCtx && audioCtx.state === 'running') {
    const btn = document.getElementById('btnPlayPause');
    if (btn) btn.textContent = '⏯️ Play/Pause';
  }
  localStorage.setItem('music', JSON.stringify({ type: 'none', url: null, volume: document.getElementById('volumeSlider').value }));
}

let isMuted = false;
let previousVolume = 30;

function toggleMute() {
  const btn = document.getElementById('btnMute');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');

  if (isMuted) {
    // Unmute
    volumeSlider.value = previousVolume;
    setMusicVolume(previousVolume);
    btn.textContent = '🔇 Mute';
    isMuted = false;
  } else {
    // Mute
    previousVolume = parseInt(volumeSlider.value, 10);
    setMusicVolume(0);
    volumeValue.textContent = '0%';
    btn.textContent = '🔊 Unmute';
    isMuted = true;
  }
}

// ===== NAVIGATION MENU TOGGLE =====
function toggleNavMenu() {
  const navMenu = document.getElementById('navMenu');
  navMenu.classList.toggle('show');
}

document.addEventListener('click', (e) => {
  const navMenu = document.getElementById('navMenu');
  if (!e.target.closest('.nav-toggle-btn') && !e.target.closest('.nav-menu')) {
    navMenu.classList.remove('show');
  }
});

// Color palette for themes
const palette = ['#1a1a1a', '#0b3d91', '#4b0082', '#800080', '#2f4f4f', '#ff007f', '#ff8c00', '#20b2aa'];
const themes = [
  { bg: 'purple', fg: 'white', msg: 'you pressed 1 — purple theme' },
  { bg: 'grey', fg: 'aqua', msg: 'you pressed 2 — grey theme' },
  { bg: '#708090', fg: 'yellow', msg: 'you pressed 3 — slate theme' },
  { bg: 'green', fg: 'pink', msg: 'you pressed 4 — green theme' },
  { bg: 'pink', fg: 'purple', msg: 'you pressed 5 — pink theme' },
  { bg: 'yellow', fg: 'black', msg: 'you pressed 6 — yellow theme' },
  { bg: 'aqua', fg: 'blue', msg: 'you pressed 7 — aqua theme' },
  { bg: 'orange', fg: 'green', msg: 'you pressed 8 — orange theme' },
  { bg: '#c72f4b', fg: 'navy', msg: 'you pressed 9 — crimson theme' }
];

function setTheme(bg, fg, msg) {
  document.body.style.backgroundColor = bg;
  document.body.style.color = fg;
  if (msg) alert(msg);
}

document.addEventListener("keydown", function(event) {
  const keyNum = parseInt(event.key);
  if (keyNum >= 1 && keyNum <= 9) {
    const theme = themes[keyNum - 1];
    setTheme(theme.bg, theme.fg, theme.msg);
  } else if (!isNaN(keyNum) || isNaN(parseInt(event.key))) {
    setTheme('black', 'white', 'default theme applied — press 1-9 to use other theme colors');
  }
});

// Tab content toggle (accordion style: only one open at a time)
let tabButtons = document.querySelectorAll('.tab-button');
let tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    let tabId = button.dataset.tab;
    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.style.display = 'block';
      } else {
        content.style.display = 'none';
      }
    });
  });
});

// Logo click theme cycler
let clickCount = 0;
const logo = document.querySelector('.logo');
if (logo) {
  logo.addEventListener('click', function() {
    clickCount = (clickCount % 10) + 1;
    if (clickCount <= 9) {
      const theme = themes[clickCount - 1];
      setTheme(theme.bg, theme.fg, null);
    } else {
      setTheme('black', 'white', 'you have reached dark theme. Further clicks will repeat themes');
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const pageElements = document.querySelectorAll(".page");
  pageElements.forEach(element => {
    let randomColor = palette[Math.floor(Math.random() * palette.length)];
    element.style.backgroundColor = randomColor;
  });

  const loadpage = document.querySelector('.loadpage');
  if (loadpage) {
    setTimeout(function() {
      loadpage.style.display = 'none';
    }, 3000);
  }

  // Load features
  loadFavorites();
  loadStats();
});

// Scroll progress bar
window.addEventListener('scroll', () => {
  const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.style.width = scrolled + '%';
  }
});

// Dark mode toggle
const themeToggle = document.getElementById('themeToggle');
const isDarkMode = localStorage.getItem('darkMode') === 'true';

function applyDarkMode(isDark) {
  const body = document.body;
  if (isDark) {
    body.classList.add('dark-mode');
    themeToggle.textContent = '☀️ Light Mode';
    localStorage.setItem('darkMode', 'true');
  } else {
    body.classList.remove('dark-mode');
    themeToggle.textContent = '🌙 Dark Mode';
    localStorage.setItem('darkMode', 'false');
  }
}

if (isDarkMode) {
  applyDarkMode(true);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isCurrentlyDark = document.body.classList.contains('dark-mode');
    applyDarkMode(!isCurrentlyDark);
  });
}

// Share functions
function shareToTwitter(title) {
  const text = `Enjoying "${title}" by Black Broken Heart 💔`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
  window.open(url, '_blank', 'width=600,height=400');
}

function shareToWhatsApp(title) {
  const text = `Check out "${title}" by Black Broken Heart 💔 ${window.location.href}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function shareToFacebook(title) {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(title + ' by Black Broken Heart')}`;
  window.open(url, '_blank', 'width=600,height=400');
}

// PDF Export
function exportAsPDF(tabId, title) {
  const element = document.getElementById(tabId);
  if (!element) {
    alert('Could not find content to export. Please try again.');
    return;
  }

  try {
    const opt = {
      margin: 10,
      filename: title.replace(/\s+/g, '_') + '.pdf',
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      alert('PDF exported successfully!');
    }).catch((error) => {
      console.error('PDF export error:', error);
      alert('Failed to export PDF. Please check your browser settings or try again.');
    });
  } catch (error) {
    console.error('PDF export error:', error);
    alert('An error occurred while exporting the PDF. Please try again.');
  }
}

// ===== SPEAKER FEATURE =====
let currentSpeechUtterance = null;
const activeSpeakers = {};

function extractTextFromTab(tabId) {
  const tabElement = document.getElementById(tabId);
  if (!tabElement) return '';
  const clone = tabElement.cloneNode(true);
  const readingTime = clone.querySelector('.reading-time');
  const shareButtons = clone.querySelector('.share-buttons');
  if (readingTime) readingTime.remove();
  if (shareButtons) shareButtons.remove();
  let text = clone.innerText.trim();
  text = text.replace(/\s+/g, ' ');
  return text;
}

function initializeVoices() {
  const voices = speechSynthesis.getVoices();
  ['tab1', 'tab2', 'tab3'].forEach(tabId => {
    const voiceSelect = document.getElementById('voice-select-' + tabId);
    if (voiceSelect) {
      voiceSelect.innerHTML = '<option value="">Default Voice</option>';
      voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = voice.name + (voice.default ? ' (default)' : '');
        voiceSelect.appendChild(option);
      });
    }
  });
}

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = initializeVoices;
}
initializeVoices();

function toggleSettings(tabId) {
  const panel = document.getElementById('settings-panel-' + tabId);
  const allPanels = document.querySelectorAll('.speaker-settings-panel');
  allPanels.forEach(p => {
    if (p.id !== 'settings-panel-' + tabId) {
      p.classList.remove('show');
    }
  });
  panel.classList.toggle('show');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.speaker-settings-toggle') && !e.target.closest('.speaker-settings-panel')) {
    document.querySelectorAll('.speaker-settings-panel').forEach(panel => {
      panel.classList.remove('show');
    });
  }
});

function updateVoiceSettings(tabId) {
  const voiceSelect = document.getElementById('voice-select-' + tabId);
  const selectedIndex = voiceSelect.value;
  if (selectedIndex !== '') {
    const voices = speechSynthesis.getVoices();
    window.selectedVoice = { [tabId]: voices[selectedIndex] };
  } else {
    window.selectedVoice = { [tabId]: null };
  }
}

function updateSpeed(tabId, value) {
  const display = document.getElementById('speed-value-' + tabId);
  display.textContent = value + 'x';
  window.speechSettings = window.speechSettings || {};
  window.speechSettings[tabId] = window.speechSettings[tabId] || {};
  window.speechSettings[tabId].speed = parseFloat(value);
}

function updatePitch(tabId, value) {
  const display = document.getElementById('pitch-value-' + tabId);
  display.textContent = value;
  window.speechSettings = window.speechSettings || {};
  window.speechSettings[tabId] = window.speechSettings[tabId] || {};
  window.speechSettings[tabId].pitch = parseFloat(value);
}

window.speechSettings = {};
window.selectedVoice = {};
['tab1', 'tab2', 'tab3'].forEach(tabId => {
  window.speechSettings[tabId] = { speed: 1.0, pitch: 1.0 };
});

function toggleSpeaker(tabId) {
  const button = document.getElementById('speaker-' + tabId);
  
  if (currentSpeechUtterance) {
    speechSynthesis.cancel();
    document.querySelectorAll('.speaker-btn').forEach(btn => {
      btn.classList.remove('playing');
      btn.textContent = '🔊 Read Aloud';
    });
    currentSpeechUtterance = null;
    if (activeSpeakers[tabId]) {
      activeSpeakers[tabId] = false;
      return;
    }
  }
  
  const text = extractTextFromTab(tabId);
  if (!text) {
    alert('No text found to read');
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  const settings = window.speechSettings[tabId] || { speed: 1.0, pitch: 1.0 };
  utterance.rate = settings.speed || 1.0;
  utterance.pitch = settings.pitch || 1.0;
  utterance.volume = 1.0;
  
  if (window.selectedVoice && window.selectedVoice[tabId]) {
    utterance.voice = window.selectedVoice[tabId];
  }
  
  utterance.onend = () => {
    button.classList.remove('playing');
    button.textContent = '🔊 Read Aloud';
    activeSpeakers[tabId] = false;
    currentSpeechUtterance = null;
    endReadingSession();
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event.error);
    button.textContent = '🔊 Read Aloud';
    button.classList.remove('playing');
    activeSpeakers[tabId] = false;
    endReadingSession();
  };
  
  button.classList.add('playing');
  button.textContent = '⏸️ Stop Reading';
  activeSpeakers[tabId] = true;
  currentSpeechUtterance = utterance;
  trackReadingTime(tabId);
  speechSynthesis.speak(utterance);
}

// ===== FAVORITES FEATURE =====
function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  updateFavoritesDisplay(favorites);
  
  ['tab1', 'tab2', 'tab3'].forEach((tabId, index) => {
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
      const isFavorite = favorites.includes(tabId);
      const btn = document.createElement('button');
      btn.className = `favorite-btn ${isFavorite ? 'active' : ''}`;
      btn.innerHTML = '❤️';
      btn.onclick = () => toggleFavorite(tabId);
      
      const readingTime = tabContent.querySelector('.reading-time');
      if (readingTime) {
        readingTime.parentNode.insertBefore(btn, readingTime);
      }
    }
  });
}

function toggleFavorite(tabId) {
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  let stats = JSON.parse(localStorage.getItem('stats')) || { sonnets: 0, time: 0, visits: 1, favorite: '-', readSonnets: [] };
  
  const index = favorites.indexOf(tabId);
  
  if (index > -1) {
    favorites.splice(index, 1);
    if (stats.favorite === tabId) {
      stats.favorite = favorites.length > 0 ? favorites[0] : '-';
    }
  } else {
    favorites.push(tabId);
    stats.favorite = tabId;
  }
  
  localStorage.setItem('favorites', JSON.stringify(favorites));
  localStorage.setItem('stats', JSON.stringify(stats));
  updateFavoritesDisplay(favorites);
  updateFavoriteButtons();
  updateStatsDisplay(stats);
}

function updateFavoritesDisplay(favorites) {
  const section = document.getElementById('favoritesSection');
  const list = document.getElementById('favoritesList');
  
  if (favorites.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  list.innerHTML = '';
  
  const sonnetNames = { tab1: 'Sonnet 72', tab2: 'Sonnet 84', tab3: 'Sonnet 85' };
  
  favorites.forEach(tabId => {
    const item = document.createElement('div');
    item.className = 'favorite-item';
    item.innerHTML = `📌 ${sonnetNames[tabId]}`;
    item.onclick = () => {
      const btn = document.querySelector(`[data-tab="${tabId}"]`);
      if (btn) btn.click();
    };
    list.appendChild(item);
  });
}

function updateFavoriteButtons() {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  document.querySelectorAll('.favorite-btn').forEach((btn, index) => {
    const tabId = ['tab1', 'tab2', 'tab3'][index];
    if (favorites.includes(tabId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ===== STATS FEATURE =====
function loadStats() {
  const stats = JSON.parse(localStorage.getItem('stats')) || { sonnets: 0, time: 0, visits: 1, favorite: '-' };
  stats.visits = (stats.visits || 1) + 1;
  localStorage.setItem('stats', JSON.stringify(stats));
  updateStatsDisplay(stats);
}

function updateStatsDisplay(stats) {
  document.getElementById('statSonnets').textContent = stats.sonnets || 0;
  document.getElementById('statTime').textContent = Math.round((stats.time || 0) / 60) + ' min';
  document.getElementById('statVisits').textContent = stats.visits || 1;
  document.getElementById('statFavorite').textContent = stats.favorite === '-' ? '-' : (stats.favorite === 'tab1' ? 'Sonnet 72' : stats.favorite === 'tab2' ? 'Sonnet 84' : 'Sonnet 85');
}

function trackReadingTime(tabId) {
  let stats = JSON.parse(localStorage.getItem('stats')) || { sonnets: 0, time: 0, visits: 1, favorite: '-', readSonnets: [] };
  
  if (!stats.readSonnets) stats.readSonnets = [];
  if (!stats.readSonnets.includes(tabId)) {
    stats.readSonnets.push(tabId);
    stats.sonnets = stats.readSonnets.length;
  }
  
  window.readingStartTime = Date.now();
  window.currentReadingTabId = tabId;
  
  localStorage.setItem('stats', JSON.stringify(stats));
  updateStatsDisplay(stats);
}

function endReadingSession() {
  if (window.readingStartTime && window.currentReadingTabId) {
    let stats = JSON.parse(localStorage.getItem('stats'));
    const readingTime = Math.round((Date.now() - window.readingStartTime) / 1000);
    stats.time = (stats.time || 0) + readingTime;
    localStorage.setItem('stats', JSON.stringify(stats));
    updateStatsDisplay(stats);
    window.readingStartTime = null;
    window.currentReadingTabId = null;
  }
}

function resetStats() {
  localStorage.removeItem('stats');
  localStorage.removeItem('favorites');
  const stats = { sonnets: 0, time: 0, visits: 1, favorite: '-', readSonnets: [] };
  localStorage.setItem('stats', JSON.stringify(stats));
  updateStatsDisplay(stats);
  updateFavoritesDisplay([]);
  updateFavoriteButtons();
  alert('Stats have been reset!');
}

// Font customization
function updateFontSize(value) {
  document.getElementById('fontSizeValue').textContent = value + 'px';
  document.querySelectorAll('.tab-content').forEach(el => {
    el.style.fontSize = value + 'px';
  });
  document.querySelector('.font-preview').style.fontSize = value + 'px';
}

function updateFontFamily(value) {
  document.querySelectorAll('.tab-content').forEach(el => {
    el.style.fontFamily = value;
  });
  document.querySelector('.font-preview').style.fontFamily = value;
}

function updateLineHeight(value) {
  document.getElementById('lineHeightValue').textContent = value;
  document.querySelectorAll('.tab-content').forEach(el => {
    el.style.lineHeight = value;
  });
  document.querySelector('.font-preview').style.lineHeight = value;
}