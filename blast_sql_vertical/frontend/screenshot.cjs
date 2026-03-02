const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Set the viewport to 800px wide, and 5000px tall
    await page.setViewport({ width: 800, height: 5000 });

    console.log('Navigating to report...');
    await page.goto('http://localhost/curso-relatorio/sql-basico-avancado', { waitUntil: 'networkidle2' });

    // Wait an extra 2 seconds for animations (like particles) to settle and fonts to load
    await new Promise(r => setTimeout(r, 2000));

    console.log('Taking screenshot...');
    // Save as WebP for optimal size and perfect fidelity
    await page.screenshot({
        path: 'C:\\Users\\Administrador\\Documents\\blast_education\\blast_sql_vertical\\frontend\\public\\report_scroll_static.webp',
        type: 'webp',
        quality: 80,
        clip: { x: 0, y: 0, width: 800, height: 5000 }
    });

    await browser.close();
    console.log('Done!');
})();
