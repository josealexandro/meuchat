/**
 * Generates icon-192.png and icon-512.png from logo.png.
 * Run: node scripts/generate-logo-icons.js  (requires sharp: npm install sharp --save-dev)
 */
const fs = require("fs");
const path = require("path");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.warn("Run: npm install sharp --save-dev");
    return;
  }

  const iconsDir = path.join(__dirname, "..", "public", "icons");
  const logoPath = path.join(iconsDir, "logo.png");

  if (!fs.existsSync(logoPath)) {
    console.warn("logo.png not found in public/icons");
    return;
  }

  for (const size of [192, 512]) {
    const outPath = path.join(iconsDir, `icon-${size}.png`);
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Created ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
