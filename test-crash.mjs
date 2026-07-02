import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Emulate iPhone X
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
            msg.location && console.log('Location:', msg.location().url, msg.location().lineNumber, msg.location().columnNumber);
        }
    });

    page.on('pageerror', err => {
        console.log('PAGE ERROR:', err.message);
        console.log('STACK:', err.stack);
    });

    console.log("Navigating to preview server...");
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));
    
    // Check if the "Something went wrong" text appears
    const bodyText = await page.evaluate(() => document.body.innerText);
    if (bodyText.includes('Something went wrong')) {
        console.log("Found error boundary!");
        console.log(bodyText.substring(0, 500));
    } else {
        console.log("No error boundary found on mobile emulation.");
    }
    
    await browser.close();
})();
