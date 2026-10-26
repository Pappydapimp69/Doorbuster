// Headless playtest: loads the game, checks for errors, screenshots, then
// runs bot shifts through the sim to check the run is winnable but not free.
// Usage: node test/playtest.mjs [runs]
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// require() honours NODE_PATH, so a globally installed playwright works too.
const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  try {
    const p = join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const url = `http://localhost:${server.address().port}/`;
const runs = +(process.argv[2] || 6);
const shots = process.env.SHOTS || join(root, 'test', 'shots');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url);
await page.waitForFunction(() => window.__db);
await page.screenshot({ path: join(shots, 'menu.png') });

await page.evaluate(() => { __db.start('stocker', 7); __db.setAutopilot(true); __db.simulate(95); });
await page.waitForTimeout(400);
await page.screenshot({ path: join(shots, 'play.png') });
await page.evaluate(() => __db.simulate(460));
await page.screenshot({ path: join(shots, 'boss.png') });

const chars = ['stocker', 'cashier', 'security', 'janitor'];
const results = [];
for (let i = 0; i < runs; i++) {
  const r = await page.evaluate(([c, s]) => { __db.start(c, s); __db.setAutopilot(true); return __db.simulate(620); }, [chars[i % 4], 100 + i]);
  results.push({ char: chars[i % 4], ...r });
  console.log(`${chars[i % 4].padEnd(9)} t=${r.t.toFixed(0).padStart(3)} ${r.state.padEnd(5)} lv=${r.level} kills=${r.kills} hp=${Math.round(r.hp)} dmg=${r.dmgTaken} boss=${r.boss} by=${JSON.stringify(Object.fromEntries(Object.entries(r.dmgBy).map(([k,v])=>[k,Math.round(v)])))}`);
}
await page.screenshot({ path: join(shots, 'over.png') });
const summary = (rs) => `wins ${rs.filter((r) => r.t >= 600).length}/${rs.length}, median ${rs.map((r) => r.t).sort((a, b) => a - b)[Math.floor(rs.length / 2)].toFixed(0)}s`;
// Veteran: every Break Room perk maxed, to check meta progression makes the shift winnable.
const vet = [];
for (let i = 0; i < runs; i++) {
  vet.push(await page.evaluate(([c, s]) => {
    __db.save.meta = { seniority: 5, insoles: 5, smooth: 5, scanner: 5, caffeine: 5, rerolls: 3, secondWind: 1 };
    __db.start(c, s); __db.setAutopilot(true);
    const r = __db.simulate(620); __db.save.meta = {}; return r;
  }, [chars[i % 4], 500 + i]));
}
console.log('veteran ' + summary(vet) + ' | levels ' + vet.map((r) => r.level).join(','));
const wins = results.filter((r) => r.t >= 600).length;
console.log('fresh   ' + summary(results));
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
