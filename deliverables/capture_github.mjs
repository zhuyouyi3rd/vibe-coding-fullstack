import { chromium } from '../blog/node_modules/playwright-core/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const base = 'https://github.com/zhuyouyi3rd/vibe-coding-fullstack';
const pages = [
  ['github-pr-merged', `${base}/pull/1`],
  ['github-repo', base],
  ['github-commits', `${base}/commits/master`],
  ['github-branches', `${base}/branches`],
];
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});

for (const [name, url] of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1.5 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(root, `${name}.png`) });
  console.log(name, await page.title());
  await page.close();
}
await browser.close();
