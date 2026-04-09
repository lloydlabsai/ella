import sharp from 'sharp';
import fs from 'fs';

const WIDTH = 1200;
const HEIGHT = 630;

// SVG for the OG image — cream background, coral accents, logo, headline
const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7F3EE"/>
      <stop offset="100%" stop-color="#EFEBE5"/>
    </linearGradient>
    <radialGradient id="coralGlow" cx="85%" cy="50%" r="30%">
      <stop offset="0%" stop-color="#E8664A" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#E8664A" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#coralGlow)"/>

  <!-- Decorative circles -->
  <circle cx="1050" cy="160" r="60" fill="#E8664A" fill-opacity="0.08"/>
  <circle cx="1100" cy="470" r="45" fill="#E8664A" fill-opacity="0.06"/>

  <!-- Coral accent bar on left -->
  <rect x="80" y="200" width="40" height="4" fill="#E8664A" rx="2"/>

  <!-- Wordmark -->
  <text x="80" y="170" font-family="Georgia, serif" font-size="42" font-weight="400" fill="#2D2520">Ella</text>

  <!-- Headline -->
  <text x="80" y="280" font-family="Georgia, serif" font-size="64" font-weight="400" fill="#2D2520">You know your industry.</text>
  <text x="80" y="360" font-family="Georgia, serif" font-size="64" font-weight="400" fill="#2D2520">Now post like it.</text>

  <!-- Subline -->
  <text x="80" y="440" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#8C7E72">Turn your expertise into LinkedIn posts that sound like you.</text>

  <!-- URL -->
  <text x="80" y="550" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="#E8664A">getella.io</text>
</svg>
`;

async function main() {
  // Render SVG to PNG
  const svgBuffer = Buffer.from(svg);

  // Load the parrot logo and composite it on the right side
  const logoBuffer = fs.readFileSync('./public/ella-logo.png');
  const resizedLogo = await sharp(logoBuffer).resize(260, 260).toBuffer();

  await sharp(svgBuffer)
    .composite([{
      input: resizedLogo,
      top: 185,
      left: 830,
    }])
    .png()
    .toFile('./public/og-image.png');

  console.log('✓ OG image generated at public/og-image.png');
}

main().catch(console.error);
