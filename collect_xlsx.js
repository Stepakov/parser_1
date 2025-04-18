import fs from 'fs-extra';
import path from 'path';
import xlsx from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const resultsDir = path.join(__dirname, 'results');
const outputFile = path.join(__dirname, 'all_products.xlsx');

async function createExcelFromJsonFiles() {
    const files = await fs.readdir(resultsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    let allProducts = [];

    for (const file of jsonFiles) {
        const filePath = path.join(resultsDir, file);
        try {
            const content = await fs.readJson(filePath);
            if (Array.isArray(content)) {
                allProducts.push(...content);
            } else {
                console.warn(`⚠️ Файл ${file} не является массивом`);
            }
        } catch (err) {
            console.error(`❌ Не удалось прочитать файл ${file}:`, err.message);
        }
    }

    if (allProducts.length === 0) {
        console.log('⛔ Нет товаров для экспорта');
        return;
    }

    const worksheet = xlsx.utils.json_to_sheet(allProducts);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');

    xlsx.writeFile(workbook, outputFile);
    console.log(`✅ Excel-файл успешно создан: ${outputFile}`);
}

createExcelFromJsonFiles();
