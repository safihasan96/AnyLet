import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5174/map', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshots/mobile-test2.png' });
  
  // also get HTML
  const content = await page.content();
  const fs = await import('fs');
  fs.writeFileSync('screenshots/mobile-test2.html', content);
  
  await browser.close();
})();
