const sharp = require('sharp');

async function generateWidgetIcon() {
  const size = 64;

  const svg = `
    <svg width="${size}" height="${size}">
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e94560;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ff6b6b;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="12" fill="url(#iconGrad)"/>
      <text x="32" y="42" font-family="serif" font-size="36" fill="#ffffff" text-anchor="middle" font-weight="bold">
        💔
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile('icons/widget-icon.png');

  console.log('✅ Widget icon generated: icons/widget-icon.png');
}

generateWidgetIcon().catch(console.error);