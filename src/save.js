// Persistent progress. localStorage works in the browser and in Electron.

const KEY = 'doorbuster.save.v1';

const DEFAULT = {
  tips: 0,
  meta: {},
  unlocked: { stocker: true },
  selected: 'stocker',
  settings: { sfx: 0.6, music: 0.4, shake: true, damageNumbers: true },
  stats: { runs: 0, wins: 0, bestTime: 0, totalKills: 0, bossKills: 0 },
  achievements: {},
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const s = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT), ...s,
      settings: { ...DEFAULT.settings, ...(s.settings || {}) },
      stats: { ...DEFAULT.stats, ...(s.stats || {}) },
      unlocked: { ...DEFAULT.unlocked, ...(s.unlocked || {}) },
    };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: progress is session-only */ }
}

export function resetSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
