import { chromium } from '../blog/node_modules/playwright-core/index.mjs';
const b='https://github.com/zhuyouyi3rd/vibe-coding-fullstack/branches';
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1.5});
await page.goto(b,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(2500);
await page.screenshot({path:'deliverables/github-branches.png'});
console.log(await page.title());
await browser.close();
