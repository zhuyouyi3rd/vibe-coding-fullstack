import { chromium } from '../blog/node_modules/playwright-core/index.mjs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});

for (const name of ['db', 'db-shop', 'api', 'git']) {
  const page = await browser.newPage({ viewport: { width: 1754, height: 1240 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(root, `evidence-${name}.html`)).href, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(root, `evidence-${name}.png`) });
  console.log('shot', name);
  await page.close();
}

await browser.close();
