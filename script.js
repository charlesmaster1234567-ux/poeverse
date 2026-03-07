/* ============================================
   POEVERSE - POETRY UNIVERSE
   Complete JavaScript Application
   Version: 2.0
   ============================================ */

(function() {
  'use strict';

  /* ============================================
     POEMS DATA
     ============================================ */
  
  const poemsData = {
    poem1: {
      id: 'poem1',
      number: '#72',
      title: 'My Beloved',
      category: 'sonnets',
      time: 1,
      preview: 'Go there in a dark room, Is a yellow bag and...',
      content: `Go there in a dark room,
Is a yellow bag and,
Holding me when I was once a broom,
I loved, believed, and scanned,
When days went ruin at the tomb,
In the dust-bin lives the fan,
Yes I shall see what was groomed,
They once called me handsome and a loving man.

But look at me, where am I?
Deep in thoughts, surrounded by cold voices,
Asking me why, telling me to fly,
But my soul is chained by choices,
For you, my love, I'd rather die,
Than live without your tender voices,
Under the same moon, same sky,
Forever bound by invisible forces.`
    },
    poem2: {
      id: 'poem2',
      number: '#84',
      title: 'Escaped',
      category: 'sonnets',
      time: 1,
      preview: 'In the darkness, when asleep, your image persuaded all nightmares...',
      content: `In the darkness, when asleep,
Your image persuaded all nightmares,
To flee and leave my dreams in peace so deep,
Your love, it heals, it repairs.

But when dawn breaks and light appears,
Reality crashes like a wave,
I wake to find you're not here,
Just memories I desperately save.

Escaped from nightmares, trapped in day,
Where shadows of your love remain,
I close my eyes and fade away,
To where we meet in dreams again.

For in that realm, you're still with me,
Escaped from pain, forever free.`
    },
    poem3: {
      id: 'poem3',
      number: '#85',
      title: 'Time Traveler',
      category: 'sonnets',
      time: 1,
      preview: 'I can, yes, I can, I can be a time-traveler...',
      content: `I can, yes, I can, I can be a time-traveler 
      I can deteriorate all memories, and skip to 
      Past days when we never met, to reckless life 
      When they said I was careless, women just flowers 
      I can live again, in future or old days and hours 
      And if you continue trying to talk with me, 
      With a time-traveler you will find your time going 
      While talking with flowers in your garden 
      Then stand before a mirror, talk to sad image 
      And come near me and look at my far away face 
      And widen your ears thinking I have called you 
      But I am not there, I am traveling in time, far away 
      Far from present I can go never seen again 
      And sorry for you are wasting your time weeping! `
    },
    poem4: {
      id: 'poem4',
      number: '#65',
      title: 'So Funny',
      category: 'sonnets',
      time: 1,
      preview: 'So funny so sweet so interesting that you have got...',
      content: `So funny, so sweet, so interesting,
That you have got the key to my heart,
Every moment with you is blessing,
A masterpiece, a work of art.

The way you laugh, the way you smile,
Makes every second worth the while,
You turn my tears to joy, meanwhile,
My love for you stretches mile by mile.

So funny how love can change a man,
From broken pieces to something whole,
You are the answer to my plan,
The missing part that makes me full.

In this funny game called love,
You're the angel from above.`
    },
    poem5: {
      id: 'poem5',
      number: '#66',
      title: 'Evaporated Love',
      category: 'sonnets',
      time: 1,
      preview: 'The love has evaporated, Sweets have gone leaving bitterness...',
      content: `The love has evaporated,
Sweets have gone, leaving bitterness,
What was once so celebrated,
Now drowns in this emptiness.

Like morning dew beneath the sun,
Our love has faded into air,
The race we thought we'd won,
Left nothing but despair.

Evaporated, gone like steam,
Rising up and disappearing,
What once was real, now just a dream,
Leaving my heart, broken and tearing.

Into the clouds, our love ascends,
Where evaporated love never ends.`
    },
    poem6: {
      id: 'poem6',
      number: '#69',
      title: 'Not Well?',
      category: 'sonnets',
      time: 1,
      preview: 'In this darkroom God, where are you? Here is the holly room...',
      content: `In this dark room, God, where are you?
Here is the hollow room of my soul,
I'm searching for something true,
Something to make me whole.

Not well, my heart is screaming,
Not well, my mind is lost,
I wake from restless dreaming,
Counting love's heavy cost.

Are you there in the silence?
In the corners of my pain?
I'm tired of this violence,
These tears that fall like rain.

Not well, but still I'm breathing,
Not well, but hope remains,
In this dark room, I'm believing,
That light will break these chains.`
    },
    poem7: {
      id: 'poem7',
      number: '#86',
      title: 'Something Wrong',
      category: 'sonnets',
      time: 1,
      preview: 'I wonder, something is wrong. It seems like blood in bones is freezing...',
      content: `I wonder, something is wrong,
It seems like blood in bones is freezing,
The days are short, the nights too long,
And every breath is seizing.

Something wrong within my chest,
A weight that won't be lifted,
I cannot find my peace or rest,
Since the day we drifted.

My hands are cold, my eyes are dim,
Something wrong, I know it's true,
Life without you is so grim,
Everything wrong since losing you.

Something wrong, the world can tell,
Without your love, I'm not well.`
    },
    poem8: {
      id: 'poem8',
      number: '✦',
      title: 'The Different World',
      category: 'heartbreak',
      time: 2,
      preview: '500 years ago, I went to see my husband, finding him with...',
      content: `500 years ago, I went to see my husband,
Finding him with another woman,
In a different world, I understand,
Pain was the same, broken and common.

500 years forward, I see the same,
Different faces, same old story,
Love turns to ash, hearts go in flame,
Endings stripped of glory.

In every world, in every time,
The heart knows how to break,
Love commits its perfect crime,
Leaving souls to ache.

Different world, same old pain,
Different tears, same old rain,
History repeating, again and again,
In the different world, love goes insane.`
    },
    poem9: {
      id: 'poem9',
      number: '✦',
      title: 'Helpless',
      category: 'heartbreak',
      time: 1,
      preview: 'How does a man feel, or act? When he sees a shining damsel...',
      content: `How does a man feel, or act?
When he sees a shining damsel,
Beautiful, divine, in fact,
Yet love remains a puzzle.

Helpless in the face of beauty,
Helpless when the heart decides,
Love becomes our only duty,
Though it tears us up inside.

I stand before you, helpless, weak,
A servant to this feeling,
The words I try so hard to speak,
Leave my heart reeling.

Helpless, I fall into your eyes,
Helpless, as my spirit flies,
Helpless, beneath these endless skies,
A prisoner of love's sweet lies.`
    },
    poem10: {
      id: 'poem10',
      number: '✦',
      title: "Again'nd 'gain Broken Heart",
      category: 'heartbreak',
      time: 1,
      preview: "Again'nd 'gain broken heart, though 'Ndagain dead...",
      content: `Again and again, broken heart,
Though again, dead inside,
Every ending, a new start,
On this painful ride.

Again, the tears come falling,
Again, the nights grow cold,
Again, I hear love calling,
A story too often told.

Broken heart, you know the way,
Through the thorns and pain,
Again and again, day by day,
You break and heal again.

'Gain and 'gain, I pick up pieces,
'Gain and 'gain, the hurting ceases,
Until the next love releases,
The cycle that never decreases.`
    },
    poem11: {
      id: 'poem11',
      number: '✦',
      title: 'The Interview',
      category: 'heartbreak',
      time: 2,
      preview: 'Hello, I think your name is Lone Philip, a journalist from Grief...',
      content: `"Hello, I think your name is Lone Philip,
A journalist from Grief Magazine?"

"Yes, that's me. May I have a seat?
I'm here to document the scene."

"Of what? My broken heart's defeat?
The way love turned so mean?"

"Tell me, when did love retreat?
When did the skies turn from serene?"

"It started slow, a subtle crack,
Then everything came tumbling down,
I gave my all, got nothing back,
In sorrow, I learned to drown."

"And now? What wisdom do you speak?"

"That broken hearts still learn to beat,
That even when the future's bleak,
The story's never quite complete."

Interview ends, the journalist leaves,
A broken heart still believes.`
    },
    poem12: {
      id: 'poem12',
      number: '✦',
      title: 'This Is My Soul',
      category: 'heartbreak',
      time: 2,
      preview: 'One thing, Ever my God put on my tongue when I sing...',
      content: `One thing, ever my God put on my tongue when I sing,
Is the melody of a broken heart,
Every verse, every string,
Tells the story from the start.

This is my soul, laid bare and bleeding,
Words flowing like a river wide,
This is my soul, constantly needing,
A place where love can reside.

My soul speaks in poetry and verse,
In metaphors of pain and light,
For better or for worse,
My soul writes into the night.

This is my soul, take it or leave,
This is my soul, it still believes,
This is my soul, it continues to weave,
The tapestry of love it grieves.`
    },
    poem13: {
      id: 'poem13',
      number: '✦',
      title: 'Bitter Days',
      category: 'heartbreak',
      time: 2,
      preview: "Don't you see? Can use goggles and look at me clearly...",
      content: `Don't you see? Can use goggles,
And look at me clearly,
These bitter days leave me in struggles,
Paying for love so dearly.

Bitter days turn to bitter nights,
The taste of loss upon my tongue,
Lost are the stars, gone are the lights,
These bitter songs that must be sung.

Can you see the pain I carry?
The weight upon my chest?
These bitter days make me weary,
Denying me any rest.

But even in this bitter time,
I search for something sweet,
A reason, a rhythm, a rhyme,
To lift me to my feet.

Bitter days will turn to better,
When I learn to let go of every letter.`
    },
    poem14: {
      id: 'poem14',
      number: '🇲🇼',
      title: 'Mapeto a zam\'tima',
      category: 'chichewa',
      time: 3,
      preview: 'Kumbuka, ukazipatula suli wekha, Koma ndi wako mbuye...',
      content: `
      Mapeto a zam’tima💔 
      “kumbuka, ukazipatula suli wekha 
      Koma ndi wako mbuye wangodekha 
      Pondikumbukiranso dziwa uli nane 
      Momwemonso ngati pa udzu mame” 
      Ankakhala mawu otsiriza amenewa. 
      Tsono moyo watha, khumbo ndi mwayi 
      Chiyembekezo n’dataya, khumbo iyayi 
      Zinalidi zochedwa, koma zonse n’mthayi 
      Kodi sindinapereke ochuluka mwayi? 
      Ankakhalanso mawu otsiriza amenewa. 
      Sev, Jim, Vit, Asa, Dis, amzako aja 
      Iwebe unali ngati wanga mtima, tsogoro lija 
      Posadziwa wamzako n’tsidya lina, hmm! 
      Pikitipikiti kumbaliko kundiswera mtim’ 
      Tsono tubwa poti mphaka wachoka. 
      Tidzaonananso ukazayamba kupenya 
      Ukazakhazika mtima wako m’thiti, mwina 
      Uzakumbuka mawu anga aja, “palibenso” 
      Koma monga ukondera, tseka nkutu usamvenso 
      Kulira kwa chiseko chosekedwa mtimamu. 
      Momwemonso ngati pa udzu mame 
      Paliwombo dzuwa liri n’saname 
      Ngati duwa malingaliro anga afota. 
      Zonse zatha, palibenso zolota 
      Tidzaonananso ukazayamba kupenya. 
      Lonjezo wa Yohane linadulitsa 
      Lomwelonso wathu ubale lathetsa 
      Poti sindizakukakamira ndinalonjeza 
      Indedi, pakadafunda galu padajiwiza 
      Tsono tubwa poti mphaka wachoka. 
      Ndinkaona zonse, mu ako oyera masowo 
      Ukamawamwemwetera, nkumanyada nawo 
      Ukaona ine ndeye ngati n’dwangan’dwadi 
      Koma pandekha misonzi ndimakhetsadi 
      Tsono tubwa poti mphaka wachoka. 
      Ukamandinyadira ntimasayato maso 
      Sumadziwa umawawa kachasokachaso 
      Dzulo lake utandinyoza, ine nditsiluke 
      Koma ikaopa imayenera mbalame iwuluke 
      Monga moyo, mthawinso ndi mpamba. 
      Tsono ano ndi mathero, mapeto ndithu 
      Sindikuganizanso zokagula mapoto athu 
      Izo nzakale; tsogoro la mdima bii 
      Ndeno usazandiyang’anenso, apobii 
      Monga ine nawenso udzalira, udzalira 
      Kulilira pa chitseko chotsekedwa mtimamu 
      Ngatinso mthawi, chiyembekezo wanditayitsa!   
      `
    },
    poem15: {
      id: 'poem15',
      number: '🇲🇼',
      title: 'Pemphero Losweka Mtima',
      category: 'chichewa',
      time: 2,
      preview: 'Ena ng\'oma sichiimba chakuza, Zimandipweteka mowawa...',
      content: `Pemphero losweka mtima 
      Ena ng’oma sichiimba chakuza 
      Zimandipweteka  mowawa mtima kwambiri 
      Ambuye simumandikaniza ine, chiyambire 
      Mbari  yanga mmakhala, mmandimva ine 
      Koma pano chifukwa chani, nkulira ine 
      Wanga mtima ngati mchere wasungunuka, ndingatani 
      Mwaloranji iye kuti atayisidwe mtima, walakwa chani 
      Bola ndikanakhala ine, ndikukupemphani 
      Sinthanitsani moyowu, wake wanga 
      Zolakwa zake mundilange nazo, Mulungu wanga 
      Zabwino zanga mmoyowu mpatseni, wanga wake 
      Ngakhaleso wangawu moyo muutenge 
      Bola Chimwemwe ndi mtendere mwake mtima zisale 
      Ngatidi zili izizi bola moyo wanga upakire 
      Kaya gahena kaya paradiso, ukhale uwu ulendo wakumalire 
      Zimandipweteka ndikamaona dzikoli 
      Dzulo ine, leronso mwalora chinkhanira chiyese iye ngati Yobu 
      Kupatula chikondi chisoni komabe zandiwawa 
      Ake maonekedwe ali ofooka, chilimbikitso sakulandira 
      Ngati paife pakati palibe mtendere, otembereredwa 
      Minyama masoka misonzi mavuto mapazi mpaka mmutu 
      Chimwemwe athu masaya safuna ngati, ikakuona litsiro 
      Ake ngati mphale oyera maso dziko silifuna kuaona? 
      Koma Ambuye mutenge wanga moyowu 
      Mugulire cha wokondedwa wanga chisangalaro! `
    }
  };

  /* ============================================
     CONFIGURATION
     ============================================ */

  const CONFIG = {
    STORAGE_KEYS: {
      THEME: 'poeverse_theme',
      THEME_COLOR: 'poeverse_theme_color',
      FAVORITES: 'poeverse_favorites',
      STATS: 'poeverse_stats',
      COOKIES_ACCEPTED: 'poeverse_cookies',
      READING_HISTORY: 'poeverse_history'
    },
    THEME_COLORS: ['default', 'ocean', 'forest', 'sunset', 'purple', 'gold', 'rose', 'teal', 'crimson', 'midnight'],
    TOAST_DURATION: 3000,
    LOADING_DURATION: 2000,
    DEBOUNCE_DELAY: 300,
    TESTIMONIAL_INTERVAL: 5000
  };

  /* ============================================
     STATE MANAGEMENT
     ============================================ */

  const state = {
    currentPoem: null,
    currentPoemIndex: 0,
    favorites: [],
    readingHistory: [],
    stats: {
      poemsRead: 0,
      readingTime: 0,
      visits: 1,
      favorites: 0
    },
    filters: {
      category: 'all',
      sort: 'default',
      search: ''
    },
    isPlaying: false,
    currentTrack: null,
    audioContext: null,
    speechSynthesis: null,
    isSpeaking: false,
    focusMode: {
      fontSize: 18,
      lineSpacing: 2,
      theme: 'dark'
    },
    testimonialIndex: 0,
    testimonialInterval: null
  };

  /* ============================================
     DOM ELEMENTS
     ============================================ */

  const elements = {};

  function cacheElements() {
    // Loader
    elements.loader = document.getElementById('loader');
    
    // Scroll Progress
    elements.scrollProgress = document.getElementById('scrollProgress');
    
    // Navigation
    elements.navbar = document.getElementById('navbar');
    elements.navLinks = document.getElementById('navLinks');
    elements.navHamburger = document.getElementById('navHamburger');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.searchToggle = document.getElementById('searchToggle');
    
    // Search
    elements.searchOverlay = document.getElementById('searchOverlay');
    elements.searchOverlayClose = document.getElementById('searchOverlayClose');
    elements.poemSearch = document.getElementById('poemSearch');
    elements.searchClear = document.getElementById('searchClear');
    elements.voiceSearch = document.getElementById('voiceSearch');
    elements.searchResults = document.getElementById('searchResults');
    elements.searchResultsList = document.getElementById('searchResultsList');
    elements.searchResultsCount = document.getElementById('searchResultsCount');
    
    // Hero
    elements.heroParticles = document.getElementById('heroParticles');
    
    // Poem of the Day
    elements.potdPoemTitle = document.getElementById('potdPoemTitle');
    elements.potdExcerpt = document.getElementById('potdExcerpt');
    elements.potdCategory = document.getElementById('potdCategory');
    elements.potdDate = document.getElementById('potdDate');
    elements.potdReadBtn = document.getElementById('potdReadBtn');
    
    // Poems Section
    elements.poemsGrid = document.getElementById('poemsGrid');
    elements.poemsCount = document.getElementById('poemsCount');
    elements.visibleCount = document.getElementById('visibleCount');
    elements.totalCount = document.getElementById('totalCount');
    elements.noResults = document.getElementById('noResults');
    elements.resetFilters = document.getElementById('resetFilters');
    elements.sortSelect = document.getElementById('sortSelect');
    
    // Stats
    elements.statPoems = document.getElementById('statPoems');
    elements.statTime = document.getElementById('statTime');
    elements.statVisits = document.getElementById('statVisits');
    elements.statFavorites = document.getElementById('statFavorites');
    elements.poemsProgressBar = document.getElementById('poemsProgressBar');
    elements.viewFavorites = document.getElementById('viewFavorites');
    elements.clearStats = document.getElementById('clearStats');
    
    // Testimonials
    elements.testimonialsSlider = document.getElementById('testimonialsSlider');
    elements.testimonialsDots = document.getElementById('testimonialsDots');
    elements.prevTestimonial = document.getElementById('prevTestimonial');
    elements.nextTestimonial = document.getElementById('nextTestimonial');
    
    // Forms
    elements.submitPoemForm = document.getElementById('submitPoemForm');
    elements.newsletterForm = document.getElementById('newsletterForm');
    elements.contactForm = document.getElementById('contactForm');
    elements.charCount = document.getElementById('charCount');
    
    // Poem Modal
    elements.poemModal = document.getElementById('poemModal');
    elements.modalOverlay = document.getElementById('modalOverlay');
    elements.modalClose = document.getElementById('modalClose');
    elements.modalTitle = document.getElementById('modalTitle');
    elements.modalCategory = document.getElementById('modalCategory');
    elements.modalNumber = document.getElementById('modalNumber');
    elements.modalTime = document.getElementById('modalTime');
    elements.modalBody = document.getElementById('modalBody');
    elements.breadcrumbTitle = document.getElementById('breadcrumbTitle');
    elements.favoriteBtn = document.getElementById('favoriteBtn');
    elements.speakerBtn = document.getElementById('speakerBtn');
    elements.focusBtn = document.getElementById('focusBtn');
    elements.shareBtn = document.getElementById('shareBtn');
    elements.pdfBtn = document.getElementById('pdfBtn');
    elements.shareMenu = document.getElementById('shareMenu');
    elements.prevPoem = document.getElementById('prevPoem');
    elements.nextPoem = document.getElementById('nextPoem');
    elements.poemCounter = document.getElementById('poemCounter');
    
    // Focus Mode
    elements.focusMode = document.getElementById('focusMode');
    elements.focusContent = document.getElementById('focusContent');
    elements.focusFontSize = document.getElementById('focusFontSize');
    elements.fontSizeDecrease = document.getElementById('fontSizeDecrease');
    elements.fontSizeIncrease = document.getElementById('fontSizeIncrease');
    elements.lineSpacingToggle = document.getElementById('lineSpacingToggle');
    elements.focusThemeToggle = document.getElementById('focusThemeToggle');
    elements.exitFocus = document.getElementById('exitFocus');
    
    // Favorites Modal
    elements.favoritesModal = document.getElementById('favoritesModal');
    elements.favoritesModalOverlay = document.getElementById('favoritesModalOverlay');
    elements.favoritesModalClose = document.getElementById('favoritesModalClose');
    elements.favoritesList = document.getElementById('favoritesList');
    elements.favoritesEmpty = document.getElementById('favoritesEmpty');
    
    // Music
    elements.musicWidget = document.getElementById('musicWidget');
    elements.musicToggle = document.getElementById('musicToggle');
    elements.musicPanel = document.getElementById('musicPanel');
    elements.musicClose = document.getElementById('musicClose');
    elements.musicPlayPause = document.getElementById('musicPlayPause');
    elements.musicStop = document.getElementById('musicStop');
    elements.musicVolume = document.getElementById('musicVolume');
    elements.volumeLabel = document.getElementById('volumeLabel');
    elements.nowPlaying = document.getElementById('nowPlaying');
    elements.nowPlayingText = document.getElementById('nowPlayingText');
    
    // Shortcuts
    elements.shortcutsModal = document.getElementById('shortcutsModal');
    elements.shortcutsOverlay = document.getElementById('shortcutsOverlay');
    elements.shortcutsClose = document.getElementById('shortcutsClose');
    elements.showShortcuts = document.getElementById('showShortcuts');
    
    // Back to Top
    elements.backToTop = document.getElementById('backToTop');
    
    // Toast Container
    elements.toastContainer = document.getElementById('toastContainer');
    
    // Cookie Banner
    elements.cookieBanner = document.getElementById('cookieBanner');
    elements.acceptCookies = document.getElementById('acceptCookies');
    elements.customizeCookies = document.getElementById('customizeCookies');
    elements.declineCookies = document.getElementById('declineCookies');
    
    // Footer
    elements.currentYear = document.getElementById('currentYear');
  }

  /* ============================================
     UTILITY FUNCTIONS
     ============================================ */

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Format time
  function formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  // Get today's date string
  function getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  // Get random item from array
  function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Capitalize first letter
  function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ============================================
     LOCAL STORAGE
     ============================================ */

  const storage = {
    get(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error('Error reading from localStorage:', e);
        return null;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Error writing to localStorage:', e);
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error('Error removing from localStorage:', e);
        return false;
      }
    }
  };

  /* ============================================
     TOAST NOTIFICATIONS
     ============================================ */

  function showToast(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close notification">✕</button>
    `;

    elements.toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Auto remove
    setTimeout(() => removeToast(toast), duration);

    return toast;
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /* ============================================
     LOADING SCREEN
     ============================================ */

  function initLoader() {
    setTimeout(() => {
      if (elements.loader) {
        elements.loader.classList.add('hidden');
        document.body.classList.remove('loading');
      }
    }, CONFIG.LOADING_DURATION);
  }

  /* ============================================
     SCROLL PROGRESS BAR
     ============================================ */

  function updateScrollProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    
    if (elements.scrollProgress) {
      elements.scrollProgress.style.width = `${progress}%`;
    }
  }

  /* ============================================
     NAVIGATION
     ============================================ */

  function initNavigation() {
    // Hamburger menu toggle
    if (elements.navHamburger) {
      elements.navHamburger.addEventListener('click', toggleMobileMenu);
    }

    // Close menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        if (elements.navLinks.classList.contains('active')) {
          closeMobileMenu();
        }
      });
    });

    // Dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.closest('.nav-dropdown');
        dropdown.classList.toggle('open');
      });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', throttle(() => {
      if (elements.navbar) {
        if (window.scrollY > 50) {
          elements.navbar.classList.add('scrolled');
        } else {
          elements.navbar.classList.remove('scrolled');
        }
      }
    }, 100));

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const navbarHeight = elements.navbar ? elements.navbar.offsetHeight : 0;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  function toggleMobileMenu() {
    const isOpen = elements.navLinks.classList.toggle('active');
    elements.navHamburger.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  }

  function closeMobileMenu() {
    elements.navLinks.classList.remove('active');
    elements.navHamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  /* ============================================
     THEME TOGGLE
     ============================================ */

  function initTheme() {
    // Load saved theme
    const savedTheme = storage.get(CONFIG.STORAGE_KEYS.THEME) || 'dark';
    const savedColor = storage.get(CONFIG.STORAGE_KEYS.THEME_COLOR) || 'default';
    
    applyTheme(savedTheme);
    applyThemeColor(savedColor);

    // Theme toggle button
    if (elements.themeToggle) {
      elements.themeToggle.addEventListener('click', toggleTheme);
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    storage.set(CONFIG.STORAGE_KEYS.THEME, newTheme);
    showToast(`${capitalize(newTheme)} mode activated`, 'success');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (elements.themeToggle) {
      elements.themeToggle.innerHTML = theme === 'dark' ? '🌙' : '☀️';
      elements.themeToggle.setAttribute('aria-pressed', theme === 'dark');
    }
  }

  function applyThemeColor(color) {
    document.documentElement.setAttribute('data-theme-color', color);
  }

  function setThemeColor(index) {
    const color = CONFIG.THEME_COLORS[index] || 'default';
    applyThemeColor(color);
    storage.set(CONFIG.STORAGE_KEYS.THEME_COLOR, color);
    showToast(`Theme: ${capitalize(color)}`, 'success');
  }

  /* ============================================
     SEARCH FUNCTIONALITY
     ============================================ */

  function initSearch() {
    // Open search
    if (elements.searchToggle) {
      elements.searchToggle.addEventListener('click', openSearch);
    }

    // Close search
    if (elements.searchOverlayClose) {
      elements.searchOverlayClose.addEventListener('click', closeSearch);
    }

    // Search input
    if (elements.poemSearch) {
      elements.poemSearch.addEventListener('input', debounce(handleSearch, CONFIG.DEBOUNCE_DELAY));
    }

    // Clear search
    if (elements.searchClear) {
      elements.searchClear.addEventListener('click', clearSearch);
    }

    // Voice search
    if (elements.voiceSearch) {
      elements.voiceSearch.addEventListener('click', startVoiceSearch);
    }

    // Search hints
    const searchHints = document.querySelectorAll('.search-hint-btn');
    searchHints.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.poemSearch.value = btn.dataset.search;
        handleSearch();
      });
    });

    // Close on overlay click
    if (elements.searchOverlay) {
      elements.searchOverlay.addEventListener('click', (e) => {
        if (e.target === elements.searchOverlay) {
          closeSearch();
        }
      });
    }
  }

  function openSearch() {
    if (elements.searchOverlay) {
      elements.searchOverlay.classList.add('active');
      document.body.classList.add('search-open');
      setTimeout(() => {
        elements.poemSearch.focus();
      }, 100);
    }
  }

  function closeSearch() {
    if (elements.searchOverlay) {
      elements.searchOverlay.classList.remove('active');
      document.body.classList.remove('search-open');
      clearSearch();
    }
  }

  function handleSearch() {
    const query = elements.poemSearch.value.toLowerCase().trim();
    state.filters.search = query;

    // Show/hide clear button
    if (elements.searchClear) {
      elements.searchClear.hidden = query.length === 0;
    }

    if (query.length === 0) {
      elements.searchResults.hidden = true;
      return;
    }

    // Search poems
    const results = Object.values(poemsData).filter(poem => {
      return (
        poem.title.toLowerCase().includes(query) ||
        poem.category.toLowerCase().includes(query) ||
        poem.content.toLowerCase().includes(query) ||
        poem.preview.toLowerCase().includes(query)
      );
    });

    displaySearchResults(results, query);
  }

  function displaySearchResults(results, query) {
    elements.searchResults.hidden = false;
    elements.searchResultsCount.textContent = `${results.length} poem${results.length !== 1 ? 's' : ''} found`;

    if (results.length === 0) {
      elements.searchResultsList.innerHTML = `
        <div class="no-search-results">
          <p>No poems found for "${escapeHtml(query)}"</p>
        </div>
      `;
      return;
    }

    elements.searchResultsList.innerHTML = results.map(poem => `
      <div class="search-result-item" data-poem-id="${poem.id}">
        <span class="search-result-icon">${poem.category === 'chichewa' ? '🇲🇼' : poem.category === 'heartbreak' ? '💔' : '📜'}</span>
        <div class="search-result-content">
          <div class="search-result-title">${escapeHtml(poem.title)}</div>
          <div class="search-result-category">${capitalize(poem.category)} • ${poem.time} min read</div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    const resultItems = elements.searchResultsList.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
      item.addEventListener('click', () => {
        const poemId = item.dataset.poemId;
        closeSearch();
        openPoemModal(poemId);
      });
    });
  }

  function clearSearch() {
    if (elements.poemSearch) {
      elements.poemSearch.value = '';
      state.filters.search = '';
      elements.searchResults.hidden = true;
      if (elements.searchClear) {
        elements.searchClear.hidden = true;
      }
    }
  }

  function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('Voice search is not supported in your browser', 'error');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    elements.voiceSearch.classList.add('listening');
    showToast('Listening...', 'info');

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      elements.poemSearch.value = transcript;
      handleSearch();
      elements.voiceSearch.classList.remove('listening');
    };

    recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      elements.voiceSearch.classList.remove('listening');
      showToast('Voice search failed. Please try again.', 'error');
    };

    recognition.onend = () => {
      elements.voiceSearch.classList.remove('listening');
    };
  }

  /* ============================================
     POEM OF THE DAY
     ============================================ */

  function initPoemOfTheDay() {
    const poemIds = Object.keys(poemsData);
    const today = getTodayString();
    
    // Use date to seed "random" selection (same poem all day)
    const dateNum = parseInt(today.replace(/-/g, ''), 10);
    const index = dateNum % poemIds.length;
    const poemId = poemIds[index];
    const poem = poemsData[poemId];

    if (poem && elements.potdPoemTitle) {
      elements.potdPoemTitle.textContent = poem.title;
      elements.potdExcerpt.textContent = poem.preview;
      elements.potdCategory.textContent = capitalize(poem.category);
      elements.potdDate.textContent = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      elements.potdReadBtn.addEventListener('click', () => {
        openPoemModal(poemId);
      });
    }
  }

  /* ============================================
     CATEGORY FILTERING & SORTING
     ============================================ */

  function initFilters() {
    // Category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active state
        categoryTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Filter poems
        state.filters.category = tab.dataset.category;
        filterAndDisplayPoems();
      });
    });

    // Sort select
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', () => {
        state.filters.sort = elements.sortSelect.value;
        filterAndDisplayPoems();
      });
    }

    // View toggle
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        
        const view = btn.dataset.view;
        elements.poemsGrid.classList.toggle('list-view', view === 'list');
      });
    });

    // Reset filters
    if (elements.resetFilters) {
      elements.resetFilters.addEventListener('click', resetFilters);
    }

    // Footer filter links
    const footerFilterLinks = document.querySelectorAll('[data-filter]');
    footerFilterLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = link.dataset.filter;
        
        // Update category tabs
        categoryTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
          if (t.dataset.category === category) {
            t.classList.add('active');
            t.setAttribute('aria-selected', 'true');
          }
        });

        state.filters.category = category;
        filterAndDisplayPoems();
        
        // Scroll to poems section
        document.getElementById('poems').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function filterAndDisplayPoems() {
    const poemCards = document.querySelectorAll('.poem-card');
    let visibleCount = 0;

    const poems = Object.values(poemsData);
    
    // Sort poems
    let sortedPoems = [...poems];
    switch (state.filters.sort) {
      case 'title-asc':
        sortedPoems.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sortedPoems.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'reading-time':
        sortedPoems.sort((a, b) => a.time - b.time);
        break;
      case 'newest':
        sortedPoems.reverse();
        break;
      case 'oldest':
        // Default order
        break;
      default:
        // Keep default order
        break;
    }

    // Create ordered list for sorting
    const order = sortedPoems.map(p => p.id);

    poemCards.forEach(card => {
      const category = card.dataset.category;
      const poemId = card.dataset.id;
      const title = card.dataset.title?.toLowerCase() || '';
      
      // Check filters
      const matchesCategory = state.filters.category === 'all' || category === state.filters.category;
      const matchesSearch = state.filters.search === '' || 
        title.includes(state.filters.search) ||
        category.includes(state.filters.search);

      if (matchesCategory && matchesSearch) {
        card.style.display = '';
        card.style.order = order.indexOf(poemId);
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update count
    if (elements.visibleCount) {
      elements.visibleCount.textContent = visibleCount;
    }
    if (elements.totalCount) {
      elements.totalCount.textContent = poems.length;
    }

    // Show/hide no results message
    if (elements.noResults) {
      elements.noResults.hidden = visibleCount > 0;
    }
  }

  function resetFilters() {
    state.filters = {
      category: 'all',
      sort: 'default',
      search: ''
    };

    // Reset UI
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
      tab.classList.remove('active');
      tab.setAttribute('aria-selected', 'false');
      if (tab.dataset.category === 'all') {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      }
    });

    if (elements.sortSelect) {
      elements.sortSelect.value = 'default';
    }

    filterAndDisplayPoems();
    showToast('Filters reset', 'info');
  }

  /* ============================================
     POEM CARDS
     ============================================ */

  function initPoemCards() {
    const poemCards = document.querySelectorAll('.poem-card');
    
    poemCards.forEach(card => {
      // Click to open modal
      card.addEventListener('click', (e) => {
        // Don't open if clicking favorite button
        if (e.target.closest('.card-action-btn')) return;
        
        const poemId = card.dataset.id;
        openPoemModal(poemId);
      });

      // Keyboard support
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const poemId = card.dataset.id;
          openPoemModal(poemId);
        }
      });

      // Favorite button on card
      const favoriteBtn = card.querySelector('.card-action-btn.favorite');
      if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const poemId = favoriteBtn.dataset.id;
          toggleFavorite(poemId);
        });
      }
    });

    // Update favorite states on cards
    updateCardFavorites();
  }

  function updateCardFavorites() {
    const favoriteButtons = document.querySelectorAll('.poem-card .card-action-btn.favorite');
    favoriteButtons.forEach(btn => {
      const poemId = btn.dataset.id;
      const isFavorite = state.favorites.includes(poemId);
      btn.setAttribute('aria-pressed', isFavorite);
    });
  }

  /* ============================================
     POEM MODAL
     ============================================ */

  function initPoemModal() {
    // Close modal
    if (elements.modalClose) {
      elements.modalClose.addEventListener('click', closePoemModal);
    }
    if (elements.modalOverlay) {
      elements.modalOverlay.addEventListener('click', closePoemModal);
    }

    // Navigation buttons
    if (elements.prevPoem) {
      elements.prevPoem.addEventListener('click', showPreviousPoem);
    }
    if (elements.nextPoem) {
      elements.nextPoem.addEventListener('click', showNextPoem);
    }

    // Action buttons
    if (elements.favoriteBtn) {
      elements.favoriteBtn.addEventListener('click', () => {
        if (state.currentPoem) {
          toggleFavorite(state.currentPoem.id);
        }
      });
    }

    if (elements.speakerBtn) {
      elements.speakerBtn.addEventListener('click', toggleSpeech);
    }

    if (elements.focusBtn) {
      elements.focusBtn.addEventListener('click', openFocusMode);
    }

    if (elements.shareBtn) {
      elements.shareBtn.addEventListener('click', toggleShareMenu);
    }

    if (elements.pdfBtn) {
      elements.pdfBtn.addEventListener('click', downloadPDF);
    }

    // Share options
    const shareOptions = document.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
      option.addEventListener('click', () => {
        const platform = option.dataset.platform;
        sharePoem(platform);
      });
    });
  }

  function openPoemModal(poemId) {
    const poem = poemsData[poemId];
    if (!poem) return;

    state.currentPoem = poem;
    
    // Find index in poems array
    const poemIds = Object.keys(poemsData);
    state.currentPoemIndex = poemIds.indexOf(poemId);

    // Update modal content
    elements.modalTitle.textContent = poem.title;
    elements.breadcrumbTitle.textContent = poem.title;
    elements.modalCategory.textContent = capitalize(poem.category);
    elements.modalNumber.textContent = poem.number;
    elements.modalTime.innerHTML = `<span aria-hidden="true">⏱</span> ${poem.time} min read`;

    // Format poem content
    const formattedContent = poem.content
      .split('\n\n')
      .map(stanza => `<div class="poem-stanza">${stanza.split('\n').map(line => `<div class="poem-line">${escapeHtml(line)}</div>`).join('')}</div>`)
      .join('');
    
    elements.modalBody.innerHTML = `<div class="poem-content">${formattedContent}</div>`;

    // Update favorite button state
    const isFavorite = state.favorites.includes(poemId);
    elements.favoriteBtn.setAttribute('aria-pressed', isFavorite);

    // Update navigation
    updatePoemNavigation();

    // Show modal
    elements.poemModal.hidden = false;
    document.body.classList.add('modal-open');

    // Track reading
    trackPoemRead(poemId);

    // Focus management
    elements.modalClose.focus();
  }

  function closePoemModal() {
    elements.poemModal.hidden = true;
    document.body.classList.remove('modal-open');
    
    // Stop speech if playing
    if (state.isSpeaking) {
      stopSpeech();
    }

    // Hide share menu
    elements.shareMenu.hidden = true;
    elements.shareBtn.setAttribute('aria-expanded', 'false');

    state.currentPoem = null;
  }

  function updatePoemNavigation() {
    const poemIds = Object.keys(poemsData);
    const totalPoems = poemIds.length;

    elements.poemCounter.textContent = `${state.currentPoemIndex + 1} of ${totalPoems}`;
    
    elements.prevPoem.disabled = state.currentPoemIndex === 0;
    elements.nextPoem.disabled = state.currentPoemIndex === totalPoems - 1;
  }

  function showPreviousPoem() {
    if (state.currentPoemIndex > 0) {
      const poemIds = Object.keys(poemsData);
      state.currentPoemIndex--;
      openPoemModal(poemIds[state.currentPoemIndex]);
    }
  }

  function showNextPoem() {
    const poemIds = Object.keys(poemsData);
    if (state.currentPoemIndex < poemIds.length - 1) {
      state.currentPoemIndex++;
      openPoemModal(poemIds[state.currentPoemIndex]);
    }
  }

  /* ============================================
     FAVORITES
     ============================================ */

  function initFavorites() {
    // Load favorites from storage
    state.favorites = storage.get(CONFIG.STORAGE_KEYS.FAVORITES) || [];

    // View favorites button
    if (elements.viewFavorites) {
      elements.viewFavorites.addEventListener('click', openFavoritesModal);
    }

    // Favorites modal
    if (elements.favoritesModalClose) {
      elements.favoritesModalClose.addEventListener('click', closeFavoritesModal);
    }
    if (elements.favoritesModalOverlay) {
      elements.favoritesModalOverlay.addEventListener('click', closeFavoritesModal);
    }
  }

  function toggleFavorite(poemId) {
    const index = state.favorites.indexOf(poemId);
    
    if (index === -1) {
      state.favorites.push(poemId);
      showToast('Added to favorites ❤️', 'success');
    } else {
      state.favorites.splice(index, 1);
      showToast('Removed from favorites', 'info');
    }

    // Save to storage
    storage.set(CONFIG.STORAGE_KEYS.FAVORITES, state.favorites);

    // Update stats
    state.stats.favorites = state.favorites.length;
    saveStats();
    updateStatsDisplay();

    // Update UI
    updateCardFavorites();
    
    // Update modal button if open
    if (state.currentPoem && state.currentPoem.id === poemId) {
      elements.favoriteBtn.setAttribute('aria-pressed', state.favorites.includes(poemId));
    }
  }

  function openFavoritesModal() {
    if (state.favorites.length === 0) {
      elements.favoritesEmpty.hidden = false;
      elements.favoritesList.innerHTML = '';
    } else {
      elements.favoritesEmpty.hidden = true;
      elements.favoritesList.innerHTML = state.favorites.map(poemId => {
        const poem = poemsData[poemId];
        if (!poem) return '';
        return `
          <div class="favorite-item" data-poem-id="${poemId}">
            <div class="favorite-item-content">
              <div class="favorite-item-title">${escapeHtml(poem.title)}</div>
              <div class="favorite-item-category">${capitalize(poem.category)}</div>
            </div>
            <button class="favorite-item-remove" data-poem-id="${poemId}" aria-label="Remove from favorites">
              ✕
            </button>
          </div>
        `;
      }).join('');

      // Add click handlers
      const favoriteItems = elements.favoritesList.querySelectorAll('.favorite-item');
      favoriteItems.forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.favorite-item-remove')) return;
          const poemId = item.dataset.poemId;
          closeFavoritesModal();
          openPoemModal(poemId);
        });
      });

      // Remove buttons
      const removeButtons = elements.favoritesList.querySelectorAll('.favorite-item-remove');
      removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const poemId = btn.dataset.poemId;
          toggleFavorite(poemId);
          openFavoritesModal(); // Refresh list
        });
      });
    }

    elements.favoritesModal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeFavoritesModal() {
    elements.favoritesModal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  /* ============================================
     TEXT-TO-SPEECH
     ============================================ */

  function initSpeech() {
    state.speechSynthesis = window.speechSynthesis;
  }

  function toggleSpeech() {
    if (state.isSpeaking) {
      stopSpeech();
    } else {
      startSpeech();
    }
  }

  function startSpeech() {
    if (!state.speechSynthesis || !state.currentPoem) return;

    // Stop any current speech
    state.speechSynthesis.cancel();

    const text = `${state.currentPoem.title}. ${state.currentPoem.content}`;
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      state.isSpeaking = true;
      elements.speakerBtn.setAttribute('aria-pressed', 'true');
      showToast('Reading aloud...', 'info');
    };

    utterance.onend = () => {
      state.isSpeaking = false;
      elements.speakerBtn.setAttribute('aria-pressed', 'false');
    };

    utterance.onerror = () => {
      state.isSpeaking = false;
      elements.speakerBtn.setAttribute('aria-pressed', 'false');
      showToast('Speech synthesis error', 'error');
    };

    state.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    if (state.speechSynthesis) {
      state.speechSynthesis.cancel();
      state.isSpeaking = false;
      elements.speakerBtn.setAttribute('aria-pressed', 'false');
      showToast('Stopped reading', 'info');
    }
  }

  /* ============================================
     FOCUS MODE
     ============================================ */

  function initFocusMode() {
    if (elements.fontSizeDecrease) {
      elements.fontSizeDecrease.addEventListener('click', () => {
        if (state.focusMode.fontSize > 12) {
          state.focusMode.fontSize -= 2;
          updateFocusMode();
        }
      });
    }

    if (elements.fontSizeIncrease) {
      elements.fontSizeIncrease.addEventListener('click', () => {
        if (state.focusMode.fontSize < 32) {
          state.focusMode.fontSize += 2;
          updateFocusMode();
        }
      });
    }

    if (elements.lineSpacingToggle) {
      elements.lineSpacingToggle.addEventListener('click', () => {
        state.focusMode.lineSpacing = state.focusMode.lineSpacing === 2 ? 2.5 : 2;
        updateFocusMode();
      });
    }

    if (elements.focusThemeToggle) {
      elements.focusThemeToggle.addEventListener('click', () => {
        state.focusMode.theme = state.focusMode.theme === 'dark' ? 'light' : 'dark';
        updateFocusMode();
      });
    }

    if (elements.exitFocus) {
      elements.exitFocus.addEventListener('click', closeFocusMode);
    }
  }

  function openFocusMode() {
    if (!state.currentPoem) return;

    const poem = state.currentPoem;
    
    elements.focusContent.innerHTML = `
      <div class="focus-poem">
        <h2 class="focus-poem-title">${escapeHtml(poem.title)}</h2>
        <div class="focus-poem-body">${escapeHtml(poem.content)}</div>
      </div>
    `;

    updateFocusMode();
    elements.focusMode.hidden = false;
    document.body.classList.add('modal-open');
    
    closePoemModal();
  }

  function updateFocusMode() {
    const content = elements.focusContent.querySelector('.focus-poem-body');
    if (content) {
      content.style.fontSize = `${state.focusMode.fontSize}px`;
      content.style.lineHeight = state.focusMode.lineSpacing;
    }

    elements.focusFontSize.textContent = `${state.focusMode.fontSize}px`;
    elements.focusMode.setAttribute('data-theme', state.focusMode.theme);
  }

  function closeFocusMode() {
    elements.focusMode.hidden = true;
    document.body.classList.remove('modal-open');
  }

  /* ============================================
     SHARE FUNCTIONALITY
     ============================================ */

  function toggleShareMenu() {
    const isHidden = elements.shareMenu.hidden;
    elements.shareMenu.hidden = !isHidden;
    elements.shareBtn.setAttribute('aria-expanded', !isHidden);
  }

  function sharePoem(platform) {
    if (!state.currentPoem) return;

    const poem = state.currentPoem;
    const url = `${window.location.origin}${window.location.pathname}#poem-${poem.id}`;
    const text = `"${poem.title}" - A beautiful poem from Poetry Universe\n\n${poem.preview}`;
    const title = `${poem.title} - Poetry Universe`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
          showToast('Failed to copy link', 'error');
        });
        break;
    }

    // Hide share menu
    elements.shareMenu.hidden = true;
    elements.shareBtn.setAttribute('aria-expanded', 'false');
  }

  /* ============================================
     PDF DOWNLOAD
     ============================================ */

  function downloadPDF() {
    if (!state.currentPoem) return;

    const poem = state.currentPoem;
    
    // Create PDF content
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Georgia, serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 28px; margin-bottom: 10px;">${escapeHtml(poem.title)}</h1>
          <p style="color: #666; font-size: 14px;">${capitalize(poem.category)} • ${poem.number}</p>
        </div>
        <div style="white-space: pre-wrap; line-height: 1.8; font-size: 16px;">
${escapeHtml(poem.content)}
        </div>
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #888; font-size: 12px;">Poetry Universe - Black Broken Heart</p>
          <p style="color: #888; font-size: 12px;">https://poeverse.netlify.app</p>
        </div>
      </div>
    `;

    const options = {
      margin: 10,
      filename: `${poem.title.replace(/[^a-z0-9]/gi, '_')}_PoeVerse.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(options).from(element).save();
      showToast('Downloading PDF...', 'success');
    } else {
      showToast('PDF generation not available', 'error');
    }
  }

  /* ============================================
     STATISTICS
     ============================================ */

  function initStats() {
    // Load stats from storage
    const savedStats = storage.get(CONFIG.STORAGE_KEYS.STATS);
    if (savedStats) {
      state.stats = { ...state.stats, ...savedStats };
      state.stats.visits++;
    }

    // Load reading history
    state.readingHistory = storage.get(CONFIG.STORAGE_KEYS.READING_HISTORY) || [];

    // Save updated visit count
    saveStats();
    updateStatsDisplay();

    // Clear stats button
    if (elements.clearStats) {
      elements.clearStats.addEventListener('click', clearStats);
    }
  }

  function trackPoemRead(poemId) {
    // Check if already read today
    const today = getTodayString();
    const readKey = `${poemId}_${today}`;
    
    if (!state.readingHistory.includes(readKey)) {
      state.readingHistory.push(readKey);
      state.stats.poemsRead++;
      
      const poem = poemsData[poemId];
      if (poem) {
        state.stats.readingTime += poem.time;
      }

      // Save
      storage.set(CONFIG.STORAGE_KEYS.READING_HISTORY, state.readingHistory);
      saveStats();
      updateStatsDisplay();
    }
  }

  function saveStats() {
    storage.set(CONFIG.STORAGE_KEYS.STATS, state.stats);
  }

  function updateStatsDisplay() {
    if (elements.statPoems) {
      elements.statPoems.textContent = state.stats.poemsRead;
    }
    if (elements.statTime) {
      elements.statTime.textContent = formatTime(state.stats.readingTime);
    }
    if (elements.statVisits) {
      elements.statVisits.textContent = state.stats.visits;
    }
    if (elements.statFavorites) {
      elements.statFavorites.textContent = state.favorites.length;
    }

    // Update progress bar
    if (elements.poemsProgressBar) {
      const totalPoems = Object.keys(poemsData).length;
      const progress = (state.stats.poemsRead / totalPoems) * 100;
      elements.poemsProgressBar.style.width = `${Math.min(progress, 100)}%`;
    }
  }

  function clearStats() {
    if (confirm('Are you sure you want to clear all your reading stats?')) {
      state.stats = {
        poemsRead: 0,
        readingTime: 0,
        visits: 1,
        favorites: state.favorites.length
      };
      state.readingHistory = [];
      
      storage.remove(CONFIG.STORAGE_KEYS.STATS);
      storage.remove(CONFIG.STORAGE_KEYS.READING_HISTORY);
      
      updateStatsDisplay();
      showToast('Stats cleared', 'success');
    }
  }

  /* ============================================
     TESTIMONIALS SLIDER
     ============================================ */

  function initTestimonials() {
    const testimonialCards = elements.testimonialsSlider?.querySelectorAll('.testimonial-card');
    if (!testimonialCards || testimonialCards.length === 0) return;

    // Create dots
    if (elements.testimonialsDots) {
      testimonialCards.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = `testimonial-dot ${index === 0 ? 'active' : ''}`;
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Testimonial ${index + 1}`);
        dot.addEventListener('click', () => goToTestimonial(index));
        elements.testimonialsDots.appendChild(dot);
      });
    }

    // Show first testimonial
    testimonialCards[0].classList.add('active');

    // Navigation buttons
    if (elements.prevTestimonial) {
      elements.prevTestimonial.addEventListener('click', () => {
        goToTestimonial(state.testimonialIndex - 1);
      });
    }

    if (elements.nextTestimonial) {
      elements.nextTestimonial.addEventListener('click', () => {
        goToTestimonial(state.testimonialIndex + 1);
      });
    }

    // Auto-play
    startTestimonialAutoPlay();
  }

  function goToTestimonial(index) {
    const testimonialCards = elements.testimonialsSlider?.querySelectorAll('.testimonial-card');
    const dots = elements.testimonialsDots?.querySelectorAll('.testimonial-dot');
    
    if (!testimonialCards || testimonialCards.length === 0) return;

    // Wrap around
    if (index < 0) index = testimonialCards.length - 1;
    if (index >= testimonialCards.length) index = 0;

    state.testimonialIndex = index;

    // Update cards
    testimonialCards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update dots
    dots?.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    // Reset auto-play timer
    startTestimonialAutoPlay();
  }

  function startTestimonialAutoPlay() {
    if (state.testimonialInterval) {
      clearInterval(state.testimonialInterval);
    }
    
    state.testimonialInterval = setInterval(() => {
      goToTestimonial(state.testimonialIndex + 1);
    }, CONFIG.TESTIMONIAL_INTERVAL);
  }

  /* ============================================
     FORMS
     ============================================ */

  function initForms() {
    // Submit poem form
    if (elements.submitPoemForm) {
      elements.submitPoemForm.addEventListener('submit', handlePoemSubmit);
      
      // Character count
      const poemContent = document.getElementById('poemContent');
      if (poemContent && elements.charCount) {
        poemContent.addEventListener('input', () => {
          const count = poemContent.value.length;
          elements.charCount.textContent = `${count} / 5000 characters`;
          elements.charCount.style.color = count > 4500 ? 'var(--color-warning)' : '';
        });
      }
    }

    // Newsletter form
    if (elements.newsletterForm) {
      elements.newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }

    // Contact form
    if (elements.contactForm) {
      elements.contactForm.addEventListener('submit', handleContactSubmit);
    }
  }

  function handlePoemSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Validate
    let isValid = true;
    const errors = {};

    if (!data.poetName?.trim()) {
      errors.poetName = 'Name is required';
      isValid = false;
    }

    if (!data.poetEmail?.trim() || !isValidEmail(data.poetEmail)) {
      errors.poetEmail = 'Valid email is required';
      isValid = false;
    }

    if (!data.poemTitle?.trim()) {
      errors.poemTitle = 'Poem title is required';
      isValid = false;
    }

    if (!data.poemCategory) {
      errors.poemCategory = 'Please select a category';
      isValid = false;
    }

    if (!data.poemContent?.trim()) {
      errors.poemContent = 'Poem content is required';
      isValid = false;
    }

    if (!data.agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms';
      isValid = false;
    }

    // Display errors
    Object.keys(errors).forEach(field => {
      const errorEl = document.getElementById(`${field}Error`);
      if (errorEl) {
        errorEl.textContent = errors[field];
      }
    });

    if (!isValid) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    // Clear errors
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    // Simulate submission
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-spinner')?.removeAttribute('hidden');

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-spinner')?.setAttribute('hidden', '');
      e.target.reset();
      elements.charCount.textContent = '0 / 5000 characters';
      showToast('Thank you! Your poem has been submitted for review.', 'success');
    }, 1500);
  }

  function handleNewsletterSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('newsletterEmail')?.value;
    
    if (!email || !isValidEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    const submitBtn = e.target.querySelector('.newsletter-btn');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-spinner')?.removeAttribute('hidden');

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-spinner')?.setAttribute('hidden', '');
      e.target.reset();
      showToast('Welcome to our poetry circle! 📬', 'success');
    }, 1000);
  }

  function handleContactSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!isValidEmail(data.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.disabled = false;
      e.target.reset();
      showToast('Message sent! We\'ll get back to you soon.', 'success');
    }, 1000);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ============================================
     MUSIC PLAYER
     ============================================ */

  function initMusicPlayer() {
    // Toggle music panel
    if (elements.musicToggle) {
      elements.musicToggle.addEventListener('click', toggleMusicPanel);
    }

    if (elements.musicClose) {
      elements.musicClose.addEventListener('click', closeMusicPanel);
    }

    // Track selection
    const musicTracks = document.querySelectorAll('.music-track');
    musicTracks.forEach(track => {
      track.addEventListener('click', () => {
        const trackName = track.dataset.track;
        selectTrack(trackName, track);
      });
    });

    // Controls
    if (elements.musicPlayPause) {
      elements.musicPlayPause.addEventListener('click', toggleMusicPlayback);
    }

    if (elements.musicStop) {
      elements.musicStop.addEventListener('click', stopMusic);
    }

    if (elements.musicVolume) {
      elements.musicVolume.addEventListener('input', (e) => {
        const volume = e.target.value;
        elements.volumeLabel.textContent = `${volume}%`;
        if (state.audioContext && state.gainNode) {
          state.gainNode.gain.value = volume / 100;
        }
      });
    }
  }

  function toggleMusicPanel() {
    const isHidden = elements.musicPanel.hidden;
    elements.musicPanel.hidden = !isHidden;
    elements.musicToggle.setAttribute('aria-expanded', !isHidden);
  }

  function closeMusicPanel() {
    elements.musicPanel.hidden = true;
    elements.musicToggle.setAttribute('aria-expanded', 'false');
  }

  function selectTrack(trackName, trackElement) {
    // Update UI
    document.querySelectorAll('.music-track').forEach(t => {
      t.setAttribute('aria-checked', 'false');
    });
    trackElement.setAttribute('aria-checked', 'true');

    state.currentTrack = trackName;
    
    // Update now playing
    const trackNameDisplay = trackElement.querySelector('.track-name')?.textContent || trackName;
    elements.nowPlayingText.textContent = trackNameDisplay;
    
    // Start playback
    startAmbientSound(trackName);
  }

  function startAmbientSound(trackName) {
    // Stop current audio if playing
    stopMusic();

    // Create audio context if not exists
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create oscillator for ambient sound (simplified)
    // In production, you would load actual audio files
    const oscillator = state.audioContext.createOscillator();
    const gainNode = state.audioContext.createGain();
    
    // Different frequencies for different "tracks"
    const frequencies = {
      ocean: 100,
      rain: 200,
      forest: 150,
      bells: 400,
      flute: 350,
      choir: 250
    };

    oscillator.frequency.value = frequencies[trackName] || 150;
    oscillator.type = 'sine';
    
    const volume = elements.musicVolume.value / 100;
    gainNode.gain.value = volume * 0.1; // Keep it quiet
    
    oscillator.connect(gainNode);
    gainNode.connect(state.audioContext.destination);
    
    oscillator.start();
    
    state.oscillator = oscillator;
    state.gainNode = gainNode;
    state.isPlaying = true;

    // Update UI
    elements.nowPlaying.hidden = false;
    elements.musicPlayPause.querySelector('.play-icon').hidden = true;
    elements.musicPlayPause.querySelector('.pause-icon').hidden = false;
  }

  function toggleMusicPlayback() {
    if (state.isPlaying) {
      pauseMusic();
    } else if (state.currentTrack) {
      resumeMusic();
    }
  }

  function pauseMusic() {
    if (state.audioContext) {
      state.audioContext.suspend();
    }
    state.isPlaying = false;
    elements.musicPlayPause.querySelector('.play-icon').hidden = false;
    elements.musicPlayPause.querySelector('.pause-icon').hidden = true;
  }

  function resumeMusic() {
    if (state.audioContext) {
      state.audioContext.resume();
    }
    state.isPlaying = true;
    elements.musicPlayPause.querySelector('.play-icon').hidden = true;
    elements.musicPlayPause.querySelector('.pause-icon').hidden = false;
  }

  function stopMusic() {
    if (state.oscillator) {
      state.oscillator.stop();
      state.oscillator.disconnect();
      state.oscillator = null;
    }
    if (state.gainNode) {
      state.gainNode.disconnect();
      state.gainNode = null;
    }
    state.isPlaying = false;
    elements.nowPlaying.hidden = true;
    elements.musicPlayPause.querySelector('.play-icon').hidden = false;
    elements.musicPlayPause.querySelector('.pause-icon').hidden = true;
    
    // Reset track selection
    document.querySelectorAll('.music-track').forEach(t => {
      t.setAttribute('aria-checked', 'false');
    });
  }

  /* ============================================
     BACK TO TOP
     ============================================ */

  function initBackToTop() {
    if (!elements.backToTop) return;

    elements.backToTop.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    // Show/hide based on scroll position
    window.addEventListener('scroll', throttle(() => {
      if (window.scrollY > 500) {
        elements.backToTop.hidden = false;
      } else {
        elements.backToTop.hidden = true;
      }
    }, 100));
  }

  /* ============================================
     COOKIE CONSENT
     ============================================ */

  function initCookieConsent() {
    const cookiesAccepted = storage.get(CONFIG.STORAGE_KEYS.COOKIES_ACCEPTED);
    
    if (cookiesAccepted === null) {
      // Show cookie banner after a short delay
      setTimeout(() => {
        if (elements.cookieBanner) {
          elements.cookieBanner.hidden = false;
        }
      }, 2000);
    }

    if (elements.acceptCookies) {
      elements.acceptCookies.addEventListener('click', () => {
        storage.set(CONFIG.STORAGE_KEYS.COOKIES_ACCEPTED, true);
        elements.cookieBanner.hidden = true;
        showToast('Preferences saved', 'success');
      });
    }

    if (elements.declineCookies) {
      elements.declineCookies.addEventListener('click', () => {
        storage.set(CONFIG.STORAGE_KEYS.COOKIES_ACCEPTED, false);
        elements.cookieBanner.hidden = true;
        showToast('Preferences saved', 'info');
      });
    }

    if (elements.customizeCookies) {
      elements.customizeCookies.addEventListener('click', () => {
        // In a real app, this would open a cookie preferences modal
        showToast('Cookie customization coming soon', 'info');
      });
    }
  }

  /* ============================================
     KEYBOARD SHORTCUTS
     ============================================ */

  function initKeyboardShortcuts() {
    // Show shortcuts button
    if (elements.showShortcuts) {
      elements.showShortcuts.addEventListener('click', openShortcutsModal);
    }

    // Close shortcuts modal
    if (elements.shortcutsClose) {
      elements.shortcutsClose.addEventListener('click', closeShortcutsModal);
    }
    if (elements.shortcutsOverlay) {
      elements.shortcutsOverlay.addEventListener('click', closeShortcutsModal);
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcut);
  }

  function handleKeyboardShortcut(e) {
    // Don't trigger if typing in an input
    if (e.target.matches('input, textarea, select')) return;

    const key = e.key.toLowerCase();

    switch (key) {
      case 'escape':
        closeAllModals();
        break;
      case '/':
        e.preventDefault();
        openSearch();
        break;
      case '?':
        if (e.shiftKey) {
          e.preventDefault();
          openShortcutsModal();
        }
        break;
      case 't':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleTheme();
        }
        break;
      case 'm':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleMusicPanel();
        }
        break;
      case 'f':
        if (!e.ctrlKey && !e.metaKey && state.currentPoem) {
          e.preventDefault();
          toggleFavorite(state.currentPoem.id);
        }
        break;
      case 'r':
        if (!e.ctrlKey && !e.metaKey && state.currentPoem) {
          e.preventDefault();
          toggleSpeech();
        }
        break;
      case 's':
        if (!e.ctrlKey && !e.metaKey && state.currentPoem) {
          e.preventDefault();
          toggleShareMenu();
        }
        break;
      case 'p':
        if (!e.ctrlKey && !e.metaKey && state.currentPoem) {
          e.preventDefault();
          downloadPDF();
        }
        break;
      case 'arrowleft':
        if (state.currentPoem && !elements.poemModal.hidden) {
          e.preventDefault();
          showPreviousPoem();
        }
        break;
      case 'arrowright':
        if (state.currentPoem && !elements.poemModal.hidden) {
          e.preventDefault();
          showNextPoem();
        }
        break;
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setThemeColor(parseInt(key));
        }
        break;
    }
  }

  function openShortcutsModal() {
    if (elements.shortcutsModal) {
      elements.shortcutsModal.hidden = false;
      document.body.classList.add('modal-open');
    }
  }

  function closeShortcutsModal() {
    if (elements.shortcutsModal) {
      elements.shortcutsModal.hidden = true;
      document.body.classList.remove('modal-open');
    }
  }

  function closeAllModals() {
    closePoemModal();
    closeFavoritesModal();
    closeShortcutsModal();
    closeFocusMode();
    closeSearch();
    closeMobileMenu();
    closeMusicPanel();
    
    // Hide share menu
    if (elements.shareMenu) {
      elements.shareMenu.hidden = true;
    }
  }

  /* ============================================
     HERO PARTICLES
     ============================================ */

  function initHeroParticles() {
    if (!elements.heroParticles) return;

    // Create floating particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background: var(--color-accent-primary);
        border-radius: 50%;
        opacity: ${Math.random() * 0.3 + 0.1};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float ${Math.random() * 10 + 10}s ease-in-out infinite;
        animation-delay: ${Math.random() * 5}s;
        pointer-events: none;
      `;
      elements.heroParticles.appendChild(particle);
    }
  }

  /* ============================================
     FOOTER
     ============================================ */

  function initFooter() {
    // Set current year
    if (elements.currentYear) {
      elements.currentYear.textContent = new Date().getFullYear();
    }
  }

  /* ============================================
     INTERSECTION OBSERVER (ANIMATIONS)
     ============================================ */

  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements
    const animateElements = document.querySelectorAll('.poem-card, .stat-card, .testimonial-card');
    animateElements.forEach(el => observer.observe(el));
  }

  /* ============================================
     INITIALIZATION
     ============================================ */

  function init() {
    // Cache DOM elements
    cacheElements();

    // Initialize all modules
    initLoader();
    initNavigation();
    initTheme();
    initSearch();
    initPoemOfTheDay();
    initFilters();
    initPoemCards();
    initPoemModal();
    initFavorites();
    initSpeech();
    initFocusMode();
    initStats();
    initTestimonials();
    initForms();
    initMusicPlayer();
    initBackToTop();
    initCookieConsent();
    initKeyboardShortcuts();
    initHeroParticles();
    initFooter();
    initScrollAnimations();

    // Scroll event for progress bar
    window.addEventListener('scroll', throttle(updateScrollProgress, 50));

    // Initial filter
    filterAndDisplayPoems();

    console.log('🎭 PoeVerse initialized successfully!');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ============================================
   WIDGET DATA GENERATION
   ============================================ */

function generateWidgetData() {
  const poemIds = Object.keys(poemsData);
  const today = getTodayString();
  
  // Use date to seed "random" selection (same poem all day)
  const dateNum = parseInt(today.replace(/-/g, ''), 10);
  const index = dateNum % poemIds.length;
  const poemId = poemIds[index];
  const poem = poemsData[poemId];

  const widgetData = {
    title: poem.title,
    category: `${capitalize(poem.category)} ${poem.number}`,
    excerpt: poem.preview,
    backgroundUrl: `${window.location.origin}/widgets/widget-bg.png`,
    readUrl: `${window.location.origin}/#poem-${poemId}`,
    date: new Date().toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }),
    timestamp: new Date().toISOString()
  };

  return widgetData;
}

// Expose widget data endpoint (if needed)
function exposeWidgetAPI() {
  // Check if running in service worker context
  if (typeof window !== 'undefined') {
    window.getWidgetData = generateWidgetData;
  }
}

// Initialize widget API
exposeWidgetAPI();

/* ============================================
   WIDGET REGISTRATION
   ============================================ */

async function registerWidgets() {
  if (!('getInstalledRelatedApps' in navigator)) {
    console.log('Widgets not supported');
    return;
  }

  try {
    // Check if app is installed
    const relatedApps = await navigator.getInstalledRelatedApps();
    const isInstalled = relatedApps.length > 0;

    if (isInstalled) {
      console.log('App is installed, widgets available');
      
      // Register periodic sync for widget updates
      if ('periodicSync' in registration) {
        await registration.periodicSync.register('update-widgets', {
          minInterval: 60 * 60 * 1000 // Update every hour
        });
        console.log('Widget periodic sync registered');
      }
    }
  } catch (error) {
    console.error('Widget registration failed:', error);
  }
}

// Call during initialization
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registerWidgets();
  });
}