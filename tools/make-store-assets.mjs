// Renders Steam capsules, screenshots and a gameplay trailer into store/.
// Usage: node tools/make-store-assets.mjs   (needs ffmpeg for the trailer)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, rename, readdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'store');
await rm(join(out, 'screenshots'), { recursive: true, force: true }); // numbering changes between runs
await mkdir(join(out, 'screenshots'), { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  try {
    const p = join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}/`;
const browser = await chromium.launch();

// Steam's required capsule sizes.
const CAPSULES = [
  ['header_capsule', 920, 430, 'header'], ['small_capsule', 462, 174, 'small'], ['main_capsule', 1232, 706, 'main'],
  ['vertical_capsule', 748, 896, 'vertical'], ['library_capsule', 600, 900, 'library'],
  ['library_hero', 3840, 1240, 'hero'], ['library_logo', 1280, 720, 'logo'],
];
for (const [name, w, h, kind] of CAPSULES) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${base}tools/store-art.html?w=${w}&h=${h}&kind=${kind}`);
  await page.waitForFunction(() => window.done);
  await page.screenshot({ path: join(out, name + '.png'), omitBackground: kind === 'logo' });
  await page.close();
  console.log('capsule', name);
}

const META = { seniority: 5, insoles: 5, smooth: 5, scanner: 5, caffeine: 5, secondWind: 1 };
async function stage(page, char, seed, t, map = 'floor') {
  await page.evaluate(([c, s, t, m, meta]) => {
    __db.save.meta = meta; __db.save.settings.damageNumbers = true; __db.save.tutorialSeen = true;
    document.getElementById('toasts').style.display = 'none'; // no achievement popups in store shots
    __db.start(c, s, m); __db.setAutopilot(true); __db.simulate(t); __db.setSpeed(1);
  }, [char, seed, t, map, META]);
}

// Screenshots at 1920x1080.
const shotPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await shotPage.goto(base);
await shotPage.waitForFunction(() => window.__db);
await shotPage.screenshot({ path: join(out, 'screenshots', '01_title.png') });
const SHOTS = [['cashier', 6, 150, 'toys'], ['stocker', 3, 70, 'floor'], ['cashier', 4, 230, 'floor'], ['security', 11, 400, 'floor'], ['janitor', 9, 550, 'floor'], ['cashier', 5, 200, 'electronics']];
let i = 2;
for (const [c, s, t, m] of SHOTS) {
  await stage(shotPage, c, s, t, m);
  await shotPage.waitForTimeout(900);
  if (await shotPage.evaluate(() => __db.state) !== 'play') continue;
  await shotPage.screenshot({ path: join(out, 'screenshots', `${String(i++).padStart(2, '0')}_${m}_${t}s.png`) });
  console.log('screenshot', c, t, m);
}
await stage(shotPage, 'cashier', 4, 120);
await shotPage.evaluate(() => { __db.G.pendingLevels = 1; __db.G.level++; });
await shotPage.waitForTimeout(400);
await shotPage.screenshot({ path: join(out, 'screenshots', `${String(i++).padStart(2, '0')}_levelup.png`) });
await shotPage.close();

// Trailer: real-time gameplay recorded at 960x540 (exact 2x of the game),
// upscaled with nearest-neighbour so the pixels stay sharp, then the capsule as an end card.
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  const vidDir = join(out, 'tmp-video');
  await rm(vidDir, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, recordVideo: { dir: vidDir, size: { width: 960, height: 540 } } });
  const page = await ctx.newPage();
  await page.goto(base);
  await page.waitForFunction(() => window.__db);
  const t0 = Date.now();
  const cuts = [];
  // Cold open on a packed floor, then escalate: flash sale, late game, electronics, boss, clock-out.
  for (const [c, s, t, m, secs] of [['janitor', 9, 240, 'floor', 5], ['cashier', 4, 178, 'floor', 6], ['security', 11, 430, 'floor', 6],
    ['cashier', 5, 175, 'electronics', 5], ['janitor', 9, 541, 'floor', 8]]) {
    await stage(page, c, s, t, m);
    await page.evaluate(() => { __db.setAutopilot(true); __db.G.texts.length = 0; });
    cuts.push((Date.now() - t0) / 1000);
    await page.waitForTimeout(secs * 1000);
  }
  await page.evaluate(() => { __db.G.t = 599.5; });
  cuts.push((Date.now() - t0) / 1000);
  await page.waitForTimeout(3000);
  const end = (Date.now() - t0) / 1000;
  await ctx.close();
  const [webm] = (await readdir(vidDir)).filter((f) => f.endsWith('.webm'));
  // Keep each segment but drop the frame or two where the stage jumps.
  const segs = cuts.map((s, k) => [s + 0.15, k + 1 < cuts.length ? cuts[k + 1] : end]);
  const filter = segs.map(([a, b], k) => `[0:v]trim=${a.toFixed(2)}:${b.toFixed(2)},setpts=PTS-STARTPTS,scale=1920:1080:flags=neighbor,fps=30[v${k}]`).join(';')
    + `;[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x15141c,setsar=1,fps=30,trim=0:3,setpts=PTS-STARTPTS[end]`
    + ';' + segs.map((_, k) => `[v${k}]`).join('') + `[end]concat=n=${segs.length + 1}:v=1:a=0[out]`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(vidDir, webm), '-loop', '1', '-t', '3', '-i', join(out, 'main_capsule.png'),
    '-filter_complex', filter, '-map', '[out]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', join(out, 'trailer_raw.mp4')]);
  await rm(vidDir, { recursive: true, force: true });
  console.log('trailer store/trailer_raw.mp4 (silent; add music/SFX in an editor)');
} catch (e) {
  console.log('trailer skipped:', e.message);
}

await browser.close();
server.close();
