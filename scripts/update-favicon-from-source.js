/**
 * favicon-source.png를 기반으로 모든 파비콘 파일 갱신
 * - 32, 48, 192, 512 PNG + favicon.ico
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const publicDir = path.join(__dirname, '..', 'public');
const sourcePath = path.join(publicDir, 'favicon-source.png');
const sizes = [32, 48, 192, 512];

async function main() {
  if (!fs.existsSync(sourcePath)) {
    console.error('favicon-source.png not found in public/');
    process.exit(1);
  }

  const buffer = fs.readFileSync(sourcePath);

  for (const size of sizes) {
    const outPath = path.join(publicDir, `favicon-${size}.png`);
    await sharp(buffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Created favicon-${size}.png`);
  }

  const png48 = fs.readFileSync(path.join(publicDir, 'favicon-48.png'));
  const ico = await toIco([png48], { resize: true, sizes: [16, 32, 48] });
  const icoPath = path.join(publicDir, 'favicon.ico');
  fs.writeFileSync(icoPath, ico);
  console.log('Created favicon.ico (' + ico.length + ' bytes)');

  fs.unlinkSync(sourcePath);
  console.log('Removed favicon-source.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
