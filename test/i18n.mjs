// Every language: no missing strings, no page errors, and screenshots of the
// widest screens (menu, level-up, staff, game over) to eyeball overflow.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'test', 'shots', 'i18n');
await mkdir(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  try {
    const p = join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${server.address().port}/`);
await page.waitForFunction(() => window.__db);
let bad = 0;
for (const code of ['zh', 'ru', 'es', 'pt', 'de']) {
  const missing = await page.evaluate((c) => __db.missingKeys(c), code);
  if (missing.length) { bad++; console.log(code, 'MISSING', missing.join(', ')); }
  await page.evaluate((c) => __db.setLang(c), code);
  await page.screenshot({ path: join(out, `${code}_menu.png`) });
  // Any button whose text is wider than the button itself.
  const overflow = async (where) => {
    const o = await page.evaluate(() => [...document.querySelectorAll('#screen .btn, #screen b, #screen span')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible').map((el) => el.textContent.trim().slice(0, 40)));
    if (o.length) console.log(code, where, 'OVERFLOW', o);
  };
  await overflow('menu');
  await page.evaluate(() => { __db.start('cashier', 4); __db.setAutopilot(true); __db.simulate(200); __db.setAutopilot(false); __db.G.pendingLevels = 1; __db.G.level++; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, `${code}_levelup.png`) });
  await overflow('levelup');
  await page.evaluate(() => { __db.G.pendingLevels = 0; __db.choose(0); __db.G.t = 599.99; __db.simulate(1); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(out, `${code}_over.png`) });
  await page.click('[data-act=staff]');
  await page.screenshot({ path: join(out, `${code}_staff.png`) });
  await page.click('.btn.back');
}
await page.evaluate(() => __db.setLang('en'));
console.log(errors.length ? 'ERRORS ' + [...new Set(errors)].join(' | ') : 'no page errors', bad ? `${bad} languages missing strings` : 'all strings present');
await browser.close(); server.close();
process.exit(errors.length || bad ? 1 : 0);
