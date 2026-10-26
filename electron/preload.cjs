// Exposes a tiny Steam API to the page as window.steam (see src/steam.js).
const { contextBridge, ipcRenderer } = require('electron');

if (ipcRenderer.sendSync('steam:available')) {
  contextBridge.exposeInMainWorld('steam', {
    activateAchievement: (id) => ipcRenderer.invoke('steam:achievement', id),
    playerName: () => ipcRenderer.sendSync('steam:name'),
  });
}
contextBridge.exposeInMainWorld('desktop', { quit: () => window.close() });
