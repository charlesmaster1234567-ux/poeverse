const sharp = require('sharp');

async function generateWidgetBackground() {
  const width = 300;
  const height = 400;

  // Create a gradient background
  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0f;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e94560;stop-opacity:0.3" />
        </linearGradient>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
      <circle cx="50" cy="50" r="40" fill="#e94560" opacity="0.2" filter="url(#blur)"/>
      <circle cx="${width - 50}" cy="${height - 50}" r="60" fill="#4ecdc4" opacity="0.15" filter="url(#blur)"/>
      <circle cx="${width / 2}" cy="${height / 2}" r="80" fill="#9b59b6" opacity="0.1" filter="url(#blur)"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile('widgets/widget-bg.png');

  console.log('✅ Widget background generated: widgets/widget-bg.png');
}

async function generateWidgetPreview() {
  const width = 300;
  const height = 400;

  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0f;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a2e;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
      
      <!-- Header -->
      <rect x="20" y="20" width="260" height="30" rx="15" fill="#e94560" opacity="0.3"/>
      <text x="150" y="40" font-family="Arial" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">
        📜 Poem of the Day
      </text>
      
      <!-- Title -->
      <text x="150" y="90" font-family="Georgia" font-size="24" fill="#ffffff" text-anchor="middle" font-weight="bold">
        My Beloved
      </text>
      
      <!-- Category -->
      <text x="150" y="115" font-family="Arial" font-size="12" fill="#e94560" text-anchor="middle">
        Sonnet #72
      </text>
      
      <!-- Excerpt Lines -->
      <text x="150" y="160" font-family="Georgia" font-size="14" fill="#b8b8d1" text-anchor="middle" font-style="italic">
        Go there in a dark room,
      </text>
      <text x="150" y="180" font-family="Georgia" font-size="14" fill="#b8b8d1" text-anchor="middle" font-style="italic">
        Is a yellow bag and...
      </text>
      <text x="150" y="200" font-family="Georgia" font-size="14" fill="#b8b8d1" text-anchor="middle" font-style="italic">
        Holding me when I was once a broom
      </text>
      
      <!-- Button -->
      <rect x="75" y="240" width="150" height="40" rx="20" fill="#e94560"/>
      <text x="150" y="265" font-family="Arial" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">
        Read Full Poem
      </text>
      
      <!-- Footer -->
      <text x="30" y="360" font-family="Arial" font-size="11" fill="#8888a8">
        💔 PoeVerse
      </text>
      <text x="270" y="360" font-family="Arial" font-size="11" fill="#8888a8" text-anchor="end">
        Today
      </text>
      
      <!-- Decorative elements -->
      <circle cx="30" cy="100" r="15" fill="#e94560" opacity="0.1"/>
      <circle cx="270" cy="300" r="20" fill="#4ecdc4" opacity="0.1"/>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile('widgets/poem-widget-preview.png');

  console.log('✅ Widget preview generated: widgets/poem-widget-preview.png');
}

async function generateAllWidgets() {
  const fs = require('fs').promises;
  await fs.mkdir('widgets', { recursive: true });
  
  await generateWidgetBackground();
  await generateWidgetPreview();
  
  console.log('\n✨ All widget assets generated successfully!');
}

generateAllWidgets().catch(console.error);