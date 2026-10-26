import {
  RUN_SECONDS, SHIFT_START_MIN, SHIFT_GAME_MINUTES, BOSS_AT, MAX_WEAPONS, MAX_PASSIVES, MAX_LEVEL,
  WEAPONS, PASSIVES, EVOLUTIONS, ENEMIES, CHARACTERS, META, MAPS as STAGES, UNLOCKS,
} from './data.js';
import { SPR, buildSprites, SHIRT_COUNT } from './sprites.js';
import { initAudio, sfx, startMusic, stopMusic, audio, setVolumes, currentSong } from './audio.js';
import { loadSave, writeSave } from './save.js';
import { unlockAchievement } from './steam.js';
import { T, setLang, lang, detectLang, LANGS, missingKeys } from './i18n.js';

const W = 480, H = 270, STEP = 1 / 60;
const canvas = document.getElementById('game');
const cx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;
cx.imageSmoothingEnabled = false;

const $ = (s) => document.querySelector(s);
const ui = { hud: $('#hud'), screen: $('#screen'), banner: $('#banner') };

const ICONS = {
  priceGun: '🏷️', boxCutter: '✂️', carts: '🛒', wetFloor: '💧', paSystem: '📢', couponStorm: '🎟️', barcode: '📟',
  giftCard: '🎁', extinguisher: '🧯', alarm: '🚨', chicken: '🍗',
  shoes: '👟', energy: '🥤', nameTag: '📛', lanyard: '🪪', overtime: '⏰', union: '💳',
};

// Demo build (Steam Next Fest): ?demo in the browser, or DOORBUSTER_DEMO / demo.flag on desktop.
const DEMO = new URLSearchParams(location.search).has('demo') || !!window.desktop?.demo;
const DEMO_STAFF = ['stocker', 'cashier'];

let save = loadSave();
let state = 'menu';
let G = null;
let speed = 1, autopilot = false;
let rng = Math.random;

// ---------- utils ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = (a, b) => a + rng() * (b - a);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function weighted(table) {
  let sum = 0;
  for (const k in table) sum += table[k];
  let r = rng() * sum;
  for (const k in table) { r -= table[k]; if (r <= 0) return k; }
  return Object.keys(table)[0];
}

// ---------- bitmap digits for damage numbers ----------
const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
  '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
const digitCache = {};
function digitSprite(d, color) {
  const key = d + color;
  if (digitCache[key]) return digitCache[key];
  const c = document.createElement('canvas'); c.width = 4; c.height = 6;
  const x = c.getContext('2d');
  x.fillStyle = '#000';
  for (let i = 0; i < 15; i++) if (DIGITS[d][i] === '1') x.fillRect((i % 3) + 1, Math.floor(i / 3) + 1, 1, 1);
  x.fillStyle = color;
  for (let i = 0; i < 15; i++) if (DIGITS[d][i] === '1') x.fillRect(i % 3, Math.floor(i / 3), 1, 1);
  return (digitCache[key] = c);
}
function drawNumber(n, x, y, color) {
  const s = String(n);
  let px = Math.round(x - s.length * 2);
  for (const ch of s) { cx.drawImage(digitSprite(+ch, color), px, Math.round(y)); px += 4; }
}

// ---------- input ----------
const keys = new Set();
const pressed = new Set();
addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser/OS chords alone
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(e.key)) e.preventDefault();
  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
  ensureAudio();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); if (state === 'play') pause(); });
addEventListener('gamepaddisconnected', () => { if (state === 'play') pause(); });
addEventListener('pointerdown', () => ensureAudio());

// Browsers only allow audio after a gesture; the menu theme starts on the first one.
let audioReady = false;
function ensureAudio() {
  initAudio();
  if (!audioReady && state === 'menu') startMusic('menu');
  audioReady = true;
}

let padPrev = {};
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const p = pads && [...pads].find(Boolean);
  const out = { x: 0, y: 0 };
  if (!p) return out;
  const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
  if (Math.hypot(ax, ay) > 0.2) { out.x = ax; out.y = ay; }
  const btn = (i) => p.buttons[i] && p.buttons[i].pressed;
  const map = { 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 0: 'Enter', 1: 'Escape', 9: 'Escape', 2: 'KeyR' };
  for (const [i, code] of Object.entries(map)) {
    const now = btn(+i);
    if (now && !padPrev[i]) { pressed.add(code); initAudio(); }
    padPrev[i] = now;
  }
  if (btn(12)) out.y = -1; if (btn(13)) out.y = 1; if (btn(14)) out.x = -1; if (btn(15)) out.x = 1;
  // Stick as menu navigation, edge-triggered.
  const sy = ay > 0.6 ? 1 : ay < -0.6 ? -1 : 0, sx = ax > 0.6 ? 1 : ax < -0.6 ? -1 : 0;
  if (sy !== padPrev.sy && sy) pressed.add(sy > 0 ? 'ArrowDown' : 'ArrowUp');
  if (sx !== padPrev.sx && sx) pressed.add(sx > 0 ? 'ArrowRight' : 'ArrowLeft');
  padPrev.sy = sy; padPrev.sx = sx;
  return out;
}

// ---------- stats ----------
function metaLv(id) { return save.meta[id] || 0; }

function computeStats() {
  const ch = CHARACTERS[G.char];
  const s = { maxHp: 100, speed: 72, magnet: 40, armor: 0, cooldown: 0, xp: 1, greed: 1, area: 1 };
  const m = ch.mods;
  s.maxHp += (m.maxHp || 0) + metaLv('seniority') * META.seniority.per;
  s.armor += (m.armor || 0);
  let spd = 1 + (m.speed || 0) + metaLv('insoles') * META.insoles.per;
  let mag = 1 + (m.magnet || 0);
  let cd = (m.cooldown || 0) + metaLv('caffeine') * META.caffeine.per;
  let xp = 1 + (m.xp || 0) + metaLv('scanner') * META.scanner.per;
  s.greed += metaLv('smooth') * META.smooth.per;
  for (const [id, lv] of Object.entries(G.passives)) {
    const p = PASSIVES[id];
    if (p.stat === 'speed') spd += p.per * lv;
    if (p.stat === 'cooldown') cd += p.per * lv;
    if (p.stat === 'maxHp') s.maxHp += p.per * lv;
    if (p.stat === 'magnet') mag += p.per * lv;
    if (p.stat === 'xp') xp += p.per * lv;
    if (p.stat === 'armor') s.armor += p.per * lv;
  }
  s.speed *= spd; s.magnet *= mag; s.cooldown = Math.min(cd, 0.6); s.xp = xp;
  return s;
}

function refreshStats() {
  const old = G.stats ? G.stats.maxHp : null;
  G.stats = computeStats();
  if (old !== null && G.stats.maxHp > old) G.player.hp += G.stats.maxHp - old;
  G.player.hp = Math.min(G.player.hp, G.stats.maxHp);
}

// ---------- run setup ----------
function newRun(charId = save.selected, seed = (Math.random() * 2 ** 31) | 0, map = save.map || 'floor') {
  rng = mulberry32(seed);
  G = {
    seed, char: charId, map, stage: STAGES[map], overtime: false, otStart: 0, paid: false, t: 0, level: 1, xp: 0, xpNeed: xpFor(1), pendingLevels: 0,
    player: { x: 0, y: 0, hp: 100, inv: 0, face: 1, fx: 1, fy: 0, anim: 0, moving: false },
    enemies: [], projs: [], eprojs: [], lobs: [], gems: [], drops: [], puddles: [], fx: [], texts: [], parts: [],
    weapons: [], passives: {}, kills: 0, dmgTaken: 0, tipsRun: 0, combo: 0, comboT: 0,
    rerolls: metaLv('rerolls'), revives: metaLv('secondWind'), banished: new Set(),
    spawnAcc: 0, events: new Set(), boss: null, bossDead: false, shake: 0, hitstop: 0,
    nextAnnounce: 25, dmgBy: {}, dmgDealt: {}, evolved: 0, choices: null, grid: new Map(),
  };
  G.stats = computeStats();
  G.player.hp = G.stats.maxHp;
  addWeapon(CHARACTERS[charId].weapon);
  // Opening crowd at the doors.
  for (let i = 0; i < 12; i++) spawnEnemy('shopper', -Math.PI / 2 + rand(-0.6, 0.6), rand(150, 200));
}

function xpFor(L) { return L < 20 ? 4 + (L - 1) * 6 : 118 + (L - 20) * 12 + (L - 20) ** 2; }

function addWeapon(id) {
  G.weapons.push({ id, lv: 1, cd: 0.3, evolved: false, ang: 0 });
  if (G.weapons.length >= MAX_WEAPONS) achieve('FULL_ARSENAL');
}
function wstats(w) { return w.evolved ? EVOLUTIONS[w.id].stats : WEAPONS[w.id].lv[w.lv - 1]; }

// ---------- spatial hash ----------
const CELL = 32;
function rebuildGrid() {
  G.grid.clear();
  for (const e of G.enemies) {
    const k = ((Math.floor(e.x / CELL)) * 73856093) ^ ((Math.floor(e.y / CELL)) * 19349663);
    let b = G.grid.get(k);
    if (!b) G.grid.set(k, (b = []));
    b.push(e);
  }
}
function nearby(x, y, r, out = []) {
  out.length = 0;
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
  const y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
  for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) {
    const b = G.grid.get((i * 73856093) ^ (j * 19349663));
    if (b) for (const e of b) out.push(e);
  }
  return out;
}
const tmp = [], tmp2 = [];

// ---------- enemies ----------
function hpScale() {
  const ot = G.overtime ? ((G.t - G.otStart) / 90) ** 2 : 0; // overtime climbs until it wins
  return 1 + G.t / 170 + (G.t / 360) ** 2 + ot;
}

function spawnEnemy(type, ang = rand(0, Math.PI * 2), d = rand(270, 310)) {
  const def = ENEMIES[type];
  const p = G.player;
  const scale = def.boss ? 1 : hpScale() * G.stage.hpMul;
  const e = {
    type, def, x: p.x + Math.cos(ang) * d, y: p.y + Math.sin(ang) * d,
    hp: def.hp * scale, maxHp: def.hp * scale, speed: def.speed * rand(0.9, 1.1) * G.stage.speedMul, r: def.r,
    vx: 0, vy: 0, kx: 0, ky: 0, flash: 0, slow: 0, hit: {}, var: Math.floor(rng() * SHIRT_COUNT),
    t: rand(0, 3), charging: 0, cdx: 0, cdy: 0, dead: false, face: 1,
  };
  G.enemies.push(e);
  return e;
}

function director(dt) {
  const t = G.t;
  const minute = Math.min(9, Math.floor(t / 60));
  const target = Math.min(G.overtime ? 520 : 400, 14 + t * 0.55);
  const rate = 2.2 + t / 16;
  {
    // Bosses get the floor to themselves, mostly: the crowd thins but never stops.
    G.spawnAcc += rate * dt * (G.boss && !G.bossDead ? 0.35 : 1);
    while (G.spawnAcc >= 1) {
      G.spawnAcc -= 1;
      if (G.enemies.length < target) spawnEnemy(weighted(G.stage.waves[minute]));
    }
  }
  const once = (key, at, fn) => { if (t >= at && !G.events.has(key)) { G.events.add(key); fn(); } };
  once('rush', 60, () => {
    announce(T('ui.rush'), true);
    const a = rand(0, Math.PI * 2);
    for (let i = 0; i < 45; i++) spawnEnemy('walker', a + rand(-0.4, 0.4), rand(260, 340));
  });
  for (const [k, at] of [['sale1', 180], ['sale2', 360], ['sale3', 480]]) once(k, at, () => {
    announce(T('ui.flashSale'), true);
    // A ring with one gap: it's a test of spotting the exit, not a death sentence.
    const n = 50 + Math.floor(at / 8), gap = rand(0, Math.PI * 2);
    for (let i = 0; i < n; i++) {
      const a = gap + 0.7 + (i / n) * (Math.PI * 2 - 1.4);
      spawnEnemy(at > 400 ? 'walker' : 'shopper', a, 230);
    }
  });
  for (const at of [120, 240, 360, 450]) once('elite' + at, at, () => {
    announce(T('ui.elite'), true);
    spawnEnemy('requester');
  });
  once('boss', BOSS_AT, () => spawnBoss(1));
  // Overtime: a fresh manager every two minutes, each one tougher.
  if (G.overtime) {
    const n = Math.floor((t - G.otStart) / 120);
    once('otboss' + n, G.otStart + n * 120 + 60, () => spawnBoss(1.5 + n * 0.75));
  }
  if (t >= G.nextAnnounce) { G.nextAnnounce = t + rand(35, 60); announce(pick(T('announcements'))); }
}

function bossName() { return T(`maps.${G.map}.boss`); }

function spawnBoss(mult) {
  announce(T('ui.bossHere', { boss: bossName().toUpperCase() }), true);
  sfx('boss');
  const b = spawnEnemy('boss', rand(0, Math.PI * 2), 220);
  b.hp = b.maxHp = ENEMIES.boss.hp * G.stage.bossHp * mult;
  b.var = Object.keys(STAGES).indexOf(G.map);
  G.boss = b; G.bossDead = false;
  startMusic('boss');
  G.shake = Math.max(G.shake, 0.8);
}

function updateEnemies(dt) {
  const p = G.player;
  for (const e of G.enemies) {
    e.t += dt;
    e.flash = Math.max(0, e.flash - dt);
    e.slow = Math.max(0, e.slow - dt);
    let dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    let sp = e.speed * (e.slow > 0 ? 0.5 : 1);
    let mx = dx, my = dy;
    if (e.def.ranged) {
      if (d < 100) { mx = -dx * 0.6; my = -dy * 0.6; } else if (d < 130) { mx = 0; my = 0; }
      // Only shoot from on screen, so every shot can be seen coming.
      const onScreen = Math.abs(e.x - p.x) < W / 2 - 8 && Math.abs(e.y - p.y) < H / 2 - 8;
      if (e.t > 3.6 && onScreen && d < 170 && G.eprojs.length < 18) {
        e.t = rand(0, 0.8);
        G.eprojs.push({ x: e.x, y: e.y, vx: dx * 80, vy: dy * 80, dmg: e.def.dmg, life: 4, r: 3, kind: 'coupon' });
      }
    }
    if (e.def.charge) {
      if (e.charging > 0) { e.charging -= dt; mx = e.cdx; my = e.cdy; sp = e.speed * 4; }
      else if (e.t > 4 && d < 160) { e.t = 0; e.charging = 0.7; e.cdx = dx; e.cdy = dy; }
    }
    if (e.type === 'requester' && e.t > 8) {
      e.t = 0;
      for (let i = 0; i < 3; i++) {
        const s = spawnEnemy('shopper', 0, 0); s.x = e.x + rand(-20, 20); s.y = e.y + rand(-20, 20);
      }
    }
    if (e.def.boss) bossAI(e, dt, dx, dy, d);
    e.vx = mx * sp; e.vy = my * sp;
    e.x += (e.vx + e.kx) * dt; e.y += (e.vy + e.ky) * dt;
    e.kx *= Math.pow(0.002, dt); e.ky *= Math.pow(0.002, dt);
    if (Math.abs(dx) > 0.1) e.face = dx > 0 ? 1 : -1;
    // Recycle shoppers that fall far behind so the crowd stays around you.
    if (d > 420 && !e.def.elite && !e.def.boss) {
      const a = Math.atan2(p.y - e.y, p.x - e.x) + rand(-0.5, 0.5);
      e.x = p.x + Math.cos(a) * 290; e.y = p.y + Math.sin(a) * 290;
    }
  }
  // Separation: shoppers don't stack into one blob.
  rebuildGrid();
  for (const e of G.enemies) {
    nearby(e.x, e.y, 16, tmp);
    let n = 0;
    for (const o of tmp) {
      if (o === e) continue;
      const ddx = e.x - o.x, ddy = e.y - o.y, rr = e.r + o.r;
      const dd = ddx * ddx + ddy * ddy;
      if (dd < rr * rr && dd > 0.0001) {
        const k = (rr - Math.sqrt(dd)) * 0.5 / Math.sqrt(dd);
        const wE = e.def.boss ? 0.05 : 1;
        e.x += ddx * k * wE; e.y += ddy * k * wE;
        if (++n > 6) break;
      }
    }
  }
  // Contact damage.
  if (p.inv <= 0) {
    nearby(p.x, p.y, 24, tmp);
    for (const e of tmp) {
      const rr = e.r + 5;
      if (dist2(e, p) < rr * rr) { hurtPlayer(e.def.dmg * (e.def.boss ? 1 : 1 + G.t / 600) * (G.overtime ? 1 + (G.t - G.otStart) / 120 : 1), e.type); break; }
    }
  }
}

function bossAI(e, dt, dx, dy, d) {
  e.bt = (e.bt || 0) + dt;
  e.dashT = (e.dashT || 0) + dt;
  if (e.bt > 3.5) {
    e.bt = 0;
    const n = e.hp < e.maxHp / 2 ? 18 : 12;
    const off = rand(0, 1);
    for (let i = 0; i < n; i++) {
      const a = (i + off) / n * Math.PI * 2;
      G.eprojs.push({ x: e.x, y: e.y, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, dmg: 14, life: 5, r: 4, kind: 'memo' });
    }
  }
  if (e.dashT > 6 && d < 200) {
    e.dashT = 0; e.charging = 0.6; e.cdx = dx; e.cdy = dy;
    announce(T('ui.circleBack'));
  }
  if (e.charging > 0) { e.charging -= dt; e.x += e.cdx * 220 * dt; e.y += e.cdy * 220 * dt; }
  // Can't be kited off forever: closes distance fast when left behind.
  e.speed = ENEMIES.boss.speed * (d > 180 ? 2.4 : 1) * (G.overtime ? 1.3 : 1);
}

function hurtPlayer(raw, src = '?') {
  const p = G.player;
  if (G.dying) return;
  G.dmgBy[src] = (G.dmgBy[src] || 0) + raw;
  const dmg = Math.max(1, Math.round(raw - G.stats.armor));
  p.hp -= dmg; p.inv = 0.6; G.dmgTaken += dmg;
  G.shake = Math.max(G.shake, 0.35);
  G.hurtFlash = 1;
  sfx('hurt');
  G.texts.push({ x: p.x, y: p.y - 14, v: dmg, life: 0.7, color: '#ff5a5a' });
  if (p.hp <= 0) {
    if (G.revives > 0) {
      G.revives--; p.hp = G.stats.maxHp * 0.5; p.inv = 2;
      announce(T('ui.secondWind'), true);
      for (const e of G.enemies) if (!e.def.boss && dist2(e, p) < 120 * 120) damageEnemy(e, 9999, 0, 0, 0);
    } else if (!G.dying) { G.dying = 1.2; G.player.hp = 0; sfx('hurt'); G.shake = 1; }
  }
}

let curSrc = '?';
function damageEnemy(e, dmg, kx, ky, knock) {
  if (e.dead) return;
  G.dmgDealt[curSrc] = (G.dmgDealt[curSrc] || 0) + Math.min(dmg, Math.max(0, e.hp));
  e.hp -= dmg;
  e.flash = 0.08;
  const res = e.def.knockResist || 0;
  e.kx += kx * knock * (1 - res); e.ky += ky * knock * (1 - res);
  if (save.settings.damageNumbers && G.texts.length < 40) {
    G.texts.push({ x: e.x + rand(-3, 3), y: e.y - e.r - 4, v: Math.round(dmg), life: 0.4, color: dmg >= 40 ? '#ffd23f' : '#ffffff' });
  }
  sfx('hit');
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  e.dead = true;
  G.kills++;
  sfx('kill');
  G.combo++; G.comboT = 1.2;
  const n = e.def.boss ? 40 : e.def.elite ? 14 : 4;
  for (let i = 0; i < n; i++) {
    G.parts.push({ x: e.x, y: e.y, vx: rand(-60, 60), vy: rand(-80, 20), life: rand(0.3, 0.6), c: pick(['#f3f1ea', '#f5d142', '#e86a9a', '#68b6ea']) });
  }
  if (e.def.xp) dropGem(e.x, e.y, e.def.xp);
  if (e.def.splits) for (let i = 0; i < e.def.splits; i++) {
    const s = spawnEnemy('shopper', 0, 0); s.x = e.x + rand(-8, 8); s.y = e.y + rand(-8, 8);
  }
  if (rng() < 0.03 * G.stats.greed) G.drops.push({ x: e.x, y: e.y, kind: 'coin', v: 1 });
  if (rng() < 0.006 && G.drops.filter((d) => d.kind === 'heart').length < 6) G.drops.push({ x: e.x, y: e.y, kind: 'heart' });
  if (e.def.elite) {
    G.drops.push({ x: e.x, y: e.y, kind: 'box' });
    G.hitstop = 0.06;
  }
  if (e.def.boss) {
    G.bossDead = true;
    startMusic(G.overtime ? 'overtime' : 'shift');
    G.drops.push({ x: e.x, y: e.y, kind: 'coin', v: 100 });
    announce(T('ui.bossGone', { boss: bossName() }), true);
    achieve('BOSS_DOWN');
    save.stats.bossKills++;
    G.shake = 1; G.hitstop = 0.25;
  }
}

function dropGem(x, y, v) {
  if (G.gems.length > 220) {
    // Fold into an existing far gem instead of growing the list.
    const g = G.gems[Math.floor(rng() * G.gems.length)];
    g.v += v; return;
  }
  G.gems.push({ x: x + rand(-3, 3), y: y + rand(-3, 3), v, pull: false, vx: 0, vy: 0 });
}

// ---------- weapons ----------
function closestEnemies(n, range = 260) {
  const p = G.player;
  const list = [];
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d = dist2(e, p);
    if (d < range * range) list.push([d, e]);
  }
  list.sort((a, b) => a[0] - b[0]);
  return list.slice(0, n).map((a) => a[1]);
}

function fireWeapon(w) {
  const s = wstats(w), p = G.player;
  switch (w.id) {
    case 'priceGun': {
      const targets = closestEnemies(s.count);
      if (!targets.length) return false;
      for (let i = 0; i < s.count; i++) {
        const t = targets[i % targets.length];
        const a = Math.atan2(t.y - p.y, t.x - p.x) + (i >= targets.length ? rand(-0.3, 0.3) : 0);
        G.projs.push({ x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, dmg: s.dmg, pierce: s.pierce, r: 3, life: 1.4, kind: 'sticker', hits: new Set() });
      }
      sfx('shoot');
      return true;
    }
    case 'boxCutter': {
      const near = closestEnemies(1, s.range * 1.6)[0];
      const aim = near ? Math.atan2(near.y - p.y, near.x - p.x) : Math.atan2(p.fy, p.fx);
      for (let i = 0; i < s.arcs; i++) {
        const ang = aim + i * Math.PI;
        G.fx.push({ kind: 'arc', x: p.x, y: p.y, ang, range: s.range, life: 0.18, max: 0.18 });
        for (const q of G.eprojs) if (q.kind === 'coupon' && dist2(q, p) < (s.range + 4) ** 2) q.life = 0;
        nearby(p.x, p.y, s.range + 10, tmp);
        for (const e of tmp) {
          const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
          if (d > s.range + e.r) continue;
          let da = Math.atan2(dy, dx) - ang;
          da = Math.atan2(Math.sin(da), Math.cos(da));
          if (Math.abs(da) < 1.1) damageEnemy(e, s.dmg, dx / (d || 1), dy / (d || 1), 90);
        }
      }
      sfx('slash');
      return true;
    }
    case 'wetFloor': {
      for (let i = 0; i < s.count; i++) {
        const t = closestEnemies(8, 200);
        const target = t.length ? pick(t) : { x: p.x + rand(-60, 60), y: p.y + rand(-60, 60) };
        G.puddles.push({ x: target.x + rand(-10, 10), y: target.y + rand(-10, 10), r: s.size * G.stats.area, life: s.dur, max: s.dur, dmg: s.dmg, tick: 0 });
      }
      return true;
    }
    case 'paSystem': {
      G.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 4, maxR: s.radius, life: 0.4, max: 0.4, dmg: s.dmg, knock: s.knock, hits: new Set() });
      sfx('pa');
      return true;
    }
    case 'couponStorm': {
      for (let i = 0; i < s.count; i++) {
        const a = (i / s.count) * Math.PI * 2 + rand(0, 1);
        G.projs.push({ x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, dmg: s.dmg, pierce: 1, r: 3, life: 3, kind: 'coupon', homing: true, sp: s.speed, hits: new Set() });
      }
      return true;
    }
    case 'barcode': {
      const targets = closestEnemies(s.beams, 220);
      for (let i = 0; i < s.beams; i++) {
        const t = targets[i];
        const ang = t ? Math.atan2(t.y - p.y, t.x - p.x) : rand(0, Math.PI * 2);
        G.fx.push({ kind: 'beam', x: p.x, y: p.y, ang, len: s.length, life: 0.25, max: 0.25 });
        const ux = Math.cos(ang), uy = Math.sin(ang);
        for (const e of G.enemies) {
          const dx = e.x - p.x, dy = e.y - p.y;
          const along = dx * ux + dy * uy;
          if (along < 0 || along > s.length) continue;
          const perp = Math.abs(dx * uy - dy * ux);
          if (perp < 5 + e.r) damageEnemy(e, s.dmg, ux, uy, 40);
        }
      }
      sfx('laser');
      return true;
    }
    case 'giftCard': {
      const t = closestEnemies(1, 220)[0];
      const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.fy, p.fx);
      for (let i = 0; i < s.count; i++) {
        const a = base + (i - (s.count - 1) / 2) * 0.5;
        G.projs.push({ x: p.x, y: p.y, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed, dmg: s.dmg, pierce: 999, r: 4,
          life: 5, kind: 'card', range: s.range, sp: s.speed, travel: 0, back: false, hits: new Set(), spin: 0 });
      }
      sfx('shoot');
      return true;
    }
    case 'extinguisher': {
      const t = closestEnemies(1, s.range * 1.5)[0];
      if (!t) return false;
      const ang = Math.atan2(t.y - p.y, t.x - p.x);
      nearby(p.x, p.y, s.range + 10, tmp);
      for (const e of tmp) {
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
        if (d > s.range + e.r) continue;
        let da = Math.atan2(dy, dx) - ang; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < s.width) { e.slow = 1.2; damageEnemy(e, s.dmg, dx / (d || 1), dy / (d || 1), s.knock); }
      }
      for (let i = 0; i < 26; i++) {
        const a = ang + rand(-s.width, s.width), v = rand(0.4, 1) * s.range * 3;
        G.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.3, c: '#ffffff', float: true });
      }
      sfx('slash');
      return true;
    }
    case 'alarm': {
      let cur = closestEnemies(1, 150)[0];
      if (!cur) return false;
      const pts = [[p.x, p.y]], hit = new Set();
      for (let i = 0; i <= s.chains && cur; i++) {
        hit.add(cur); pts.push([cur.x, cur.y]);
        damageEnemy(cur, s.dmg, 0, 0, 0);
        let best = null, bd = 85 * 85;
        nearby(cur.x, cur.y, 85, tmp);
        for (const e of tmp) { if (hit.has(e) || e.dead) continue; const d = dist2(e, cur); if (d < bd) { bd = d; best = e; } }
        cur = best;
      }
      G.fx.push({ kind: 'chain', pts, life: 0.2, max: 0.2 });
      sfx('laser');
      return true;
    }
    case 'chicken': {
      for (let i = 0; i < s.count; i++) {
        const t = closestEnemies(10, 200);
        const tg = t.length ? pick(t) : { x: p.x + rand(-80, 80), y: p.y + rand(-80, 80) };
        G.lobs.push({ sx: p.x, sy: p.y, tx: tg.x, ty: tg.y, t: 0, dur: 0.6, dmg: s.dmg, r: s.radius * G.stats.area });
      }
      return true;
    }
  }
  return false;
}

function updateWeapons(dt) {
  const p = G.player;
  for (const w of G.weapons) {
    const s = wstats(w);
    if (w.id === 'carts') {
      curSrc = 'carts';
      w.ang += s.spin * dt;
      w.pos = [];
      for (let i = 0; i < s.count; i++) {
        const a = w.ang + (i / s.count) * Math.PI * 2;
        const x = p.x + Math.cos(a) * s.radius, y = p.y + Math.sin(a) * s.radius;
        w.pos.push([x, y, a]);
        nearby(x, y, 14, tmp);
        for (const e of tmp) {
          if ((e.x - x) ** 2 + (e.y - y) ** 2 > (e.r + 6) ** 2) continue;
          const last = e.hit.carts || -9;
          if (G.t - last < 0.35) continue;
          e.hit.carts = G.t;
          const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
          damageEnemy(e, s.dmg, (e.x - p.x) / d, (e.y - p.y) / d, 70);
        }
      }
      continue;
    }
    w.cd -= dt;
    if (w.cd <= 0) {
      curSrc = w.id;
      const n0 = [G.projs.length, G.fx.length, G.puddles.length, G.lobs.length];
      const fired = fireWeapon(w);
      [G.projs, G.fx, G.puddles, G.lobs].forEach((list, i) => { for (let k = n0[i]; k < list.length; k++) list[k].src = w.id; });
      w.cd = fired ? s.cd * (1 - G.stats.cooldown) : 0.1;
    }
  }
}

function updateProjectiles(dt) {
  for (const pr of G.projs) {
    curSrc = pr.src;
    pr.life -= dt;
    if (pr.homing) {
      if (!pr.target || pr.target.dead) {
        let best = null, bd = 200 * 200;
        nearby(pr.x, pr.y, 200, tmp2);
        for (const e of tmp2) { if (pr.hits.has(e)) continue; const d = dist2(e, pr); if (d < bd) { bd = d; best = e; } }
        pr.target = best;
      }
      if (pr.target) {
        const a = Math.atan2(pr.target.y - pr.y, pr.target.x - pr.x);
        const cur = Math.atan2(pr.vy, pr.vx);
        let da = Math.atan2(Math.sin(a - cur), Math.cos(a - cur));
        const na = cur + clamp(da, -8 * dt, 8 * dt);
        pr.vx = Math.cos(na) * pr.sp; pr.vy = Math.sin(na) * pr.sp;
      }
    }
    if (pr.kind === 'card') {
      pr.spin += dt * 20;
      pr.travel += pr.sp * dt;
      if (!pr.back && pr.travel > pr.range) { pr.back = true; pr.hits.clear(); }
      if (pr.back) {
        const p = G.player, dx = p.x - pr.x, dy = p.y - pr.y, d = Math.hypot(dx, dy) || 1;
        pr.vx = dx / d * pr.sp * 1.2; pr.vy = dy / d * pr.sp * 1.2;
        if (d < 8) pr.life = 0;
      }
    }
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    nearby(pr.x, pr.y, 16, tmp);
    for (const e of tmp) {
      if (e.dead || pr.hits.has(e)) continue;
      const rr = e.r + pr.r;
      if (dist2(e, pr) < rr * rr) {
        pr.hits.add(e);
        const sp = Math.hypot(pr.vx, pr.vy) || 1;
        damageEnemy(e, pr.dmg, pr.vx / sp, pr.vy / sp, 50);
        pr.target = null;
        if (--pr.pierce <= 0) { pr.life = 0; break; }
      }
    }
  }
  G.projs = G.projs.filter((p) => p.life > 0);

  for (const l of G.lobs) {
    curSrc = l.src;
    l.t += dt;
    if (l.t >= l.dur) {
      l.done = true;
      G.fx.push({ kind: 'boom', x: l.tx, y: l.ty, r: l.r, life: 0.3, max: 0.3 });
      nearby(l.tx, l.ty, l.r + 10, tmp);
      for (const e of tmp) {
        const d = Math.hypot(e.x - l.tx, e.y - l.ty);
        if (d < l.r + e.r) damageEnemy(e, l.dmg, (e.x - l.tx) / (d || 1), (e.y - l.ty) / (d || 1), 80);
      }
      G.shake = Math.max(G.shake, 0.2);
      sfx('slash');
    }
  }
  G.lobs = G.lobs.filter((l) => !l.done);

  const p = G.player;
  for (const pr of G.eprojs) {
    pr.life -= dt; pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    if (p.inv <= 0 && dist2(pr, p) < (pr.r + 5) ** 2) { pr.life = 0; hurtPlayer(pr.dmg, pr.kind); }
  }
  G.eprojs = G.eprojs.filter((q) => q.life > 0);

  for (const f of G.fx) {
    curSrc = f.src;
    f.life -= dt;
    if (f.kind === 'ring') {
      f.r = f.maxR * (1 - f.life / f.max);
      for (const q of G.eprojs) if (q.kind === 'coupon' && dist2(q, f) < f.r * f.r) q.life = 0;
      nearby(f.x, f.y, f.r + 10, tmp);
      for (const e of tmp) {
        if (f.hits.has(e)) continue;
        const d = Math.hypot(e.x - f.x, e.y - f.y);
        if (d < f.r + e.r) { f.hits.add(e); damageEnemy(e, f.dmg, (e.x - f.x) / (d || 1), (e.y - f.y) / (d || 1), f.knock); }
      }
    }
  }
  G.fx = G.fx.filter((f) => f.life > 0);

  for (const pd of G.puddles) {
    curSrc = pd.src;
    pd.life -= dt; pd.tick -= dt;
    if (pd.tick <= 0) {
      pd.tick = 0.4;
      nearby(pd.x, pd.y, pd.r, tmp);
      for (const e of tmp) if (dist2(e, pd) < pd.r * pd.r) { e.slow = 0.6; damageEnemy(e, pd.dmg, 0, 0, 0); }
    }
  }
  G.puddles = G.puddles.filter((q) => q.life > 0);
}

// ---------- pickups ----------
function updatePickups(dt) {
  const p = G.player, mag = G.stats.magnet;
  for (const g of G.gems) {
    if (!g.pull && dist2(g, p) < mag * mag) g.pull = true;
    if (g.pull) {
      const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy) || 1;
      const sp = 260;
      g.x += (dx / d) * sp * dt; g.y += (dy / d) * sp * dt;
      if (d < 6) { g.dead = true; gainXp(g.v); save.receiptsGot = (save.receiptsGot || 0) + 1; }
    }
  }
  G.gems = G.gems.filter((g) => !g.dead);
  for (const d of G.drops) {
    const near = dist2(d, p) < (d.pull ? 9999999 : (mag * 0.8) ** 2);
    if (near) d.pull = true;
    if (d.pull) {
      const dx = p.x - d.x, dy = p.y - d.y, dd = Math.hypot(dx, dy) || 1;
      d.x += (dx / dd) * 240 * dt; d.y += (dy / dd) * 240 * dt;
      if (dd < 7) {
        d.dead = true;
        if (d.kind === 'coin') { const v = Math.round(d.v * G.stats.greed); G.tipsRun += v; sfx('coin'); G.texts.push({ x: p.x, y: p.y - 16, v, life: 0.8, color: '#f5d142' }); }
        if (d.kind === 'heart') { p.hp = Math.min(G.stats.maxHp, p.hp + 30); sfx('pick'); }
        if (d.kind === 'box') openBox();
      }
    }
  }
  G.drops = G.drops.filter((d) => !d.dead);
}

function gainXp(v) {
  G.xp += v * G.stats.xp;
  sfx('pickup', G.combo);
  while (G.xp >= G.xpNeed) {
    G.xp -= G.xpNeed; G.level++; G.xpNeed = xpFor(G.level); G.pendingLevels++;
  }
}

function openBox() {
  G.tipsRun += 15;
  const evo = readyEvolutions();
  if (evo.length) { applyChoice({ type: 'evo', id: evo[0] }); return; }
  G.pendingLevels++;
  announce(T('ui.lostFound'), true);
}

// ---------- unlocks ----------
function weaponUnlocked(id) { return !UNLOCKS[id] || !!(save.unlockedWeapons && save.unlockedWeapons[id]); }

// Career stats including the run in progress, so milestones pop the moment they're hit.
function liveStat(stat) {
  const st = save.stats;
  if (!G) return st[stat] || 0;
  if (stat === 'bestTime') return Math.max(st.bestTime || 0, G.overtime ? 600 : G.t);
  if (stat === 'totalKills') return (st.totalKills || 0) + G.kills - (G.otKills || 0); // overtime kills only; the shift was banked at 11:00
  if (stat === 'bestLevel') return Math.max(st.bestLevel || 0, G.level);
  return st[stat] || 0;
}

function checkUnlocks() {
  save.unlockedWeapons = save.unlockedWeapons || {};
  for (const [id, u] of Object.entries(UNLOCKS)) {
    if (save.unlockedWeapons[id] || liveStat(u.stat) < u.need) continue;
    save.unlockedWeapons[id] = true;
    writeSave(save);
    toast(`${ICONS[id]} ${T('ui.newStock', { name: T(`weapons.${id}.name`) })}`);
    sfx('coin');
  }
}

function unlockText(id) {
  const u = UNLOCKS[id];
  return T(`ui.unlock.${u.stat}`, { n: u.stat === 'bestTime' ? u.need / 60 : u.need });
}

// ---------- level-up ----------
function readyEvolutions() {
  return G.weapons.filter((w) => !w.evolved && w.lv >= MAX_LEVEL && EVOLUTIONS[w.id] && G.passives[EVOLUTIONS[w.id].needs]).map((w) => w.id);
}

function buildChoices() {
  const pool = [];
  for (const w of G.weapons) if (!w.evolved && w.lv < MAX_LEVEL) pool.push({ type: 'weapon', id: w.id });
  if (G.weapons.length < MAX_WEAPONS) for (const id in WEAPONS) if (weaponUnlocked(id) && !G.weapons.find((w) => w.id === id) && !G.banished.has(id)) pool.push({ type: 'weapon', id });
  for (const id in G.passives) if (G.passives[id] < MAX_LEVEL) pool.push({ type: 'passive', id });
  if (Object.keys(G.passives).length < MAX_PASSIVES) for (const id in PASSIVES) if (!(id in G.passives) && !G.banished.has(id)) pool.push({ type: 'passive', id });
  const out = readyEvolutions().slice(0, 1).map((id) => ({ type: 'evo', id }));
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  if (!out.length) out.push({ type: 'snack' }, { type: 'tips' });
  return out;
}

function choiceInfo(c) {
  if (c.type === 'evo') return { icon: '⭐', title: T(`evolutions.${c.id}.name`), tag: T('ui.tagEvo'), text: T(`evolutions.${c.id}.desc`) };
  if (c.type === 'snack') return { icon: '🌭', title: T('ui.snackTitle'), tag: T('ui.tagHeal'), text: T('ui.snackText') };
  if (c.type === 'tips') return { icon: '💵', title: T('ui.tipsTitle'), tag: T('ui.tagTips'), text: T('ui.tipsText') };
  if (c.type === 'weapon') {
    const w = G.weapons.find((x) => x.id === c.id), name = T(`weapons.${c.id}.name`);
    return w ? { icon: ICONS[c.id], title: name, tag: T('ui.tagLv', { n: w.lv + 1 }), text: T(`weapons.${c.id}.lvText`)[w.lv] }
      : { icon: ICONS[c.id], title: name, tag: T('ui.tagNew'), text: T(`weapons.${c.id}.desc`) };
  }
  const lv = G.passives[c.id];
  return { icon: ICONS[c.id], title: T(`passives.${c.id}.name`), tag: lv ? T('ui.tagLv', { n: lv + 1 }) : T('ui.tagNew'), text: T(`passives.${c.id}.desc`) };
}

function applyChoice(c) {
  if (c.type === 'evo') {
    const w = G.weapons.find((x) => x.id === c.id);
    w.evolved = true; G.evolved++;
    save.evoSeen = { ...(save.evoSeen || {}), [c.id]: true };
    sfx('evolve');
    announce(T('ui.promoted', { name: T(`evolutions.${c.id}.name`).toUpperCase() }), true);
    achieve('EVOLVED');
  } else if (c.type === 'weapon') {
    const w = G.weapons.find((x) => x.id === c.id);
    if (w) w.lv++; else addWeapon(c.id);
  } else if (c.type === 'passive') {
    G.passives[c.id] = (G.passives[c.id] || 0) + 1;
  } else if (c.type === 'snack') {
    G.player.hp = Math.min(G.stats.maxHp, G.player.hp + 40);
  } else if (c.type === 'tips') {
    G.tipsRun += 25;
  }
  refreshStats();
}

// ---------- player ----------
function updatePlayer(dt) {
  const p = G.player;
  let mx = 0, my = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
  const pad = G.pad || { x: 0, y: 0 };
  if (pad.x || pad.y) { mx = pad.x; my = pad.y; }
  if (autopilot) [mx, my] = autoMove();
  if (G.dying) { mx = 0; my = 0; }
  const m = Math.hypot(mx, my);
  if (m > 1) { mx /= m; my /= m; }
  p.moving = m > 0.1;
  if (p.moving) {
    p.fx = mx / (m || 1); p.fy = my / (m || 1);
    if (Math.abs(mx) > 0.1) p.face = mx > 0 ? 1 : -1;
    p.anim += dt * 10;
  }
  p.x += mx * G.stats.speed * dt; p.y += my * G.stats.speed * dt;
  p.inv = Math.max(0, p.inv - dt);
}

// Test bot: try 16 headings, take the one with the least crowd ahead and
// the most receipts. Roughly a cautious human, not a perfect dodger.
function autoMove() {
  const p = G.player, look = 0.35 * G.stats.speed;
  nearby(p.x, p.y, 120, tmp);
  let best = [0, 0], bestScore = -Infinity;
  for (let i = 0; i < 17; i++) {
    const a = (i / 16) * Math.PI * 2;
    const mx = i === 16 ? 0 : Math.cos(a), my = i === 16 ? 0 : Math.sin(a);
    const x = p.x + mx * look, y = p.y + my * look;
    let score = 0;
    for (const e of tmp) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < 60) score -= (e.def.boss ? 4 : 1) * (60 - d) / 60 * (d < 14 ? 6 : 1);
    }
    for (const q of G.eprojs) {
      const d = Math.hypot(q.x + q.vx * 0.35 - x, q.y + q.vy * 0.35 - y);
      if (d < 18) score -= 4;
    }
    let g = 0;
    for (const gem of G.gems) { const d2 = (gem.x - x) ** 2 + (gem.y - y) ** 2; if (d2 < 150 * 150) g += 30 / (Math.sqrt(d2) + 20); }
    for (const dr of G.drops) { const d2 = (dr.x - x) ** 2 + (dr.y - y) ** 2; if (d2 < 250 * 250) g += 60 / (Math.sqrt(d2) + 20); }
    score += g * 0.3;
    // Prefer to keep moving, and drift around the spawn ring rather than out of it.
    if (i === 16) score -= 0.3;
    if (score > bestScore) { bestScore = score; best = [mx, my]; }
  }
  return best;
}

// ---------- flow ----------
function announce(text, big = false) {
  ui.banner.textContent = text;
  ui.banner.className = 'show' + (big ? ' big' : '');
  clearTimeout(announce.t);
  announce.t = setTimeout(() => (ui.banner.className = ''), big ? 2800 : 4200);
}

function achieve(id) {
  if (save.achievements[id]) return;
  save.achievements[id] = Date.now();
  unlockAchievement(id);
  writeSave(save);
  toast('🏆 ' + T(`achievements.${id}`));
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = text;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function update(dt) {
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  // Trampled: the world keeps moving in slow motion for a beat before the results.
  if (G.dying) {
    G.dying -= dt;
    if (G.dying <= 0) { endRun(false); return; }
    dt *= 0.25;
  }
  G.hurtFlash = Math.max(0, (G.hurtFlash || 0) - dt * 3);
  G.t += dt;
  G.comboT -= dt; if (G.comboT <= 0) G.combo = 0;
  G.pad = pollPadCached;
  updatePlayer(dt);
  director(dt);
  updateEnemies(dt);
  updateWeapons(dt);
  updateProjectiles(dt);
  G.enemies = G.enemies.filter((e) => !e.dead);
  updatePickups(dt);
  for (const t of G.texts) { t.life -= dt; t.y -= 20 * dt; }
  G.texts = G.texts.filter((t) => t.life > 0);
  for (const q of G.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.float) { q.vx *= 0.9; q.vy *= 0.9; } else q.vy += 200 * dt; }
  G.parts = G.parts.filter((q) => q.life > 0);
  G.shake = Math.max(0, G.shake - dt * 1.5);
  audio.intensity = clamp(G.enemies.length / 250, 0, 1);
  if (G.kills >= 1000) achieve('BLACK_FRIDAY');
  if (Math.floor(G.t) !== Math.floor(G.t - STEP)) checkUnlocks();
  if (G.t >= RUN_SECONDS && !G.overtime) { endRun(true); return; }
  if (G.overtime && G.t - G.otStart >= 300) achieve('OVERTIME');
  if (G.pendingLevels > 0 && state === 'play') openLevelUp();
}

// ---------- render ----------
let camX = 0, camY = 0;
function render() {
  cx.fillStyle = G ? G.stage.bg : '#c9c6bd';
  cx.fillRect(0, 0, W, H);
  if (!G) return;
  const p = G.player;
  const sh = save.settings.shake ? G.shake * G.shake * 6 : 0;
  camX = Math.round(p.x - W / 2 + rand(-sh, sh));
  camY = Math.round(p.y - H / 2 + rand(-sh, sh));
  drawFloor();
  cx.save();
  cx.translate(-camX, -camY);
  for (const pd of G.puddles) {
    const a = Math.min(1, pd.life / 0.5, (pd.max - pd.life) / 0.2);
    cx.globalAlpha = 0.55 * a;
    cx.fillStyle = '#5fb6f0';
    cx.beginPath(); cx.ellipse(pd.x, pd.y, pd.r, pd.r * 0.6, 0, 0, Math.PI * 2); cx.fill();
    cx.globalAlpha = 0.8 * a; cx.fillStyle = '#d9f1ff';
    cx.fillRect(Math.round(pd.x - pd.r * 0.4), Math.round(pd.y - pd.r * 0.2), 3, 1);
    cx.globalAlpha = 1;
  }
  for (const g of G.gems) {
    const s = g.v >= 25 ? SPR.receipt3 : g.v >= 5 ? SPR.receipt2 : SPR.receipt1;
    const flutter = g.pull ? 0 : Math.round(Math.sin(G.t * 5 + g.x) * 1);
    cx.drawImage(s, Math.round(g.x - 2), Math.round(g.y - 3 + flutter));
  }
  for (const d of G.drops) {
    const s = SPR[d.kind];
    const bob = Math.sin(G.t * 6 + d.x) * 1.5;
    cx.drawImage(s, Math.round(d.x - s.width / 2), Math.round(d.y - s.height / 2 + bob));
  }
  // Depth sort people by y.
  const people = G.enemies.filter((e) => Math.abs(e.x - p.x) < W / 2 + 30 && Math.abs(e.y - p.y) < H / 2 + 30);
  people.push(p);
  people.sort((a, b) => a.y - b.y);
  for (const e of people) {
    if (e === p) { drawPlayer(); continue; }
    const step = Math.floor(e.t * 7) % 2 ? '_b' : '';
    const arr = e.flash > 0 ? SPR[e.def.sprite + '_flash'] : SPR[e.def.sprite + step];
    const s = arr[e.var % arr.length];
    const bob = Math.abs(Math.sin(e.t * 9)) * 1.2;
    cx.save();
    cx.translate(Math.round(e.x), Math.round(e.y - bob));
    if (e.face < 0) cx.scale(-1, 1);
    cx.fillStyle = 'rgba(0,0,0,0.18)';
    cx.fillRect(-s.width / 2 + 2, s.height / 2 - 1 + bob, s.width - 4, 2);
    cx.drawImage(s, -Math.round(s.width / 2), -Math.round(s.height / 2));
    cx.restore();
    if (e.def.elite || e.def.boss) {
      const bw = e.def.boss ? 40 : 18;
      cx.fillStyle = '#000'; cx.fillRect(Math.round(e.x - bw / 2), Math.round(e.y - s.height / 2 - 5), bw, 3);
      cx.fillStyle = e.def.boss ? '#e04848' : '#f5d142';
      cx.fillRect(Math.round(e.x - bw / 2), Math.round(e.y - s.height / 2 - 5), Math.round(bw * Math.max(0, e.hp / e.maxHp)), 3);
    }
  }
  for (const w of G.weapons) if (w.id === 'carts' && w.pos) for (const [x, y] of w.pos) cx.drawImage(SPR.cart, Math.round(x - 5), Math.round(y - 3));
  for (const pr of G.projs) {
    if (pr.kind === 'card') {
      cx.save(); cx.translate(Math.round(pr.x), Math.round(pr.y)); cx.rotate(pr.spin);
      cx.fillStyle = '#000'; cx.fillRect(-4, -3, 8, 6); cx.fillStyle = '#c9a2ff'; cx.fillRect(-3, -2, 6, 4); cx.fillStyle = '#f5d142'; cx.fillRect(-3, -1, 2, 1);
      cx.restore(); continue;
    }
    if (pr.kind === 'sticker') { cx.fillStyle = '#000'; cx.fillRect(Math.round(pr.x - 2), Math.round(pr.y - 2), 5, 4); cx.fillStyle = '#ff9a2e'; cx.fillRect(Math.round(pr.x - 1), Math.round(pr.y - 1), 3, 2); }
    else { cx.fillStyle = '#1e6b3a'; cx.fillRect(Math.round(pr.x - 3), Math.round(pr.y - 2), 6, 4); cx.fillStyle = '#7ee08f'; cx.fillRect(Math.round(pr.x - 2), Math.round(pr.y - 1), 4, 2); }
  }
  for (const l of G.lobs) {
    const k = l.t / l.dur, x = l.sx + (l.tx - l.sx) * k, y = l.sy + (l.ty - l.sy) * k - Math.sin(k * Math.PI) * 40;
    cx.fillStyle = 'rgba(0,0,0,0.2)'; cx.beginPath(); cx.ellipse(l.tx, l.ty, l.r * 0.5 * k, l.r * 0.3 * k, 0, 0, Math.PI * 2); cx.fill();
    cx.drawImage(SPR.chicken, Math.round(x - 3), Math.round(y - 3));
  }
  for (const q of G.eprojs) {
    if (q.kind === 'memo') { cx.fillStyle = '#000'; cx.fillRect(Math.round(q.x - 3), Math.round(q.y - 3), 7, 7); cx.fillStyle = '#fff'; cx.fillRect(Math.round(q.x - 2), Math.round(q.y - 2), 5, 5); cx.fillStyle = '#e04848'; cx.fillRect(Math.round(q.x - 1), Math.round(q.y - 1), 3, 1); }
    else { cx.fillStyle = '#000'; cx.fillRect(Math.round(q.x - 3), Math.round(q.y - 2), 6, 4); cx.fillStyle = '#ff6fb0'; cx.fillRect(Math.round(q.x - 2), Math.round(q.y - 1), 4, 2); }
  }
  for (const f of G.fx) {
    const a = f.life / f.max;
    if (f.kind === 'arc') {
      cx.strokeStyle = `rgba(255,255,255,${a})`; cx.lineWidth = 3;
      cx.beginPath(); cx.arc(f.x, f.y, f.range * (1.1 - a * 0.3), f.ang - 1.1, f.ang + 1.1); cx.stroke();
    } else if (f.kind === 'ring') {
      cx.strokeStyle = `rgba(255,220,90,${a})`; cx.lineWidth = 2;
      cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, Math.PI * 2); cx.stroke();
    } else if (f.kind === 'boom') {
      cx.fillStyle = `rgba(255,170,60,${a * 0.6})`; cx.beginPath(); cx.arc(f.x, f.y, f.r * (1.2 - a * 0.4), 0, Math.PI * 2); cx.fill();
      cx.fillStyle = `rgba(255,240,180,${a})`; cx.beginPath(); cx.arc(f.x, f.y, f.r * 0.5 * a, 0, Math.PI * 2); cx.fill();
    } else if (f.kind === 'chain') {
      cx.strokeStyle = `rgba(120,220,255,${a})`; cx.lineWidth = 2; cx.beginPath();
      f.pts.forEach(([x, y], i) => {
        if (!i) { cx.moveTo(x, y); return; }
        const [px, py] = f.pts[i - 1];
        cx.lineTo((px + x) / 2 + rand(-4, 4), (py + y) / 2 + rand(-4, 4)); cx.lineTo(x, y);
      });
      cx.stroke();
    } else if (f.kind === 'beam') {
      cx.save(); cx.translate(f.x, f.y); cx.rotate(f.ang);
      cx.fillStyle = `rgba(255,40,40,${a})`; cx.fillRect(0, -2, f.len, 4);
      cx.fillStyle = `rgba(255,220,220,${a})`; cx.fillRect(0, -1, f.len, 1);
      cx.restore();
    }
  }
  for (const q of G.parts) { cx.fillStyle = q.c; cx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
  for (const t of G.texts) drawNumber(t.v, t.x, t.y, t.color);
  // Player HP bar.
  cx.fillStyle = '#000'; cx.fillRect(Math.round(p.x - 9), Math.round(p.y + 9), 18, 3);
  cx.fillStyle = p.hp / G.stats.maxHp < 0.3 ? '#e04848' : '#4cd36a';
  cx.fillRect(Math.round(p.x - 9), Math.round(p.y + 9), Math.round(18 * Math.max(0, p.hp / G.stats.maxHp)), 3);
  cx.restore();
  // Off-screen boss arrow.
  if (G.boss && !G.bossDead) {
    const dx = G.boss.x - p.x, dy = G.boss.y - p.y;
    if (Math.abs(dx) > W / 2 || Math.abs(dy) > H / 2) {
      const a = Math.atan2(dy, dx);
      const ex = W / 2 + Math.cos(a) * (W / 2 - 12), ey = H / 2 + Math.sin(a) * (H / 2 - 12);
      cx.fillStyle = '#e04848'; cx.beginPath(); cx.arc(ex, ey, 4, 0, Math.PI * 2); cx.fill();
    }
  }
  if (G.hurtFlash > 0) {
    const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.6);
    g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(255,30,30,${0.45 * G.hurtFlash})`);
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  }
  if (G.dying) { cx.fillStyle = `rgba(20,10,20,${0.5 * (1 - G.dying / 1.2)})`; cx.fillRect(0, 0, W, H); }
  // Low HP vignette.
  if (p.hp / G.stats.maxHp < 0.3) {
    cx.fillStyle = `rgba(200,0,0,${0.12 + Math.sin(G.t * 6) * 0.05})`;
    cx.fillRect(0, 0, W, H);
  }
}

function drawPlayer() {
  const p = G.player;
  const step = p.moving && Math.floor(p.anim / 2.2) % 2 ? '_b' : '';
  const s = (p.inv > 0 && Math.floor(G.t * 20) % 2) ? SPR['worker_' + G.char + '_flash'] : SPR['worker_' + G.char + step];
  const bob = p.moving ? Math.abs(Math.sin(p.anim)) * 1.5 : 0;
  cx.save();
  cx.translate(Math.round(p.x), Math.round(p.y - bob));
  if (p.face < 0) cx.scale(-1, 1);
  cx.fillStyle = 'rgba(0,0,0,0.25)';
  cx.fillRect(-4, 6 + bob, 8, 2);
  cx.drawImage(s, -6, -7);
  cx.restore();
}

function drawFloor() {
  const T = 24;
  const x0 = Math.floor(camX / T), y0 = Math.floor(camY / T);
  for (let i = x0; i <= x0 + W / T + 1; i++) for (let j = y0; j <= y0 + H / T + 1; j++) {
    const sx = i * T - camX, sy = j * T - camY;
    cx.fillStyle = G.stage.tiles[(i + j) & 1];
    cx.fillRect(sx, sy, T, T);
    const h = ((i * 374761393) ^ (j * 668265263)) >>> 0;
    const r = (h % 1000) / 1000;
    // Aisle stripes and the odd floor decal for texture.
    if (((i % 12) + 12) % 12 === 0) { cx.fillStyle = G.stage.stripe; cx.fillRect(sx, sy, 2, T); }
    if (r < 0.02) { cx.fillStyle = '#e04848'; cx.fillRect(sx + 6, sy + 8, 10, 6); cx.fillStyle = '#fff'; cx.fillRect(sx + 8, sy + 10, 6, 2); }
    else if (r < 0.035) { cx.fillStyle = 'rgba(140,90,40,0.25)'; cx.beginPath(); cx.ellipse(sx + 12, sy + 12, 7, 4, 0, 0, Math.PI * 2); cx.fill(); }
    else if (r < 0.05) { cx.fillStyle = 'rgba(0,0,0,0.07)'; cx.fillRect(sx + 6, sy + 10, 9, 2); } // scuff (not white: receipts are)
  }
}

// ---------- HUD + screens ----------
function clockText() {
  const m = SHIFT_START_MIN + (G.t / RUN_SECONDS) * SHIFT_GAME_MINUTES;
  let h = Math.floor(m / 60) % 24; const mm = Math.floor(m % 60);
  if (T('ui.clock24') === true) return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ap}`;
}

let hudCache = '';
// Until the player has picked up a few, label the nearest receipt on screen:
// it's the XP, and you collect it by walking over it.
function renderReceiptLabel() {
  const el = $('#glabel');
  const show = G && state === 'play' && (save.receiptsGot || 0) < 5;
  let best = null, bd = Infinity;
  if (show) for (const g of G.gems) {
    const sx = g.x - camX, sy = g.y - camY;
    if (sx < 10 || sx > W - 10 || sy < 30 || sy > H - 10) continue;
    if (ui.banner.classList.contains('show') && sy < H * 0.4) continue; // keep clear of announcements
    const d = dist2(g, G.player);
    if (d < bd) { bd = d; best = { sx, sy }; }
  }
  if (!best) { el.style.display = 'none'; return; }
  const k = canvas.clientWidth / W;
  el.style.display = '';
  el.style.left = best.sx * k + 'px';
  el.style.top = (best.sy - 6) * k + 'px';
  el.textContent = T('ui.receiptLabel');
}

function renderHud() {
  renderReceiptLabel();
  if (!G || state === 'menu') { ui.hud.style.display = 'none'; return; }
  ui.hud.style.display = '';
  const w = G.weapons.map((x) => `<span class="slot${x.evolved ? ' evo' : ''}">${ICONS[x.id]}<b>${x.evolved ? '★' : x.lv}</b></span>`).join('');
  const ps = Object.entries(G.passives).map(([id, lv]) => `<span class="slot small">${ICONS[id]}<b>${lv}</b></span>`).join('');
  const html = `<div class="xpbar"><div style="width:${(G.xp / G.xpNeed) * 100}%"></div><span>${T('ui.lv', { n: G.level })}</span></div>
    <div class="row"><div class="slots">${w}</div><div class="clock">${clockText()}<small>${T(G.overtime ? 'ui.overtimeHud' : G.t < BOSS_AT ? 'ui.shiftEnds' : 'ui.holdOn')}</small></div>
    <div class="right">🛍️ ${G.kills}<br>💰 ${G.tipsRun}${G.combo >= 25 ? `<div class="combo" style="--c:${Math.min(1, G.combo / 300)}">×${Math.floor(G.combo / 5) * 5}</div>` : ''}</div></div><div class="slots">${ps}</div>`;
  if (html !== hudCache) { ui.hud.innerHTML = html; hudCache = html; }
}

let focusIdx = 0;
function show(html, onBack) {
  ui.screen.innerHTML = html;
  ui.screen.style.display = html ? '' : 'none';
  ui.banner.style.visibility = html ? 'hidden' : '';
  show.back = onBack || null;
  focusIdx = 0;
  const first = ui.screen.querySelector('.btn:not([disabled])');
  focusIdx = Math.max(0, btns().indexOf(first));
  paintFocus();
}
function btns() { return [...ui.screen.querySelectorAll('.btn')]; }
function paintFocus() {
  btns().forEach((b, i) => b.classList.toggle('focus', i === focusIdx));
  btns()[focusIdx]?.scrollIntoView({ block: 'nearest' }); // long screens (Inventory) on gamepad
}

function menuInput() {
  const list = btns();
  if (!list.length) return;
  const cols = +(ui.screen.querySelector('[data-cols]')?.dataset.cols || 1);
  const move = (d) => { focusIdx = (focusIdx + d + list.length) % list.length; paintFocus(); sfx('ui'); };
  if (pressed.has('ArrowDown') || pressed.has('KeyS')) move(cols);
  if (pressed.has('ArrowUp') || pressed.has('KeyW')) move(-cols);
  if (pressed.has('ArrowRight') || pressed.has('KeyD')) move(1);
  if (pressed.has('ArrowLeft') || pressed.has('KeyA')) move(-1);
  if (pressed.has('Enter') || pressed.has('Space')) list[focusIdx]?.click();
  for (let i = 1; i <= 4; i++) if (pressed.has('Digit' + i) && state === 'levelup') list[i - 1]?.click();
  if (pressed.has('KeyR') && state === 'levelup') $('#reroll')?.click();
  if (pressed.has('Escape') && show.back) show.back();
}

ui.screen.addEventListener('click', (e) => {
  const b = e.target.closest('.btn');
  if (!b || b.disabled) return;
  initAudio();
  const act = b.dataset.act;
  if (act && ACTIONS[act]) ACTIONS[act](b.dataset.arg);
});
ui.screen.addEventListener('mouseover', (e) => {
  const b = e.target.closest('.btn');
  if (b) { focusIdx = btns().indexOf(b); paintFocus(); }
});

const ACTIONS = {
  start: () => (Object.keys(STAGES).some((id) => id !== 'floor' && mapUnlocked(id)) && state === 'menu' ? showMaps() : startRun()),
  map: (id) => { if (!mapUnlocked(id)) return; save.map = id; writeSave(save); startRun(); },
  overtime: () => { if (!DEMO) startOvertime(); },
  wishlist: () => (window.desktop?.openStore ? window.desktop.openStore() : window.open('https://store.steampowered.com/', '_blank')),
  shop: () => showShop(),
  inventory: () => showInventory(),
  staff: () => showStaff(),
  settings: () => showSettings(state === 'paused' ? showPause : showMenu),
  menu: () => { state = 'menu'; G = null; showMenu(); startMusic('menu'); },
  quit: () => window.close(),
  resume: () => resume(),
  choose: (i) => { const c = G.choices[+i]; sfx('pick'); applyChoice(c); G.pendingLevels--; G.choices = null; if (G.pendingLevels > 0) openLevelUp(); else { state = 'play'; show(''); } },
  reroll: () => { if (G.rerolls > 0) { G.rerolls--; G.choices = buildChoices(); renderLevelUp(); } },
  buy: (id) => {
    const m = META[id], lv = metaLv(id);
    if (lv >= m.max || save.tips < m.cost[lv]) return;
    save.tips -= m.cost[lv]; save.meta[id] = lv + 1; writeSave(save); sfx('coin'); showShop(id);
  },
  hire: (id) => {
    const c = CHARACTERS[id];
    if (DEMO && !DEMO_STAFF.includes(id)) return;
    if (save.unlocked[id]) { save.selected = id; writeSave(save); sfx('pick'); showStaff(id); return; }
    if (save.tips < c.cost) return;
    save.tips -= c.cost; save.unlocked[id] = true; save.selected = id; writeSave(save); sfx('coin');
    if (Object.keys(CHARACTERS).every((k) => save.unlocked[k])) achieve('FULL_STAFF');
    showStaff(id);
  },
  vol: (arg) => {
    const [k, d] = arg.split(':');
    save.settings[k] = clamp(Math.round((save.settings[k] + +d) * 10) / 10, 0, 1);
    audio.sfx = save.settings.sfx; audio.music = save.settings.music; setVolumes(); writeSave(save); sfx('ui');
    showSettings(show.back, arg);
  },
  fullscreen: () => window.desktop?.toggleFullscreen?.(),
  lang: () => {
    const codes = Object.keys(LANGS);
    save.settings.lang = codes[(codes.indexOf(lang()) + 1) % codes.length];
    setLang(save.settings.lang); writeSave(save); sfx('ui');
    showSettings(show.back, 'cycle');
  },
  toggle: (k) => { save.settings[k] = !save.settings[k]; writeSave(save); showSettings(show.back, 'toggle:' + k); },
};

function refocus(selector) {
  if (!selector) return;
  const i = btns().findIndex((b) => b.matches(selector));
  if (i >= 0) { focusIdx = i; paintFocus(); }
}

function showMenu() {
  state = 'menu';
  show(`<div class="title"><h1>DOOR<span>BUSTER</span></h1>${DEMO ? `<p class="demo">${T('ui.demo')}</p>` : ''}<p>${T('ui.tagline')}</p></div>
    <div class="menu">
      <button class="btn" data-act="start">${T('ui.clockIn')}</button>
      <button class="btn" data-act="staff">${T('ui.staffRoom')}</button>
      <button class="btn" data-act="shop">${T('ui.breakRoom')} <small>💰 ${save.tips}</small></button>
      <button class="btn" data-act="inventory">${T('ui.inventory')}</button>
      <button class="btn" data-act="settings">${T('ui.settings')}</button>
      ${DEMO ? `<button class="btn" data-act="wishlist">⭐ ${T('ui.wishlist')}</button>` : ''}
      ${window.desktop ? `<button class="btn" data-act="quit">${T('ui.quit')}</button>` : ''}
    </div>
    <p class="hint">${T('ui.hint')}</p>`);
}

function showInventory() {
  const st = save.stats, mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const rec = [['recBest', mmss(st.bestTime || 0)], ['recWins', st.wins || 0], ['recKills', st.totalKills || 0], ['recBoss', st.bossKills || 0],
    ['recOvertime', mmss(st.bestOvertime || 0)], ['recLevel', st.bestLevel || 0]];
  const weapons = Object.keys(WEAPONS).map((id) => weaponUnlocked(id)
    ? `<div class="inv"><span class="ic">${ICONS[id]}</span><b>${T(`weapons.${id}.name`)}</b><span>${T(`weapons.${id}.desc`)}</span></div>`
    : `<div class="inv locked"><span class="ic">🔒</span><b>${T('ui.lockedH')}</b><span>${unlockText(id)}</span></div>`).join('');
  const passives = Object.keys(PASSIVES).map((id) => `<div class="inv"><span class="ic">${ICONS[id]}</span><b>${T(`passives.${id}.name`)}</b><span>${T(`passives.${id}.desc`)}</span></div>`).join('');
  const evos = Object.entries(EVOLUTIONS).map(([id, e]) => (save.evoSeen || {})[id]
    ? `<div class="inv"><span class="ic">⭐</span><b>${T(`evolutions.${id}.name`)}</b><span>${ICONS[id]} ${T(`weapons.${id}.name`)} ★ + ${ICONS[e.needs]} ${T(`passives.${e.needs}.name`)}</span></div>`
    : `<div class="inv locked"><span class="ic">⭐</span><b>???</b><span>${T('ui.unknownEvo')}</span></div>`).join('');
  show(`<h2>${T('ui.inventory')}</h2>
    <div class="records">${rec.map(([k, v]) => `<div><b>${v}</b>${T('ui.' + k)}</div>`).join('')}</div>
    <h3>${T('ui.weaponsH')}</h3><div class="invgrid">${weapons}</div>
    <h3>${T('ui.passivesH')}</h3><div class="invgrid">${passives}</div>
    <h3>${T('ui.evolutionsH')}</h3><div class="invgrid">${evos}</div>
    <button class="btn back" data-act="menu">${T('ui.back')}</button>`, showMenu);
}

function showShop(focusId) {
  show(`<h2>${T('ui.breakRoom')}</h2><p class="sub">${T('ui.shopSub')} 💰 ${save.tips}</p>
    <div class="grid" data-cols="2">${Object.entries(META).map(([id, m]) => {
      const lv = metaLv(id), maxed = lv >= m.max, cost = maxed ? 0 : m.cost[lv];
      return `<button class="btn card" data-act="buy" data-arg="${id}" ${!maxed && save.tips < cost ? 'data-poor' : ''}>
        <b>${T(`meta.${id}.name`)}</b><span>${T(`meta.${id}.desc`)}</span><em>${'●'.repeat(lv)}${'○'.repeat(m.max - lv)}</em>
        <i>${maxed ? T('ui.maxed') : '💰 ' + cost}</i></button>`;
    }).join('')}</div><button class="btn back" data-act="menu">${T('ui.back')}</button>`, showMenu);
  refocus(focusId && `[data-arg="${focusId}"]`);
}

function showStaff(focusId) {
  show(`<h2>${T('ui.staffRoom')}</h2><p class="sub">${T('ui.staffSub')} 💰 ${save.tips}</p>
    <div class="grid" data-cols="2">${Object.entries(CHARACTERS).map(([id, c]) => {
      const own = save.unlocked[id], sel = save.selected === id;
      return `<button class="btn card${sel ? ' sel' : ''}" data-act="hire" data-arg="${id}">
        <b>${T(`characters.${id}.name`)} ${ICONS[c.weapon]}</b><span>${T(`characters.${id}.desc`)}</span>
        <i>${DEMO && !DEMO_STAFF.includes(id) ? '🔒 ' + T('ui.fullGame') : sel ? T('ui.onShift') : own ? T('ui.select') : '💰 ' + c.cost}</i></button>`;
    }).join('')}</div><button class="btn back" data-act="menu">${T('ui.back')}</button>`, showMenu);
  refocus(focusId && `[data-arg="${focusId}"]`);
}

function showSettings(back = showMenu, focusArg) {
  const s = save.settings;
  const bar = (v) => '█'.repeat(Math.round(v * 10)) + '░'.repeat(10 - Math.round(v * 10));
  const onoff = (v) => T(v ? 'ui.on' : 'ui.off');
  show(`<h2>${T('ui.settings')}</h2><div class="menu wide">
    <div class="setrow">${T('ui.sfx')} <button class="btn sm" data-act="vol" data-arg="sfx:-0.1">−</button><code>${bar(s.sfx)}</code><button class="btn sm" data-act="vol" data-arg="sfx:0.1">+</button></div>
    <div class="setrow">${T('ui.music')} <button class="btn sm" data-act="vol" data-arg="music:-0.1">−</button><code>${bar(s.music)}</code><button class="btn sm" data-act="vol" data-arg="music:0.1">+</button></div>
    ${window.desktop?.toggleFullscreen ? `<button class="btn" data-act="fullscreen">${T('ui.fullscreen')}</button>` : ''}
    <button class="btn" data-act="lang" data-arg="cycle">${T('ui.language')}: ${LANGS[lang()]}</button>
    <button class="btn" data-act="toggle" data-arg="shake">${T('ui.shake')}: ${onoff(s.shake)}</button>
    <button class="btn" data-act="toggle" data-arg="damageNumbers">${T('ui.damageNumbers')}: ${onoff(s.damageNumbers)}</button>
    <button class="btn" data-act="${back === showPause ? 'resume' : 'menu'}">${T('ui.back')}</button></div>`, back);
  show.back = back;
  refocus(focusArg && `[data-arg="${focusArg}"]`);
}

function showPause() {
  show(`<h2>${T('ui.onBreak')}</h2><div class="menu">
    <button class="btn" data-act="resume">${T('ui.backToWork')}</button>
    <button class="btn" data-act="settings">${T('ui.settings')}</button>
    <button class="btn" data-act="menu">${T('ui.quitShift')}</button></div>`, resume);
}
function pause() { if (state !== 'play') return; state = 'paused'; showPause(); }
function resume() { state = 'play'; show(''); }

function openLevelUp() {
  state = 'levelup';
  sfx('level');
  const p = G.player;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    G.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 0.5, c: i % 2 ? '#7fd8ff' : '#f5d142', float: true });
  }
  G.choices = buildChoices();
  renderLevelUp();
}
function renderLevelUp() {
  show(`<h2>${T('ui.level', { n: G.level - G.pendingLevels + 1 })}</h2><p class="sub">${T('ui.pickOne')}</p>
    <div class="choices">${G.choices.map((c, i) => {
      const inf = choiceInfo(c);
      return `<button class="btn choice${c.type === 'evo' ? ' evo' : ''}" data-act="choose" data-arg="${i}">
        <div class="ic">${inf.icon}</div><div><b>${inf.title}</b> <em>${inf.tag}</em><span>${inf.text}</span></div><kbd>${i + 1}</kbd></button>`;
    }).join('')}</div>
    ${G.rerolls > 0 ? `<button id="reroll" class="btn sm" data-act="reroll">${T('ui.reroll', { n: G.rerolls })}</button>` : ''}`);
}

function startRun(charId, seed, map) {
  initAudio();
  audio.sfx = save.settings.sfx; audio.music = save.settings.music; setVolumes();
  newRun(charId, seed, map);
  state = 'play';
  show('');
  startMusic('shift');
  announce(T('ui.doorsOpen'), true);
  if (!save.tutorialSeen) {
    const tip = $('#tip');
    tip.textContent = T('ui.tutorial'); tip.className = 'show';
    setTimeout(() => (tip.className = ''), 9000);
    save.tutorialSeen = true; writeSave(save);
  }
}

function endRun(win) {
  if (state === 'over') return;
  state = 'over';
  stopMusic();
  setTimeout(() => { if (state === 'over') startMusic('menu'); }, 2200);
  clearTimeout(announce.t); ui.banner.className = '';
  sfx(win ? 'win' : 'lose');
  const survived = Math.floor(G.t);
  let bonus;
  if (G.overtime) {
    // Shift was already paid at 11:00; overtime pays per minute on top of tips picked up since.
    bonus = Math.round((Math.floor((G.t - G.otStart) / 60) * 10 + Math.floor((G.kills - G.otKills) / 25)) * G.stats.greed);
    save.stats.bestOvertime = Math.max(save.stats.bestOvertime || 0, Math.floor(G.t - G.otStart));
  } else {
    bonus = Math.round((Math.floor(G.kills / 25) + Math.floor(survived / 60) * 5 + (win ? 50 : 0)) * G.stats.greed);
    save.stats.runs++;
    save.stats.bestTime = Math.max(save.stats.bestTime, survived);
    save.stats.bestLevel = Math.max(save.stats.bestLevel || 0, G.level);
  }
  checkUnlocks();
  const total = G.tipsRun + bonus;
  save.tips += total;
  save.stats.totalKills += G.kills - (G.otKills || 0);
  if (win) {
    save.stats.wins++;
    achieve('FIRST_SHIFT');
    save.stats.mapWins = { ...(save.stats.mapWins || {}), [G.map]: true };
    if (G.map === 'electronics') achieve('ELECTRONICS');
    if (G.map === 'toys') achieve('TOYS');
    if (G.dmgTaken < 100) achieve('UNTOUCHABLE');
  }
  writeSave(save);
  const mm = Math.floor(survived / 60), ss = String(survived % 60).padStart(2, '0');
  const title = T(win ? 'ui.shiftComplete' : G.overtime ? 'ui.overtimeOver' : 'ui.trampled');
  const sub = win ? T('ui.subWin')
    : G.overtime ? T('ui.subOvertime', { n: Math.floor((G.t - G.otStart) / 60) })
    : T('ui.subLose', { time: clockText() });
  show(`<h2>${title}</h2><p class="sub">${sub}</p>
    <div class="stats"><div><b>${mm}:${ss}</b>${T('ui.survived')}</div><div><b>${G.kills}</b>${T('ui.shoppers')}</div><div><b>${G.level}</b>${T('ui.levelWord')}</div><div><b>💰 ${total}</b>${T('ui.tipsBonus', { n: bonus })}</div></div>
    <div class="menu">${DEMO ? `<button class="btn" data-act="wishlist">${T('ui.wishlistFull')}</button>` : win ? `<button class="btn" data-act="overtime">${T('ui.workOvertime')}</button>` : ''}
    <button class="btn" data-act="start">${T('ui.anotherShift')}</button>
    <button class="btn" data-act="staff">${T('ui.staffRoom')}</button>
    <button class="btn" data-act="shop">${T('ui.breakRoom')}</button>
    <button class="btn" data-act="menu">${T('ui.mainMenu')}</button></div>`, null);
}

function startOvertime() {
  G.overtime = true; G.otStart = G.t; G.otKills = G.kills; G.tipsRun = 0;
  state = 'play';
  show('');
  startMusic('overtime');
  announce(T('ui.overtimeStart'), true);
}

function mapUnlocked(id) {
  const m = STAGES[id];
  if (DEMO && id !== 'floor') return false;
  if (m.unlockMap) return !!(save.stats.mapWins || {})[m.unlockMap];
  return (save.stats.wins || 0) >= (m.unlockWins || 0);
}

function showMaps() {
  show(`<h2>${T('ui.chooseDept')}</h2><div class="grid" data-cols="2">${Object.entries(STAGES).map(([id, m]) => {
    const open = mapUnlocked(id);
    return `<button class="btn card${(save.map || 'floor') === id ? ' sel' : ''}" data-act="map" data-arg="${id}" ${open ? '' : 'disabled'}>
      <b>${T(`maps.${id}.name`)}</b><span>${T(`maps.${id}.desc`)}</span><i>${open ? T('ui.clockInMap') : '🔒 ' + T(DEMO && id !== 'floor' ? 'ui.fullGame' : m.unlockMap ? 'ui.surviveIn' : 'ui.surviveShift', { map: T(`maps.${m.unlockMap}.name`) })}</i></button>`;
  }).join('')}</div><button class="btn back" data-act="menu">${T('ui.back')}</button>`, showMenu);
}

// ---------- loop ----------
let last = performance.now(), acc = 0, pollPadCached = { x: 0, y: 0 }, autoPickT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  pollPadCached = pollPad();
  if (state === 'play') {
    if (pressed.has('Escape') || pressed.has('KeyP')) pause();
    else {
      acc += dt * speed;
      let steps = 0;
      while (acc >= STEP && state === 'play' && steps < 600) { update(STEP); acc -= STEP; steps++; }
    }
  } else {
    acc = 0;
    menuInput();
    // Autopilot (trailers, demos) picks its own upgrades after a beat on screen.
    if (autopilot && state === 'levelup') {
      autoPickT = (autoPickT || 0) + dt;
      if (autoPickT > 0.6) { autoPickT = 0; ACTIONS.choose(botChoice()); }
    }
  }
  pressed.clear();
  render();
  renderHud();
  requestAnimationFrame(frame);
}

function fit() {
  const s = Math.max(1, Math.min(innerWidth / W, innerHeight / H));
  const k = s >= 2 ? Math.floor(s) : s; // integer scale when there's room, for crisp pixels
  canvas.style.width = W * k + 'px';
  canvas.style.height = H * k + 'px';
  document.documentElement.style.setProperty('--scale', k);
}
addEventListener('resize', fit);

setLang(save.settings.lang || detectLang());
buildSprites(CHARACTERS);
fit();
audio.sfx = save.settings.sfx; audio.music = save.settings.music;
showMenu();
requestAnimationFrame(frame);

// Bot upgrade policy: evolve, then level owned weapons, then up to 4 weapons, then passives.
function botChoice() {
  const rank = (c) => c.type === 'evo' ? 0 : c.type === 'weapon' && G.weapons.find((w) => w.id === c.id) ? 1
    : c.type === 'weapon' && G.weapons.length < 4 ? 2 : c.type === 'passive' ? 3 : 4;
  let bi = 0;
  G.choices.forEach((c, i) => { if (rank(c) < rank(G.choices[bi])) bi = i; });
  return bi;
}

// Test hooks for automated playtests (Playwright).
window.__db = {
  get G() { return G; }, get state() { return state; }, get save() { return save; },
  start: (charId = 'stocker', seed = 1, map = 'floor') => startRun(charId, seed, map),
  overtime: () => startOvertime(),
  setLang: (c) => { setLang(c); if (state === 'menu') showMenu(); },
  missingKeys,
  currentSong,
  setSpeed: (s) => (speed = s),
  setAutopilot: (v) => (autopilot = v),
  choose: (i = 0) => ACTIONS.choose(i),
  // Run the sim synchronously, for balance sweeps without waiting on frames.
  simulate: (seconds) => {
    const end = G.t + seconds;
    while (state !== 'over' && G.t < end) {
      if (state === 'levelup') { ACTIONS.choose(botChoice()); continue; }
      if (state !== 'play') break;
      update(STEP);
    }
    return { t: G.t, state, level: G.level, kills: G.kills, hp: G.player.hp, enemies: G.enemies.length,
      weapons: G.weapons.map((w) => w.id + ':' + (w.evolved ? 'E' : w.lv)), passives: { ...G.passives }, dmgTaken: G.dmgTaken, dealt: G.dmgDealt, boss: G.bossDead ? 'dead' : G.boss ? Math.round(G.boss.hp) : '-', dmgBy: G.dmgBy, nearby: nearby(G.player.x, G.player.y, 40, []).length };
  },
};
