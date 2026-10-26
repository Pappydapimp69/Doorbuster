// Localization. English UI strings live here; game content (weapon names etc.)
// comes from data.js. Each language file overrides any subset of both.
import { WEAPONS, PASSIVES, EVOLUTIONS, MAPS, CHARACTERS, META, ACHIEVEMENTS, ANNOUNCEMENTS } from './data.js';
import zh from './lang/zh.js';
import ru from './lang/ru.js';
import es from './lang/es.js';
import pt from './lang/pt.js';
import de from './lang/de.js';

export const LANGS = { en: 'English', zh: '简体中文', ru: 'Русский', es: 'Español', pt: 'Português (Brasil)', de: 'Deutsch' };

const UI = {
  tagline: 'Black Friday. 5:00 AM. The doors are opening.',
  clockIn: 'Clock In', staffRoom: 'Staff Room', breakRoom: 'Break Room', settings: 'Settings', quit: 'Quit', wishlist: 'Wishlist',
  hint: 'Move: WASD / arrows / stick. Weapons fire on their own. Survive until 11:00 AM.',
  shopSub: 'Spend tips on permanent perks.', maxed: 'MAXED', back: 'Back',
  staffSub: 'Pick who works the shift.', onShift: 'ON SHIFT', select: 'Select', fullGame: 'Full game',
  sfx: 'SFX', music: 'Music', shake: 'Screen shake', damageNumbers: 'Damage numbers', on: 'ON', off: 'OFF', language: 'Language',
  onBreak: 'On Break', backToWork: 'Back to Work', quitShift: 'Quit Shift',
  level: 'Level {n}!', pickOne: 'Pick one.', reroll: 'Price check (reroll) ×{n} [R]',
  tagEvo: 'EVOLUTION', tagHeal: 'HEAL', tagTips: 'TIPS', tagNew: 'NEW', tagLv: 'LV {n}',
  snackTitle: 'Break Room Hot Dog', snackText: 'Restore 40 HP.', tipsTitle: 'Tip Jar', tipsText: '+25 tips.',
  shiftComplete: 'SHIFT COMPLETE', overtimeOver: 'OVERTIME OVER', trampled: 'TRAMPLED',
  subWin: 'You clocked out at 11:00 AM. Nobody said thank you.',
  subOvertime: 'You worked {n} minutes of overtime. Unpaid, technically.',
  subLose: 'Clocked out early at {time}.',
  survived: 'survived', shoppers: 'shoppers', levelWord: 'level', tipsBonus: 'tips (+{n} bonus)',
  workOvertime: 'Work Overtime (endless)', anotherShift: 'Pick Up Another Shift', mainMenu: 'Main Menu', wishlistFull: '⭐ Wishlist the full game',
  chooseDept: 'Choose a Department', clockInMap: 'Clock in', surviveShift: 'Survive a full shift',
  shiftEnds: 'shift ends 11:00 AM', holdOn: 'HOLD ON', overtimeHud: 'OVERTIME (unpaid)', lv: 'LV {n}',
  rush: 'DOORBUSTER RUSH!', flashSale: 'FLASH SALE — YOU ARE THE SALE', elite: 'A customer would like to speak to your manager.',
  bossHere: 'THE {boss} IS HERE', circleBack: '"Let\'s circle back on that."', secondWind: 'SECOND WIND. Back to work.',
  bossGone: 'The {boss} has left the building.', lostFound: 'Lost & Found box: free upgrade.', promoted: 'PROMOTED: {name}',
  doorsOpen: 'Doors open. Good luck out there.', overtimeStart: 'OVERTIME. The doors never close.', demo: 'DEMO',
  inventory: 'Inventory', records: 'Records', weaponsH: 'Weapons', passivesH: 'Passives', evolutionsH: 'Evolutions',
  newStock: 'New in stock: {name}', lockedH: 'Locked', unknownEvo: '??? — evolve it to find out',
  recBest: 'Longest shift', recWins: 'Shifts survived', recKills: 'Shoppers handled', recBoss: 'Managers dismissed', recOvertime: 'Longest overtime', recLevel: 'Highest level',
  unlock: { bestTime: 'Survive {n} minutes', totalKills: 'Handle {n} shoppers in total', bestLevel: 'Reach level {n}', bossKills: 'Defeat a manager' },
  clock24: false,
};

function english() {
  const pick = (obj, keys) => Object.fromEntries(Object.entries(obj).map(([id, v]) => [id, Object.fromEntries(keys.filter((k) => v[k] !== undefined).map((k) => [k, v[k]]))]));
  return {
    ui: UI,
    weapons: pick(WEAPONS, ['name', 'desc', 'lvText']),
    passives: pick(PASSIVES, ['name', 'desc']),
    evolutions: pick(EVOLUTIONS, ['name', 'desc']),
    maps: pick(MAPS, ['name', 'desc', 'boss']),
    characters: pick(CHARACTERS, ['name', 'desc']),
    meta: pick(META, ['name', 'desc']),
    achievements: { ...ACHIEVEMENTS },
    announcements: ANNOUNCEMENTS,
  };
}

const EN = english();
const PACKS = { zh, ru, es, pt, de };
let cur = EN, code = 'en';

function merge(base, over) {
  if (!over) return base;
  if (Array.isArray(base)) return Array.isArray(over) && over.length ? over : base;
  if (typeof base !== 'object') return over ?? base;
  const out = {};
  for (const k of new Set([...Object.keys(base), ...Object.keys(over)])) out[k] = merge(base[k], over[k]);
  return out;
}

// Steam's game-language setting wins over the OS locale when running on Steam.
const STEAM_LANGS = { schinese: 'zh', russian: 'ru', spanish: 'es', latam: 'es', brazilian: 'pt', portuguese: 'pt', german: 'de', english: 'en' };

export function detectLang() {
  try { const sl = window.steam?.language?.(); if (sl && STEAM_LANGS[sl]) return STEAM_LANGS[sl]; } catch { /* not on Steam */ }
  const n = (navigator.language || 'en').toLowerCase();
  if (n.startsWith('zh')) return 'zh';
  for (const c of Object.keys(LANGS)) if (n.startsWith(c)) return c;
  return 'en';
}

export function setLang(c) {
  code = LANGS[c] ? c : 'en';
  cur = code === 'en' ? EN : merge(EN, PACKS[code]);
  document.documentElement.lang = code === 'zh' ? 'zh-CN' : code === 'pt' ? 'pt-BR' : code;
}
export function lang() { return code; }

// T('ui.level', { n: 3 }) — dotted path into the current pack, {x} placeholders.
export function T(path, vars) {
  let v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), cur);
  if (v == null) v = path.split('.').reduce((o, k) => (o == null ? o : o[k]), EN);
  if (typeof v !== 'string') return v ?? path;
  return vars ? v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : v;
}

// For tests: every key the English pack has that a language is missing.
export function missingKeys(c) {
  const out = [];
  const walk = (en, tr, p) => {
    if (typeof en === 'string') { if (typeof tr !== 'string') out.push(p); return; }
    if (Array.isArray(en)) { if (!Array.isArray(tr) || tr.length < en.length) out.push(p); return; }
    if (typeof en === 'object') for (const k of Object.keys(en)) walk(en[k], tr ? tr[k] : undefined, p + '.' + k);
  };
  const pack = PACKS[c];
  for (const k of Object.keys(EN)) walk(EN[k], pack[k], k);
  return out.filter((p) => !p.endsWith('.clock24'));
}
