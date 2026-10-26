// Steam bridge. In Electron, preload exposes window.steam (steamworks.js).
// In a plain browser every call is a no-op, so the game never depends on Steam.

export function unlockAchievement(id) {
  try { window.steam?.activateAchievement?.(id); } catch { /* not on Steam */ }
}

export function steamUserName() {
  try { return window.steam?.playerName?.() || null; } catch { return null; }
}

export function isSteam() {
  return !!window.steam;
}
