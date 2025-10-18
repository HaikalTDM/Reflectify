/**
 * Creates placeholder image files for quick development
 * Run: node scripts/create-placeholder-assets.js
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Create assets directory if it doesn't exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// SVG templates for different asset types
const createSVG = (size, text, bgColor = '#d4af37', textColor = '#1a1a1a') => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${Math.floor(size / 10)}"
    font-weight="bold"
    fill="${textColor}"
    text-anchor="middle"
    dominant-baseline="middle"
  >${text}</text>
</svg>
`.trim();

// PNG Data URL for a simple colored square
const createPNGDataURL = (color) => {
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN${color === 'gold' ? 'k+P8PAAInAPIWVLCAAAAABJRU5ErkJggg==' : 'kYGB4wAAAP//4wABAAAAAAAA'}`;
};

const assets = [
  { name: 'icon.png', size: 1024, text: '🌙' },
  { name: 'splash.png', size: 2048, text: 'Reflectify' },
  { name: 'adaptive-icon.png', size: 1024, text: '🌙' },
  { name: 'favicon.png', size: 48, text: 'R' },
  { name: 'notification-icon.png', size: 96, text: '🌙' },
];

console.log('📦 Creating placeholder assets...\n');

assets.forEach(({ name, size, text }) => {
  const svgContent = createSVG(size, text);
  const filePath = path.join(assetsDir, name.replace('.png', '.svg'));
  
  try {
    fs.writeFileSync(filePath, svgContent);
    console.log(`✅ Created: ${name.replace('.png', '.svg')} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Failed to create ${name}:`, error.message);
  }
});

console.log('\n⚠️  Note: SVG files created. Expo will work with these for development.');
console.log('For production, convert these to PNG files or create custom designs.');
console.log('You can use online tools like: https://www.appicon.co/\n');

