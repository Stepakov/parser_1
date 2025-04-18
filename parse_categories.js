import puppeteer from 'puppeteer-extra'
import fs from 'fs'

// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())

const startTime = Date.now()

// puppeteer usage as normal
puppeteer.launch({
    headless: false,
    args: ['--start-maximized']
}).then(async browser => {
    console.log('Running tests..')
    const page = await browser.newPage()
    await page.goto('https://www.oleole.pl/', { waitUntil: 'networkidle2' } )

    // await page.screenshot({ path: 'testresult.png', fullPage: true })

    await page.waitForSelector('#onetrust-accept-btn-handler');
    await page.click( "#onetrust-accept-btn-handler" )

    await page.click('button[data-type="full"]');
    await sleep( 2000 )
    await page.hover('button[data-type="full"]');
    await sleep( 2000 )
    // await page.screenshot({ path: 'testresult2.png', fullPage: true })
    await page.click('button[data-type="full"]');
    await sleep( 2000 )

    const categoryLinks = await page.$$('.category-link');

    const categories = []
    const sub_categories = []
    //
    for (const link of categoryLinks) {
        // Наводим на элемент
        await link.hover();

        // Ждём появления подменю (замени селектор на нужный!)
        try {
            // await page.waitForSelector('.sub-menu', {timeout: 3000}); // замените .sub-menu на актуальный селектор
            await page.waitForSelector('.reference', {timeout: 3000}); // замените .sub-menu на актуальный селектор
            await sleep( 1000 )
            categories.push( ...await page.$$eval(
                "p.category-dropdown-header",
                els => els.map( el => {
                    return el.querySelector( 'a.reference' ).href
                } )
            ))
        } catch (err) {
            console.log('Подменю не появилось для этого пункта.');
        }
    }

    console.log( categories )

    const fullTree = [];

    for (let catUrl of categories) {
        const catTree = await parseCategory(page, catUrl);
        fullTree.push(catTree);
    }

    console.log(JSON.stringify(fullTree, null, 2));

    await browser.close()
    console.log(`All done, check the screenshot. ✨`)
    fs.writeFileSync('categories.json', JSON.stringify(fullTree, null, 2), 'utf-8');
    console.log('✅ Структура сохранена в categories.json');
    const stopTime = Date.now()
    let unix_timestamp = stopTime - startTime;
    var date = new Date(unix_timestamp * 1000);
// Hours part from the timestamp
    var hours = date.getHours();
// Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
// Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
// Will display time in 10:30:23 format
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    console.log("Run time = ", formattedTime);
})

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

async function parseCategory(page, url, depth = 0, inheritedCount = null) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const hasProducts = await page.$('.product-list-results') !== null;

        if (hasProducts) {
            // Извлечь количество товаров из страницы
            const countText = await page.$eval('.category-top__results-count', el => el.innerText).catch(() => '');
            const productCount = parseInt(countText.replace(/[^\d]/g, ''), 10) || inheritedCount || 0;

            console.log(`${' '.repeat(depth * 2)}🟡 Товары: ${url} — ${productCount} шт.`);

            return {
                name: await page.title(),
                url,
                productCount,
                products: [] // Здесь можно вытаскивать товары
            };
        }

        // Подкатегории
        const subLinks = await page.$$eval('.categories__leaf', els => {
            return els.map(el => {
                const name = el.querySelector('.leaf-anchor__title')?.innerText.trim();
                const url = el.querySelector('a.category-leaf__title')?.href;
                const countText = el.querySelector('.leaf-anchor__count')?.innerText || '';
                const productCount = parseInt(countText.replace(/[^\d]/g, ''), 10);
                return { name, url, productCount };
            });
        });

        console.log(`${' '.repeat(depth * 2)}📁 Категория: ${url}, подкатегорий: ${subLinks.length}`);

        const subcategories = [];
        for (let sub of subLinks) {
            const result = await parseCategory(page, sub.url, depth + 1, sub.productCount);
            if (result) {
                result.name = sub.name || result.name; // если нужно заменить
                result.url = sub.url || result.url;
                result.productCount = result.productCount || sub.productCount || 0;
                subcategories.push(result);
            }
        }

        return {
            name: await page.title(),
            url,
            subcategories
        };

    } catch (e) {
        console.error('❌ Ошибка при загрузке', url, e.message);
        return null;
    }
}

