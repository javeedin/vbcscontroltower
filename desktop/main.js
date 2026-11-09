// Control Tower desktop app (Electron).
// Starts the same local dev server and opens it in a native window, so the
// desktop and web experiences are identical. Run from the repo root with:
//   npm run desktop:fresh   (installs Electron first)  — or  npm run desktop
//
// Note: the app loads Oracle's Redwood theme from Oracle's CDN, so it needs internet.

const { app, BrowserWindow } = require('electron');
const path = require('path');

process.env.PORT = process.env.PORT || '3100';
require(path.join(__dirname, '..', 'server.js'));   // serves ../app/web on PORT

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 980,
    title: 'Control Tower',
    backgroundColor: '#f4f3f1',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true }
  });
  win.loadURL('http://localhost:' + process.env.PORT + '/');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
