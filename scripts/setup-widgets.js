const sharp = require('sharp');
const fs = require('fs').promises;

async function setupWidgets() {
  console.log('🎨 Setting up PoeVerse widgets...\n');

  // Create directories
  await fs.mkdir('widgets', { recursive: true });
  await fs.mkdir('api', { recursive: true });
  await fs.mkdir('icons', { recursive: true });

  // Generate widget backgrounds
  console.log('📐 Generating widget backgrounds...');
  await generateWidgetBackground();
  await generateWidgetPreview();

  // Generate icons
  console.log('🎯 Generating widget icons...');
  await generateWidgetIcon();
  
  console.log('🔗 Generating shortcut icons...');
  await generateShortcutIcons();

  console.log('📝 Creating data files...');
  await createDataFiles();

  console.log('\n✨ Widget setup complete!');
  console.log('\n📦 Files created:');
  console.log('  ✅ widgets/widget-bg.png');
  console.log('  ✅ widgets/poem-widget-preview.png');
  console.log('  ✅ icons/widget-icon.png');
  console.log('  ✅ icons/shortcut-*.png (4 files)');
  console.log('  ✅ api/poem-of-day.json');
  console.log('  ✅ api/reading-stats.json');
}

async function generateWidgetBackground() {
  const svg = `
    <svg width="300" height="400">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0f;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e94560;stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile('widgets/widget-bg.png');
}

async function generateWidgetPreview() {
  const svg = `
    <svg width="300" height="400">
      <rect width="100%" height="100%" fill="#0a0a0f"/>
      <text x="150" y="40" font-family="Arial" font-size="14" fill="#ffffff" text-anchor="middle">📜 Poem of the Day</text>
      <text x="150" y="90" font-family="Georgia" font-size="24" fill="#ffffff" text-anchor="middle">My Beloved</text>
      <text x="150" y="115" font-family="Arial" font-size="12" fill="#e94560" text-anchor="middle">Sonnet #72</text>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile('widgets/poem-widget-preview.png');
}

async function generateWidgetIcon() {
  const svg = `
    <svg width="64" height="64">
      <rect width="100%" height="100%" rx="12" fill="#e94560"/>
      <text x="32" y="42" font-size="36" text-anchor="middle">💔</text>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile('icons/widget-icon.png');
}

async function generateShortcutIcons() {
  const shortcuts = [
    { name: 'poems', emoji: '📖', color: '#9b59b6' },
    { name: 'sonnets', emoji: '📜', color: '#e94560' },
    { name: 'heartbreak', emoji: '💔', color: '#ff6b6b' },
    { name: 'submit', emoji: '✍️', color: '#4ecdc4' }
  ];

  for (const s of shortcuts) {
    const svg = `
      <svg width="96" height="96">
        <rect width="100%" height="100%" rx="18" fill="${s.color}"/>
        <text x="48" y="62" font-size="48" text-anchor="middle">${s.emoji}</text>
      </svg>
    `;
    await sharp(Buffer.from(svg)).png().toFile(`icons/shortcut-${s.name}.png`);
  }
}

async function createDataFiles() {
  const poemData = {
    title: "My Beloved",
    category: "Sonnet #72",
    excerpt: "Go there in a dark room,\nIs a yellow bag and...\nHolding me when I was once a broom.",
    backgroundUrl: "https://poeverse.netlify.app/widgets/widget-bg.png",
    readUrl: "https://poeverse.netlify.app/#poem-poem1",
    date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    timestamp: new Date().toISOString()
  };

  const statsData = {
    poemsRead: "12",
    readingTime: "18m",
    favorites: "5",
    visits: "24",
    statsUrl: "https://poeverse.netlify.app/#stats"
  };

  await fs.writeFile('api/poem-of-day.json', JSON.stringify(poemData, null, 2));
  await fs.writeFile('api/reading-stats.json', JSON.stringify(statsData, null, 2));
}

setupWidgets().catch(console.error);