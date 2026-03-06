const sharp = require('sharp');

const shortcuts = [
  { name: 'poems', emoji: '📖', color: '#9b59b6' },
  { name: 'sonnets', emoji: '📜', color: '#e94560' },
  { name: 'heartbreak', emoji: '💔', color: '#ff6b6b' },
  { name: 'submit', emoji: '✍️', color: '#4ecdc4' }
];

async function generateShortcutIcon(shortcut) {
  const size = 96;
  
  const svg = `
    <svg width="${size}" height="${size}">
      <defs>
        <linearGradient id="grad-${shortcut.name}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${shortcut.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${shortcut.color};stop-opacity:0.7" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="18" fill="url(#grad-${shortcut.name})"/>
      <text x="48" y="62" font-size="48" text-anchor="middle">
        ${shortcut.emoji}
      </text>
    </svg>
  `;

  const fs = require('fs').promises;
  await fs.mkdir('icons', { recursive: true });
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(`icons/shortcut-${shortcut.name}.png`);

  console.log(`✅ Generated: shortcut-${shortcut.name}.png`);
}

async function generateAllShortcuts() {
  for (const shortcut of shortcuts) {
    await generateShortcutIcon(shortcut);
  }
  console.log('\n✨ All shortcut icons generated!');
}

generateAllShortcuts().catch(console.error);