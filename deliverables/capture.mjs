import { chromium } from '../blog/node_modules/playwright-core/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'screenshots');
const pages = [
  { name: 'blog-home', url: 'http://127.0.0.1:4000/' },
  { name: 'qa-home', url: 'http://127.0.0.1:4101/' },
  { name: 'shop-home', url: 'http://127.0.0.1:4201/' },
];

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--hide-scrollbars'],
});

for (const item of pages) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    deviceScaleFactor: 1.5,
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(item.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, `${item.name}.png`) });
  console.log(item.name, 'title=', await page.title(), 'errors=', errors.length);
  await page.close();
}

await browser.close();
