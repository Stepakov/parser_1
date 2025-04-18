import puppeteer from 'puppeteer-extra'
import fs from 'fs'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())

const progressPath = 'progress.json'
const treePath = 'partial_categories.json'

// Вспомогательная функция ожидания
const sleep = time => new Promise(resolve => setTimeout(resolve, time))

// Загрузка прогресса
let progress = { processed: [] }
if (fs.existsSync(progressPath)) {
    progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'))
}

let fullTree = []
if (fs.existsSync(treePath)) {
    fullTree = JSON.parse(fs.readFileSync(treePath, 'utf-8'))
}

const startTime = Date.now()

puppeteer.launch({
    headless: false,
    args: ['--start-maximized']
}).then(async browser => {
    console.log('🚀 Запуск браузера...')
    const page = await browser.newPage()
    await page.goto('https://www.oleole.pl/', { waitUntil: 'networkidle2' })

    await page.waitForSelector('#onetrust-accept-btn-handler');
    await page.click("#onetrust-accept-btn-handler")

    await page.click('button[data-type="full"]');
    await sleep(2000)
    await page.hover('button[data-type="full"]');
    await sleep(2000)
    await page.click('button[data-type="full"]');
    await sleep(2000)

    const categoryLinks = await page.$$('.category-link');
    const categories = []

    for (const link of categoryLinks) {
        await link.hover()
        try {
            await page.waitForSelector('.reference', { timeout: 3000 })
            await sleep(1000)
            categories.push(...await page.$$eval(
                "p.category-dropdown-header",
                els => els.map(el => el.querySelector('a.reference')?.href).filter(Boolean)
            ))
        } catch (err) {
            console.log('⚠️ Подменю не появилось для одного из пунктов.')
        }
    }

    console.log('📁 Найдено категорий:', categories.length)

    for (let catUrl of categories) {
        if (progress.processed.includes(catUrl)) {
            console.log(`⏩ Пропущено (уже обработано): ${catUrl}`)
            continue
        }

        const shouldStop = await checkPauseOverlay(page)
        if (shouldStop) {
            fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf-8')
            fs.writeFileSync(treePath, JSON.stringify(fullTree, null, 2), 'utf-8')
            await browser.close()
            process.exit(0)
        }

        try {
            const catTree = await parseCategory(page, catUrl)
            if (catTree) {
                fullTree.push(catTree)
                // Сохраняем дерево поэтапно
                fs.writeFileSync(treePath, JSON.stringify(fullTree, null, 2), 'utf-8')
            }

            // Обновляем прогресс
            progress.processed.push(catUrl)
            fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf-8')

        } catch (e) {
            console.error(`❌ Ошибка при парсинге ${catUrl}: ${e.message}`)
            if (e.message.includes('403') || e.message.toLowerCase().includes('bot')) {
                console.log('🚨 Бот-детект! Сохраняем прогресс и выходим.')
                fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf-8')
                fs.writeFileSync(treePath, JSON.stringify(fullTree, null, 2), 'utf-8')
                await browser.close()
                process.exit(1)
            }
        }
    }

    await browser.close()
    fs.writeFileSync('categories.json', JSON.stringify(fullTree, null, 2), 'utf-8')
    console.log('✅ Полная структура сохранена в categories.json')

    const stopTime = Date.now()
    const runSec = Math.floor((stopTime - startTime) / 1000)
    const h = Math.floor(runSec / 3600).toString().padStart(2, '0')
    const m = Math.floor((runSec % 3600) / 60).toString().padStart(2, '0')
    const s = (runSec % 60).toString().padStart(2, '0')
    console.log("⏱️ Время работы: ", `${h}:${m}:${s}`)
})

async function parseCategory(page, url, depth = 0, inheritedCount = null) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

        const hasProducts = await page.$('.product-list-results') !== null

        if (hasProducts) {
            const countText = await page.$eval('.category-top__results-count', el => el.innerText).catch(() => '')
            const productCount = parseInt(countText.replace(/[^\d]/g, ''), 10) || inheritedCount || 0
            console.log(`${' '.repeat(depth * 2)}🟡 Товары: ${url} — ${productCount} шт.`)

            return {
                name: await page.title(),
                url,
                productCount,
                products: [] // можно вытягивать товары
            }
        }

        const subLinks = await page.$$eval('.categories__leaf', els => {
            return els.map(el => {
                const name = el.querySelector('.leaf-anchor__title')?.innerText.trim()
                const url = el.querySelector('a.category-leaf__title')?.href
                const countText = el.querySelector('.leaf-anchor__count')?.innerText || ''
                const productCount = parseInt(countText.replace(/[^\d]/g, ''), 10)
                return { name, url, productCount }
            }).filter(x => x.url)
        })

        console.log(`${' '.repeat(depth * 2)}📁 Категория: ${url}, подкатегорий: ${subLinks.length}`)

        const subcategories = []
        for (let sub of subLinks) {
            const result = await parseCategory(page, sub.url, depth + 1, sub.productCount)
            if (result) {
                result.name = sub.name || result.name
                result.url = sub.url || result.url
                result.productCount = result.productCount || sub.productCount || 0
                subcategories.push(result)
            }
        }

        return {
            name: await page.title(),
            url,
            subcategories
        }

    } catch (e) {
        console.error('❌ Ошибка при загрузке', url, e.message)
        return null
    }
}

let pauseCounter = 0;

async function checkPauseOverlay(page) {
    const isPaused = await page.$('.przerwa') !== null || await page.$('#przerwa') !== null;

    if (isPaused) {
        pauseCounter++;
        console.log(`⏸️ Обнаружено окно паузы (попытка №${pauseCounter})`);

        if (pauseCounter < 3) {
            console.log('⏳ Ожидание 10 секунд перед продолжением...')
            await sleep(10000)
            return false; // не останавливаемся
        } else {
            console.log('🛑 Блок повторился 3 раза. Останавливаем скрипт, можно запустить снова позже.')
            return true; // сигнал к остановке
        }
    }

    return false;
}
