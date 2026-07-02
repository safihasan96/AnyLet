/**
 * AnyLet Web - Page Screenshot & PDF Generator
 * Visits all routes, takes full-page screenshots, and compiles into a PDF.
 *
 * Usage:
 *   1. Start the dev server:  npm run dev
 *   2. Run this script:       node scripts/screenshot-pages.mjs
 *
 * Output: screenshots/ folder + AnyLet_Pages.pdf in project root
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'screenshots');
const BASE_URL = 'http://localhost:5174';
const OUTPUT_PDF = path.join(PROJECT_ROOT, 'AnyLet_Pages.pdf');

// ─── Page Map ─────────────────────────────────────────────────────────────────
// Format: { route, label, note? }
// Protected routes will show login redirect - still captured for completeness.
const PAGES = [
  { route: '/',                 label: 'Home',                group: 'Public' },
  { route: '/search',           label: 'Search',              group: 'Public' },
  { route: '/about',            label: 'About Us',            group: 'Public' },
  { route: '/contact',          label: 'Contact',             group: 'Public' },
  { route: '/pricing',          label: 'Pricing',             group: 'Public' },
  { route: '/agents',           label: 'Agents',              group: 'Public' },
  { route: '/blog',             label: 'Blog',                group: 'Public' },
  { route: '/download',         label: 'Download App',        group: 'Public' },
  { route: '/map',              label: 'Map',                 group: 'Public' },
  { route: '/sitemap',          label: 'Sitemap',             group: 'Public' },
  { route: '/privacy-policy',   label: 'Privacy Policy',      group: 'Legal'  },
  { route: '/terms',            label: 'Terms & Conditions',  group: 'Legal'  },
  { route: '/login',            label: 'Login',               group: 'Auth'   },
  { route: '/signup',           label: 'Sign Up',             group: 'Auth'   },
  { route: '/forgot-password',  label: 'Forgot Password',     group: 'Auth'   },
  { route: '/favorites',        label: 'Favorites',           group: 'Protected (Login Required)' },
  { route: '/notifications',    label: 'Notifications',       group: 'Protected (Login Required)' },
  { route: '/profile',          label: 'Profile',             group: 'Protected (Login Required)' },
  { route: '/edit-profile',     label: 'Edit Profile',        group: 'Protected (Login Required)' },
  { route: '/settings',         label: 'Settings',            group: 'Protected (Login Required)' },
  { route: '/change-password',  label: 'Change Password',     group: 'Protected (Login Required)' },
  { route: '/my-listings',      label: 'My Listings',         group: 'Protected (Login Required)' },
  { route: '/my-move-ins',      label: 'My Move-Ins',         group: 'Protected (Login Required)' },
  { route: '/my-bookings',      label: 'My Bookings',         group: 'Protected (Login Required)' },
  { route: '/requests',         label: 'Requests',            group: 'Protected (Login Required)' },
  { route: '/referral',         label: 'Referral Dashboard',  group: 'Protected (Login Required)' },
  { route: '/post-ad',          label: 'Post an Ad',          group: 'Protected (Login Required)' },
  { route: '/enquiry',          label: 'Enquiry',             group: 'Protected (Login Required)' },
  { route: '/verify-email',     label: 'Verify Email',        group: 'Protected (Login Required)' },
  { route: '/onboarding',       label: 'Onboarding',          group: 'Protected (Login Required)' },
  { route: '/admin',            label: 'Admin Panel',         group: 'Admin'  },
];

function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').toLowerCase();
}

async function waitForNetworkIdle(page, timeout = 5000) {
  try {
    await page.waitForNetworkIdle({ idleTime: 800, timeout });
  } catch (_) {
    // timeout is fine — just grab what's there
  }
}

// ─── PDF builder using raw PDF syntax ─────────────────────────────────────────
class SimplePDFBuilder {
  constructor() {
    this.pages = [];
  }

  addPage(imgBuffer, label, route, group, pageNum, totalPages) {
    this.pages.push({ imgBuffer, label, route, group, pageNum, totalPages });
  }

  _encode(str) {
    // Escape special PDF string chars
    return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  build() {
    // Page size: A4 landscape 842 x 595 pt
    const PW = 1190, PH = 842; // using larger for full screenshots
    const objects = [];
    let objNum = 0;

    function nextObj(content) {
      objNum++;
      objects.push({ num: objNum, content });
      return objNum;
    }

    // Catalog & Pages placeholder
    const catalogRef = 1;
    const pagesRef = 2;
    objNum = 2; // reserve 1 and 2

    const pageRefs = [];
    const imgRefs = [];

    // For each page: image object + page object
    this.pages.forEach((p, i) => {
      const base64 = p.imgBuffer.toString('base64');
      // We embed as JPEG (puppeteer screenshots as jpeg when quality is set)
      const imgObjNum = nextObj(null); // reserve
      imgRefs.push({ num: imgObjNum, data: base64 });

      const pageObjNum = nextObj(null);
      pageRefs.push({ num: pageObjNum, imgRef: imgObjNum, page: p });
    });

    // Now build actual PDF bytes
    const lines = [];
    const offsets = {};

    function out(str) {
      lines.push(str);
    }

    out('%PDF-1.4');
    out('%\xFF\xFF\xFF\xFF');

    function writeObj(num, content) {
      offsets[num] = lines.join('\n').length + 1;
      out(`${num} 0 obj`);
      out(content);
      out('endobj');
      out('');
    }

    // Catalog
    offsets[1] = lines.join('\n').length + 1;
    out('1 0 obj');
    out(`<< /Type /Catalog /Pages 2 0 R >>`);
    out('endobj');
    out('');

    // Pages dict (written last with kids)
    // We'll write it after all pages; save position holder
    const pagesPlaceholderIdx = lines.length;
    out('__PAGES_PLACEHOLDER__');
    out('');

    // Font object (Helvetica built-in)
    const fontRef = nextObj(null);
    offsets[fontRef] = lines.join('\n').length + 1;
    out(`${fontRef} 0 obj`);
    out('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    out('endobj');
    out('');

    // Image objects
    imgRefs.forEach(({ num, data }) => {
      const decoded = Buffer.from(data, 'base64');
      offsets[num] = lines.join('\n').length + 1;
      out(`${num} 0 obj`);
      out(`<< /Type /XObject /Subtype /Image /Width 1280 /Height 800 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${decoded.length} >>`);
      out('stream');
      // Can't put binary in text array — we'll handle differently
      out('__IMG_STREAM_' + num + '__');
      out('endstream');
      out('endobj');
      out('');
    });

    // Since raw binary in text arrays is complex, let's use a pure-JS approach
    // Build PDF as Buffer directly
    return this._buildPDF();
  }

  _buildPDF() {
    // Build a proper PDF with images embedded
    const PW = 1280, PH = 960; // Points (roughly A4 landscape scaled)

    const chunks = [];
    function writeStr(s) { chunks.push(Buffer.from(s, 'latin1')); }
    function writeBuf(b) { chunks.push(b); }

    let pos = 0;
    const offsets = {};

    function getPos() {
      return chunks.reduce((acc, c) => acc + c.length, 0);
    }

    function startObj(n) {
      offsets[n] = getPos();
      writeStr(`${n} 0 obj\n`);
    }
    function endObj() { writeStr('endobj\n\n'); }

    // PDF header
    writeStr('%PDF-1.4\n');
    writeStr('%\xFF\xFF\xFF\xFF\n\n');

    const totalPages = this.pages.length;
    // Obj layout:
    // 1 = Catalog, 2 = Pages, 3 = Font
    // For each page i:
    //   base = 4 + i*3
    //   base+0 = Image XObject
    //   base+1 = Content stream
    //   base+2 = Page

    const base = 4;
    const pageKids = this.pages.map((_, i) => `${base + i * 3 + 2} 0 R`).join(' ');

    // 1: Catalog
    startObj(1);
    writeStr(`<< /Type /Catalog /Pages 2 0 R >>\n`);
    endObj();

    // 2: Pages
    startObj(2);
    writeStr(`<< /Type /Pages /Kids [${pageKids}] /Count ${totalPages} >>\n`);
    endObj();

    // 3: Font
    startObj(3);
    writeStr(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\n`);
    endObj();

    this.pages.forEach((p, i) => {
      const imgObj = base + i * 3;
      const contentObj = base + i * 3 + 1;
      const pageObj = base + i * 3 + 2;

      const imgBuf = p.imgBuffer;
      // Detect dimensions from JPEG (quick SOF0 parser)
      let iw = 1280, ih = 800;
      // JPEG SOF markers: FF C0, FF C1, FF C2
      for (let j = 2; j < imgBuf.length - 8; j++) {
        if (imgBuf[j] === 0xFF && (imgBuf[j+1] === 0xC0 || imgBuf[j+1] === 0xC1 || imgBuf[j+1] === 0xC2)) {
          ih = imgBuf.readUInt16BE(j + 5);
          iw = imgBuf.readUInt16BE(j + 7);
          break;
        }
      }

      // Scale image to fit page with margins
      const marginTop = 60, marginBottom = 40, marginLR = 20;
      const availW = PW - marginLR * 2;
      const availH = PH - marginTop - marginBottom;
      const scale = Math.min(availW / iw, availH / ih);
      const drawW = iw * scale;
      const drawH = ih * scale;
      const drawX = marginLR + (availW - drawW) / 2;
      const drawY = marginBottom; // PDF coords from bottom

      // Header bar content stream
      const enc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

      const groupColors = {
        'Public': '0.2 0.6 0.4',
        'Auth': '0.2 0.4 0.8',
        'Legal': '0.5 0.3 0.7',
        'Protected (Login Required)': '0.8 0.4 0.1',
        'Admin': '0.7 0.1 0.1',
      };
      const color = groupColors[p.group] || '0.3 0.3 0.3';
      const [r, g, b] = color.split(' ').map(Number);

      const contentStream = [
        'q',
        // Header background bar
        `${r} ${g} ${b} rg`,
        `0 ${PH - marginTop} ${PW} ${marginTop} re f`,
        // White text
        '1 1 1 rg',
        'BT',
        '/F1 22 Tf',
        `20 ${PH - 38} Td`,
        `(${enc(p.label)}) Tj`,
        'ET',
        // Route text smaller
        'BT',
        '/F1 13 Tf',
        `20 ${PH - 56} Td`,
        `(Route: ${enc(p.route)}) Tj`,
        'ET',
        // Group badge at right
        'BT',
        '/F1 11 Tf',
        `${PW - 200} ${PH - 38} Td`,
        `(${enc(p.group)}) Tj`,
        'ET',
        // Page number
        'BT',
        '/F1 11 Tf',
        `${PW - 200} ${PH - 56} Td`,
        `(Page ${p.pageNum} of ${p.totalPages}) Tj`,
        'ET',
        // Draw image
        `q ${drawW} 0 0 ${drawH} ${drawX} ${drawY} cm /Img${i} Do Q`,
        'Q',
      ].join('\n');

      const contentBuf = Buffer.from(contentStream, 'latin1');

      // Image XObject
      startObj(imgObj);
      writeStr(`<< /Type /XObject /Subtype /Image /Width ${iw} /Height ${ih} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBuf.length} >>\n`);
      writeStr('stream\n');
      writeBuf(imgBuf);
      writeStr('\nendstream\n');
      endObj();

      // Content stream
      startObj(contentObj);
      writeStr(`<< /Length ${contentBuf.length} >>\n`);
      writeStr('stream\n');
      writeBuf(contentBuf);
      writeStr('\nendstream\n');
      endObj();

      // Page object
      startObj(pageObj);
      writeStr(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}]\n`);
      writeStr(`/Resources << /Font << /F1 3 0 R >> /XObject << /Img${i} ${imgObj} 0 R >> >>\n`);
      writeStr(`/Contents ${contentObj} 0 R >>\n`);
      endObj();
    });

    // Cross-reference table
    const xrefPos = getPos();
    const allObjs = [1, 2, 3, ...this.pages.flatMap((_, i) => [base + i*3, base + i*3 + 1, base + i*3 + 2])];
    const maxObj = Math.max(...allObjs);

    writeStr('xref\n');
    writeStr(`0 ${maxObj + 1}\n`);
    writeStr('0000000000 65535 f \n'); // object 0

    for (let n = 1; n <= maxObj; n++) {
      if (offsets[n] !== undefined) {
        writeStr(String(offsets[n]).padStart(10, '0') + ' 00000 n \n');
      } else {
        writeStr('0000000000 65535 f \n');
      }
    }

    writeStr('trailer\n');
    writeStr(`<< /Size ${maxObj + 1} /Root 1 0 R >>\n`);
    writeStr('startxref\n');
    writeStr(`${xrefPos}\n`);
    writeStr('%%EOF\n');

    return Buffer.concat(chunks);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log('\n🚀 AnyLet Page Screenshot Tool');
  console.log('================================');
  console.log(`📁 Screenshots → ${SCREENSHOTS_DIR}`);
  console.log(`📄 PDF Output  → ${OUTPUT_PDF}`);
  console.log(`🌐 Base URL    → ${BASE_URL}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--js-flags=--max-old-space-size=512',
    ],
  });

  const pdf = new SimplePDFBuilder();
  const results = [];

  for (let i = 0; i < PAGES.length; i++) {
    const { route, label, group } = PAGES[i];
    const url = BASE_URL + route;
    const filename = `${String(i + 1).padStart(2, '0')}_${sanitizeFilename(label)}.jpg`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    process.stdout.write(`  [${i + 1}/${PAGES.length}] ${label.padEnd(28)} (${route}) ...`);

    // Open a fresh page for each screenshot to avoid hangs
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    page.on('dialog', async (dialog) => { try { await dialog.dismiss(); } catch (_) {} });

    // Block heavy resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 20000 });
      await waitForNetworkIdle(page, 2000);

      // Short wait for animations
      await new Promise(r => setTimeout(r, 600));

      // Scroll to top
      await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});

      // Take screenshot as JPEG buffer
      const imgBuf = await page.screenshot({
        type: 'jpeg',
        quality: 85,
        clip: { x: 0, y: 0, width: 1280, height: 800 },
      });

      fs.writeFileSync(filepath, imgBuf);
      pdf.addPage(imgBuf, label, route, group, i + 1, PAGES.length);
      results.push({ label, route, group, status: '✅', filename });
      process.stdout.write(' ✅\n');

    } catch (err) {
      process.stdout.write(` ❌ (${err.message.split('\n')[0]})\n`);
      results.push({ label, route, group, status: '❌ ' + err.message.split('\n')[0], filename });

      // Try a quick fallback screenshot of whatever rendered
      try {
        await page.setRequestInterception(false);
        const errBuf = await page.screenshot({ type: 'jpeg', quality: 60 });
        if (errBuf.length > 0) {
          pdf.addPage(errBuf, label + ' (Partial)', route, group, i + 1, PAGES.length);
        }
      } catch (_) {}
    } finally {
      await page.close().catch(() => {});
    }
  }

  await browser.close();

  // Build PDF
  console.log('\n📑 Building PDF...');
  const pdfBuf = pdf.build();
  fs.writeFileSync(OUTPUT_PDF, pdfBuf);

  const pdfSizeMB = (pdfBuf.length / 1024 / 1024).toFixed(2);
  console.log(`✅ PDF saved → ${OUTPUT_PDF} (${pdfSizeMB} MB)\n`);

  // Summary table
  console.log('━'.repeat(70));
  console.log('  SUMMARY');
  console.log('━'.repeat(70));

  let lastGroup = '';
  results.forEach(r => {
    if (r.group !== lastGroup) {
      console.log(`\n  📂 ${r.group}`);
      lastGroup = r.group;
    }
    console.log(`    ${r.status}  ${r.label.padEnd(28)} → ${r.route}`);
  });

  const successCount = results.filter(r => r.status === '✅').length;
  console.log('\n' + '━'.repeat(70));
  console.log(`  ${successCount}/${results.length} pages captured successfully`);
  console.log('━'.repeat(70) + '\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
