const fs = require('fs')
const puppeteer = require('puppeteer')
let link = 'https://meduza.io/'

const parseMedusaWebView = async (clicks) => {
    try {
        let browser = await puppeteer.launch({ headless: true, slowMo: 100, devtools: true });
        let page = await browser.newPage();
        await page.setViewport({ width: 1400, height: 900 });
        await page.goto(link, { waitUntil: 'domcontentloaded' });
        const selector = await page.$('div.InfoPanel-switcher');
        await selector.click();
        await page.waitForSelector('div.Chronology-wrapper');
        // Больше кликов - больше новостей загрузится
        for (let i = 0; i < clicks; i++) {
            const button = await page.$('button.Button-root.Button-default.Button-gold')
            await button.click();
        }
        let html = await page.evaluate(async () => {
            let res = []
            let container = await document.querySelectorAll('div.Chronology-item')
            container.forEach(item => {
                let title = item.querySelector('div.ChronologyItem-header').innerText
                let time = item.querySelector('time.Timestamp-root').innerText
                let img
                try {
                    img = item.querySelector('div.ChronologyItem-image').getAttribute('style')
                } catch (e) {
                    img = null
                }
                let link = item.querySelector('a.ChronologyItem-link').href
                res.push({
                    link,
                    img,
                    title,
                    time
                })
            })

            return res
        }, { waitUntil: '' })

        for (let i = 0; i < html.length; i++) {
            await page.goto(html[i].link, { waitUntil: 'domcontentloaded' })
            await page.waitForSelector('div.GeneralMaterial-article').catch(err => console.log(err));
            console.log(i);
            let article = await page.evaluate(async () => {
                let article = null
                try {
                    article = document.querySelector('div.GeneralMaterial-article').innerText
                } catch (e) {
                    article = null
                }
                return article
            })
            html[i]['text'] = article
        }

        await browser.close();

        fs.writeFile("medusa.json", JSON.stringify(html), function (err) {
            if (err) throw err;
            console.log("Saved medusa.json file");
        });
    } catch (e) {
        console.log(e);
        await browser.close();
    }
}

parseMedusaWebView(0)