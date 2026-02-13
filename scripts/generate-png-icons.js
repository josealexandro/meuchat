/**
 * Converts SVG icons to PNG for PWA manifest (Chrome requires PNG).
 * Run: node scripts/generate-png-icons.js  or  npm run icons
 */
const fs = require("fs");
const path = require("path");

async function main() {
  let Resvg;
  try {
    Resvg = require("@resvg/resvg-js").Resvg;
  } catch {
    console.warn("Run: npm install  (requires @resvg/resvg-js)");
    return;
  }

  const publicDir = path.join(__dirname, "..", "public", "icons");
  const sizes = [192, 512];

  for (const size of sizes) {
    const svgPath = path.join(publicDir, `icon-${size}.svg`);
    const pngPath = path.join(publicDir, `icon-${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.warn(`Skip: ${svgPath} not found`);
      continue;
    }

    const svg = fs.readFileSync(svgPath);
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    fs.writeFileSync(pngPath, pngBuffer);
    console.log(`Created ${pngPath}`);
  }
}

main().catch((err) => {
  console.warn("Icon generation skipped:", err.message);
});
