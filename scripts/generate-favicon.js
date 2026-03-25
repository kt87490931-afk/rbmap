/**
 * favicon-48.png를 기반으로 올바른 favicon.ico 생성
 * - 기존 favicon.ico에 BOM 등으로 인한 손상 가능성 있어, ICO 포맷으로 재생성
 * - Google 검색 결과용: 48x48 이상 권장 (2024 가이드라인)
 */
const fs = require('fs');
const path = require('path');
const toIco = require('to-ico');

const publicDir = path.join(__dirname, '..', 'public');
const pngPath = path.join(publicDir, 'favicon-48.png');
const pngRootPath = path.join(publicDir, 'favicon.png');
const icoPath = path.join(publicDir, 'favicon.ico');
const backupPath = path.join(__dirname, 'favicon.ico.bak');

async function main() {
  if (!fs.existsSync(pngPath)) {
    console.error('favicon-48.png not found in public/');
    process.exit(1);
  }

  const png = fs.readFileSync(pngPath);
  const ico = await toIco([png], { resize: true, sizes: [16, 32, 48] });

  if (fs.existsSync(icoPath)) {
    fs.copyFileSync(icoPath, backupPath);
    console.log('Backed up existing favicon.ico -> favicon.ico.bak');
  }

  fs.writeFileSync(icoPath, ico);
  console.log('Generated favicon.ico (' + ico.length + ' bytes)');

  fs.copyFileSync(pngPath, pngRootPath);
  console.log('Synced favicon.png from favicon-48.png (검색·브라우저 공통 PNG 경로)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
