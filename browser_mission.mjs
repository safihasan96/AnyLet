import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'http://localhost:5174';

const PAGES_TO_TEST = [
  { name: 'Home', url: '/' },
  { name: 'Search', url: '/search' },
  { name: 'Login', url: '/login' },
  { name: 'Signup', url: '/signup' },
  { name: 'Map', url: '/map' }
];

const report = {
  consoleLogs: [],
  consoleErrors: [],
  pageErrors: [],
  networkErrors: [],
  layoutShifts: [], // difficult to capture perfectly, we will rely on screenshot visual inspection or large layout shifts if web-vitals could be used.
};

(async () => {
  const browser = await puppeteer.launch();
  
  for (const pageInfo of PAGES_TO_TEST) {
    console.log(`Testing page: ${pageInfo.name} at ${BASE_URL}${pageInfo.url}`);
    const page = await browser.newPage();
    
    // Set a typical mobile viewport to catch mobile-specific layout issues
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    // Track console
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        report.consoleErrors.push({ page: pageInfo.name, msg: text });
      } else if (type === 'warning') {
        report.consoleLogs.push({ page: pageInfo.name, type, msg: text });
      }
    });

    // Track unhandled page errors
    page.on('pageerror', error => {
      report.pageErrors.push({ page: pageInfo.name, error: error.message });
    });

    // Track failed network requests
    page.on('requestfailed', request => {
      report.networkErrors.push({
        page: pageInfo.name,
        url: request.url(),
        errorText: request.failure()?.errorText
      });
    });

    try {
      await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle2', timeout: 15000 });
      
      // Basic interaction: try to click a primary button on the page if it exists
      // Wait a bit for animations
      await new Promise(r => setTimeout(r, 2000));
      
      // Save screenshot for manual review of layout shifts/issues
      if (!fs.existsSync('screenshots')) {
          fs.mkdirSync('screenshots');
      }
      await page.screenshot({ path: `screenshots/${pageInfo.name.toLowerCase()}_mission.png`, fullPage: true });

    } catch (err) {
      report.pageErrors.push({ page: pageInfo.name, error: `Navigation failed: ${err.message}` });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  
  fs.writeFileSync('mission_report.json', JSON.stringify(report, null, 2));
  console.log('Browser mission completed. Wrote findings to mission_report.json');
})();
