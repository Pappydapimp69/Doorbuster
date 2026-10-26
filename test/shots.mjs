// Gameplay screenshots for the store page and for eyeballing the build.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.SHOTS || join(root, 'test', 'shots');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  try {
    const p = join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://localhost:${server.address().port}/`);
await page.waitForFunction(() => window.__db);
const at = async (char, seed, t, name) => {
  await page.evaluate(([c, s, t]) => {
    __db.save.meta = { seniority: 5, insoles: 5, scanner: 5, caffeine: 5, secondWind: 1 };
    __db.start(c, s); __db.setAutopilot(true); __db.simulate(t); __db.setSpeed(1);
  }, [char, seed, t]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: join(out, name + '.png') });
};
await at('stocker', 3, 45, 'early');
await at('cashier', 4, 250, 'mid');
await at('janitor', 9, 548, 'bossfight');
await page.evaluate(() => { __db.G.pendingLevels = 1; });
await page.waitForTimeout(300);
await page.screenshot({ path: join(out, 'levelup.png') });
await browser.close(); server.close();
