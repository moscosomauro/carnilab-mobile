const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const SCRIPT_URL = 'http://localhost:5173'; // Correct Port
    const OUT_DIR = path.join(__dirname, '../manual_images');

    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR);
    }

    console.log('🚀 Iniciando Bot de Capturas...');
    console.log('🎯 Objetivo: ' + SCRIPT_URL);

    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 390, height: 844 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const snap = async (name) => {
        console.log(`📸 Guardando ${name}...`);
        await page.screenshot({ path: path.join(OUT_DIR, name) });
    };

    try {
        console.log('🔑 Navegando al Login...');
        await page.goto(`${SCRIPT_URL}/#/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 4000));

        const email = 'moscosomauro@gmail.com';
        const pass = 'Haswell07.';

        try {
            await page.waitForSelector('input[type="email"]', { timeout: 10000 });
        } catch (e) {
            console.log("⚠️ Input email no encontrado. Puede que ya estés logueado o en otra pantalla.");
        }

        console.log('📝 Intentando acciones de login...');

        const emailInput = await page.$('input[type="email"]');
        if (emailInput) await emailInput.type(email);

        const passInput = await page.$('input[type="password"]');
        if (passInput) await passInput.type(pass);

        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) await submitBtn.click();

        await new Promise(r => setTimeout(r, 4000));

        // Secuencia de Capturas
        const routes = [
            { path: '/dashboard', name: '01_dashboard.png', wait: 5000 },
            { path: '/plants', name: '03_inventory.png', wait: 5000 },
            { path: '/diary', name: '04_diary.png', wait: 5000 },
            { path: '/crosses', name: '05_genetics.png', wait: 5000 },
            { path: '/alerts', name: '06_alerts.png', wait: 5000 },
            { path: '/profile', name: '08_profile.png', wait: 5000 }
        ];

        for (const route of routes) {
            console.log(`Navegando a ${route.path}...`);
            try {
                await page.goto(`${SCRIPT_URL}/#${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
                await new Promise(r => setTimeout(r, route.wait));
                await snap(route.name);
            } catch (e) {
                console.log(`Error en ${route.name}: ${e.message}`);
            }
        }

        // Design Cover
        await page.goto(`${SCRIPT_URL}/#/design`, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 2000));
        await snap('00_cover.png');

        console.log('✨ ¡Capturas completadas! Revisa la carpeta manual_images');

    } catch (err) {
        console.error('❌ Error General:', err);
        await snap('error_final.png');
    } finally {
        await browser.close();
    }
})();
