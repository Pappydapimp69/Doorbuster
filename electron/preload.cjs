// Exposes a tiny Steam API to the page as window.steam (see src/steam.js).
const { contextBridge, ipcRenderer } = require('electron');

if (ipcRenderer.sendSync('steam:available')) {
  contextBridge.exposeInMainWorld('steam', {
    activateAchievement: (id) => ipcRenderer.invoke('steam:achievement', id),
    playerName: () => ipcRenderer.sendSync('steam:name'),
    language: () => ipcRenderer.sendSync('steam:language'),
  });
}
const fs = require('node:fs'), path = require('node:path');
const demo = process.env.DOORBUSTER_DEMO === '1' || fs.existsSync(path.join(process.resourcesPath || '', 'demo.flag'));
contextBridge.exposeInMainWorld('desktop', {
  quit: () => window.close(),
  demo,
  openStore: () => ipcRenderer.invoke('steam:store'),
  toggleFullscreen: () => ipcRenderer.invoke('win:fullscreen'),
});
