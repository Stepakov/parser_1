import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const categoriesFile = 'categories.json';
const saveFolder = 'results';

if (!fs.existsSync(saveFolder)) fs.mkdirSync(saveFolder);

(async () => {
    const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
    const page = await browser.newPage();

    await page.goto('https://www.oleole.pl/', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#onetrust-accept-btn-handler');
    await page.click("#onetrust-accept-btn-handler");

    const allCategories = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));
    // const targetCategoryUrl = 'https://www.oleole.pl/pralki-i-suszarki.bhtml'; // ЗАДАЁМ ЗДЕСЬ
    // const targetCategoryUrl = 'https://www.oleole.pl/wyposazenie-do-pralek-i-suszarek.bhtml'; // ЗАДАЁМ ЗДЕСЬ
    // const targetCategoryUrl = 'https://www.oleole.pl/agd.bhtml'; // ЗАДАЁМ ЗДЕСЬ
    //
    // const targetCategory = findCategoryByUrl(allCategories, targetCategoryUrl);
    //
    // if (!targetCategory) {
    //     console.error('❌ Категория не найдена');
    //     process.exit(1);
    // }
    //
    // console.log( 'target Category', targetCategory )
    //
    // const allSubcategories = collectAllSubcategories(targetCategory);
    //
    // console.log( 'allSubcategories', allSubcategories )
    //
    // for (const subcat of allSubcategories) {
    //     console.log(`🔍 Парсинг: ${subcat.name}`);
    //     const products = await parseProductsFromCategory(page, subcat.url);
    //     const filename = path.join(saveFolder, `${urlToFilename(subcat.url)}.json`);
    //     fs.writeFileSync(filename, JSON.stringify(products, null, 2), 'utf-8');
    //     console.log(`✅ Сохранено: ${filename}`);
    // }
    // const targetCategoryUrl = 'https://www.oleole.pl/wyposazenie-do-pralek-i-suszarek.bhtml'; // Пример прямой страницы
    // const targetCategoryUrl = 'https://www.oleole.pl/pralki-i-suszarki.bhtml'; // ЗАДАЁМ ЗДЕСЬ ПОДКАТЕГОРИЯ
    // const targetCategoryUrl = 'https://www.oleole.pl/wyposazenie-do-pralek-i-suszarek.bhtml'; // ЗАДАЁМ ЗДЕСЬ КАТЕГОРИЯ
    //
    // const targetCategory = findCategoryByUrl(allCategories, targetCategoryUrl);
    //
    // if (!targetCategory) {
    //     console.error('❌ Категория не найдена');
    //     process.exit(1);
    // }
    //
    // const allSubcategories = collectAllSubcategories(targetCategory);
    //
    // if (allSubcategories.length > 0) {
    //     // Парсим все вложенные подкатегории
    //     for (const subcat of allSubcategories) {
    //         console.log(`🔍 Парсинг: ${subcat.name}`);
    //         const products = await parseProductsFromCategory(page, subcat.url);
    //         const filename = path.join(saveFolder, `${urlToFilename(subcat.url)}.json`);
    //         fs.writeFileSync(filename, JSON.stringify(products, null, 2), 'utf-8');
    //         console.log(`✅ Сохранено: ${filename}`);
    //     }
    // } else {
    //     // Если нет вложенных — парсим сразу выбранную категорию
    //     console.log(`🔍 Прямая категория: ${targetCategory.name}`);
    //     const products = await parseProductsFromCategory(page, targetCategory.url);
    //     const filename = path.join(saveFolder, `${urlToFilename(targetCategory.url)}.json`);
    //     fs.writeFileSync(filename, JSON.stringify(products, null, 2), 'utf-8');
    //     console.log(`✅ Сохранено: ${filename}`);
    // }
// const targetCategoryUrl = 'https://www.oleole.pl/wyposazenie-do-pralek-i-suszarek.bhtml'; // Пример прямой страницы
    // const targetCategoryUrl = 'https://www.oleole.pl/pralki-i-suszarki.bhtml'; // ЗАДАЁМ ЗДЕСЬ ПОДКАТЕГОРИЯ
    // const targetCategoryUrl = 'https://www.oleole.pl/wyposazenie-do-pralek-i-suszarek.bhtml'; // ЗАДАЁМ ЗДЕСЬ КАТЕГОРИЯ
    const targetCategoryUrls = [
        'https://www.oleole.pl/telewizory-led-lcd-plazmowe.bhtml',
        // 'https://www.oleole.pl/agd.bhtml',
        // 'https://www.oleole.pl/agd-do-zabudowy.bhtml',
        // 'https://www.oleole.pl/agd-male.bhtml',

        // 'https://www.oleole.pl/wyposazenie-do-pralek-i-suszarek.bhtml', // Прямая категория
    ];

    for (const url of targetCategoryUrls) {
        const matchedCategory = findCategoryByUrl(allCategories, url);

        if (matchedCategory) {
            const subcategories = collectAllSubcategories(matchedCategory);

            if (subcategories.length > 0) {
                console.log(`📂 Найдена категория с подкатегориями: ${matchedCategory.name}`);
                for (const subcat of subcategories) {
                    console.log(`🔍 Парсинг подкатегории: ${subcat.name}`);
                    try {
                        const products = await parseProductsFromCategory(page, subcat.url);
                        if( products.length > 1)
                        {
                            const filename = path.join(saveFolder, `${urlToFilename(subcat.url)}.json`);
                            fs.writeFileSync(filename, JSON.stringify(products, null, 2), 'utf-8');
                            console.log(`✅ Сохранено: ${filename}`);
                        }
                        else
                        {
                            console.log(`✅ Пустой массив. Товаров не было.`);
                        }
                    } catch (e) {
                        console.error(`❌ Ошибка при парсинге ${subcat.url}: ${e.message}`);
                    }
                }
            } else {
                console.log(`📄 Категория без вложенных: ${matchedCategory.name}`);
                try {
                    const products = await parseProductsFromCategory(page, matchedCategory.url);
                    const filename = path.join(saveFolder, `${urlToFilename(matchedCategory.url)}.json`);
                    fs.writeFileSync(filename, JSON.stringify(products, null, 2), 'utf-8');
                    console.log(`✅ Сохранено: ${filename}`);
                } catch (e) {
                    console.error(`❌ Ошибка при парсинге ${matchedCategory.url}: ${e.message}`);
                }
            }
        } else {
            // Пробуем как прямую категорию (в categories.json её нет)
            console.log(`🟡 Не найдена в categories.json. Пробуем как прямую категорию: ${url}`);
            try {
                const products = await parseProductsFromCategory(page, url);
                const filename = path.join(saveFolder, `${urlToFilename(url)}.json`);
                fs.writeFileSync(filename, JSON.stringify(products, null, 2), 'utf-8');
                console.log(`✅ Сохранено: ${filename}`);
            } catch (e) {
                console.error(`❌ Ошибка при парсинге ${url}: ${e.message}`);
            }
        }
    }



    await browser.close();
})();

function findCategoryByUrl(categories, targetUrl) {
    for (const cat of categories) {
        if (cat.url === targetUrl) return cat;
        if (cat.subcategories) {
            const result = findCategoryByUrl(cat.subcategories, targetUrl);
            if (result) return result;
        }
    }
    return null;
}

function collectAllSubcategories(category) {
    let result = [];
    if (category.subcategories && category.subcategories.length) {
        for (const sub of category.subcategories) {
            result.push(sub);
            result = result.concat(collectAllSubcategories(sub)); // рекурсия на всякий случай
        }
    }
    return result;
}

function urlToFilename(url) {
    const slug = url.split('/').filter(Boolean).pop().replace('.bhtml', '');
    return slug;
}

async function parseProductsFromCategory(page, url) {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const isBot = await page.$('.bot-check__header');
        if (isBot) {
            console.warn(`⚠️ Обнаружен антибот-экран на ${url}, подожду и попробую снова`);
            await sleep(15000);
            return parseProductsFromCategory(page, url); // retry
        }

        // await page.waitForSelector('ems-euro-mobile-product-medium-box, .product-entry2', { timeout: 15000 });
        //
        // let previousHeight;
        // while (true) {
        //     previousHeight = await page.evaluate('document.body.scrollHeight');
        //     await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        //     await sleep(2000);
        //     const newHeight = await page.evaluate('document.body.scrollHeight');
        //     if (newHeight === previousHeight) break;
        // }
        //
        // const products = await page.$$eval('ems-euro-mobile-product-medium-box', items =>
        //     items.map(item => {
        //         const name = item.querySelector('h4 a')?.innerText.trim() || null;
        //         const url = item.querySelector('h4 a')?.href || null;
        //         const priceText = item.querySelector('.parted-price-total')?.innerText || '';
        //         const price = parseFloat(priceText.replace(',', '.').replace(/[^\d.]/g, ''));
        //         const priceDecimalText = item.querySelector('.parted-price-decimal')?.innerText || '';
        //         const priceDecimal = parseFloat(priceDecimalText.replace(',', '.').replace(/[^\d.]/g, ''));
        //         const nrKat = item.querySelector('[data-aut-id=product-plu]')?.innerText?.replace('nr kat. ', '').trim() || null;
        //         const availability = item.querySelector('.record__title-content span')?.innerText.trim() || null;
        //
        //         return {
        //             name,
        //             nrKat,
        //             price,
        //             priceDecimal,
        //             url,
        //             availability
        //         };
        //     }));
        //
        // return products;
        let loadMoreVisible = true;
        while (loadMoreVisible) {
            try {
                const loadMoreBtn = await page.$('a[data-aut-id="show-more-products-button"]');

                if (loadMoreBtn) {
                    const isDisabled = await page.evaluate(btn => btn.getAttribute('aria-disabled') === 'true', loadMoreBtn);
                    if (isDisabled) {
                        loadMoreVisible = false;
                        break;
                    }

                    console.log('🔄 Кликаю "Pokaż więcej produktów"...');
                    await loadMoreBtn.click();
                    await sleep(3000); // подождать загрузку
                    await page.waitForFunction(() => {
                        const btn = document.querySelector('a[data-aut-id="show-more-products-button"]');
                        return btn ? btn.getAttribute('aria-disabled') !== 'true' : true;
                    }, { timeout: 10000 }).catch(() => {}); // на всякий случай
                } else {
                    loadMoreVisible = false;
                }
            } catch (err) {
                console.warn('⚠️ Кнопка "Показать больше" не найдена или произошла ошибка:', err.message);
                loadMoreVisible = false;
            }
        }

        const group = await page.$eval( '.breadcrumbs__breadcrumb-item--disabled', el => el.innerText.trim() )
        console.log( group )

        const products = await page.$$eval('ems-euro-mobile-product-medium-box', (items, groupFromNode) =>
                items.map(item => {
                    const name = item.querySelector('h4 a')?.innerText.trim() || null;
                    const url = item.querySelector('h4 a')?.href || null;
                    const priceText = item.querySelector('.parted-price-total')?.innerText || '';
                    const price = parseFloat(priceText.replace(',', '.').replace(/[^\d.]/g, ''));

                    const priceDecimalText = item.querySelector('.parted-price-decimal')?.innerText || '';
                    const priceDecimal = parseFloat(priceDecimalText.replace(',', '.').replace(/[^\d.]/g, ''));
                    const nrKat = item.querySelector('[data-aut-id=product-plu]')?.innerText.replace('nr kat. ', '').trim() || null;
                    const availability = item.querySelector('.record__title-content span')?.innerText.trim() || null;

                    return {
                        name,
                        nrKat,
                        price,
                        priceDecimal,
                        url,
                        group: groupFromNode,
                        availability
                    };
                }),
            group
        );

        console.log(`✅ Найдено товаров: ${products.length} в категории ${url}`);
        return products;
    } catch (e) {
        console.error(`❌ Ошибка при парсинге: ${url}`, e.message);
        return [];
    }
}
