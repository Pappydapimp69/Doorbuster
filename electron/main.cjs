// Desktop shell for Steam. Loads the same index.html the browser build uses.
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');

let steam = null, appId = 480;
try {
  // steamworks.js talks to the running Steam client. Without Steam (dev, itch.io) the game still runs.
  const sw = require('steamworks.js');
  appId = Number(process.env.STEAM_APP_ID || require('node:fs').readFileSync(path.join(__dirname, '..', 'steam_appid.txt'), 'utf8').trim());
  steam = sw.init(appId);
  sw.electronEnableSteamOverlay();
} catch (e) {
  console.log('Steam not available:', e.message);
}

ipcMain.handle('steam:achievement', (_e, id) => {
  try { return steam ? steam.achievement.activate(id) : false; } catch { return false; }
});
ipcMain.on('steam:name', (e) => {
  try { e.returnValue = steam ? steam.localplayer.getName() : null; } catch { e.returnValue = null; }
});
// Demo builds point the wishlist button at the FULL game's page.
ipcMain.handle('steam:store', () => {
  let full = appId;
  try { full = Number(require('node:fs').readFileSync(path.join(__dirname, '..', 'steam_full_appid.txt'), 'utf8').trim()) || appId; } catch { /* full build: own page */ }
  return shell.openExternal(steam ? `steam://store/${full}` : `https://store.steampowered.com/app/${full}/`);
});
ipcMain.on('steam:available', (e) => { e.returnValue = !!steam; });

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 450,
    backgroundColor: '#15141c', fullscreen: !process.env.DOORBUSTER_WINDOWED,
    autoHideMenuBar: true, title: 'Doorbuster',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: false },
  });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'keyDown' && (input.key === 'F11' || (input.alt && input.key === 'Enter'))) win.setFullScreen(!win.isFullScreen());
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
