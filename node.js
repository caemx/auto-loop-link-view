const fs = require('fs');
const puppeteer = require('puppeteer');
const readline = require('readline');
const path = require('path');

// Fungsi input CLI
function tanyaInput(pertanyaan) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(pertanyaan, ans => {
        rl.close();
        resolve(ans);
    }));
}

// Spinner sederhana
async function spinner(ms = 3000, teks = "⏳ Menunggu...") {
    process.stdout.write(teks);
    const interval = 300;
    const steps = ms / interval;
    for (let i = 0; i < steps; i++) {
        process.stdout.write(".");
        await new Promise(r => setTimeout(r, interval));
    }
    process.stdout.write(" selesai\n");
}

// Daftar user-agent (random device simulation)
const userAgents = [
    // Chrome - Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    // Firefox - Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0",
    // Chrome - Android
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36",
    // Safari - iPhone
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    // Safari - macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    // Samsung Browser - Android
    "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/19.0 Chrome/117.0.0.0 Mobile Safari/537.36",
    // Edge - Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    // Chrome - Linux
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    // UC Browser - Android
    "Mozilla/5.0 (Linux; U; Android 11; en-US; Redmi Note 9) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 UCBrowser/13.4.0.1306 Mobile Safari/537.36",
    // Opera - Android
    "Mozilla/5.0 (Linux; Android 12; V2134) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36 OPR/76.1.4027.73372"
];

// Fungsi untuk ambil user-agent acak
function getRandomUserAgent() {
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomIndex];
}

// MAIN FUNCTION
(async () => {
    console.log("📦 Tokopedia Visit Automation\n");

    const jumlahLoop = parseInt(await tanyaInput("🔁 Masukkan jumlah loop per link (contoh: 5): "), 10);
    if (isNaN(jumlahLoop) || jumlahLoop <= 0) {
        console.log("❌ Jumlah loop tidak valid.");
        return;
    }

    const folderPath = path.join(__dirname, 'links');
    const filePath = path.join(folderPath, 'daftar-link.txt');

    if (!fs.existsSync(filePath)) {
        console.log("❌ File 'daftar-link.txt' tidak ditemukan di folder 'links/'.");
        return;
    }

    const linkList = fs.readFileSync(filePath, 'utf8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (linkList.length === 0) {
        console.log("❌ Tidak ada link yang ditemukan di file.");
        return;
    }

    for (const link of linkList) {
        console.log(`\n🌐 Mengunjungi link: ${link}\n`);

        for (let i = 0; i < jumlahLoop; i++) {
            const userAgent = getRandomUserAgent();
            console.log(`🔁 [${i + 1}/${jumlahLoop}] User-Agent: ${userAgent}`);

            try {
                const browser = await puppeteer.launch({
                    headless: true,
                    executablePath: puppeteer.executablePath(),
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-gpu',
                        '--window-size=1200,800',
                        '--disable-blink-features=AutomationControlled'
                    ]
                });

                const page = await browser.newPage();
                await page.setUserAgent(userAgent);

                await page.evaluateOnNewDocument(() => {
                    Object.defineProperty(navigator, 'webdriver', { get: () => false });
                });

                await page.goto(link, {
                    waitUntil: 'networkidle2',
                    timeout: 60000
                });

                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await spinner(3000, "💤 Menunggu halaman loading");

                await browser.close();
                console.log("✔️ Sukses\n");

            } catch (err) {
                console.log("❌ Gagal:", err.message, "\n");
            }
        }
    }

    console.log("🎉 SEMUA LINK TELAH SELESAI DIKUNJUNGI ✅");
})();
