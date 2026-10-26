// Fast balance batch: node test/balance.mjs MODE FIRST_SEED COUNT [riot]
// MODE: fresh | veteran | floor | electronics | toys. Run several in parallel.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [mode = 'fresh', first = '100', count = '10', riot = ''] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  try {
    const p = join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/${riot ? '?riot' : ''}`);
await page.waitForFunction(() => window.__db);
const chars = ['stocker', 'cashier', 'security', 'janitor'];
const out = [];
for (let i = 0; i < +count; i++) {
  out.push(await page.evaluate(([mode, c, s]) => {
    const maxed = mode !== 'fresh';
    __db.save.meta = maxed ? { seniority: 5, insoles: 5, smooth: 5, scanner: 5, caffeine: 5, rerolls: 3, secondWind: 1 } : {};
    __db.save.unlockedWeapons = maxed ? { giftCard: 1, extinguisher: 1, alarm: 1, chicken: 1 } : {};
    __db.start(c, s, ['electronics', 'toys'].includes(mode) ? mode : 'floor'); __db.setAutopilot(true);
    const r = __db.simulate(620);
    return { t: Math.round(r.t), win: r.t >= 600, restocks: r.restocks, riots: r.riots, riotTime: r.riotTime };
  }, [mode, chars[i % 4], +first + i]));
}
console.log(JSON.stringify({ mode, riot: !!riot, runs: out }));
await browser.close(); server.close();
