const { app, BrowserWindow, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const registerIpcHandlers = require('./ipcHandlers');

const isDev = process.env.NODE_ENV !== 'production';
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      devTools: false,  // ← DevTools completely disabled
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.setOpacity(0);
    fadeIn(mainWindow);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // DevTools removed — no openDevTools() call
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  registerIpcHandlers(mainWindow);
  registerSystemMonitors(mainWindow);
}

function fadeIn(win, opacity = 0) {
  if (opacity >= 1) { win.setOpacity(1); return; }
  win.setOpacity(parseFloat(opacity.toFixed(2)));
  setTimeout(() => fadeIn(win, opacity + 0.04), 18);
}

function registerSystemMonitors(win) {
  powerMonitor.on('on-battery', () => {
    win.webContents.send('battery:update', { charging: false });
  });
  powerMonitor.on('on-ac', () => {
    win.webContents.send('battery:update', { charging: true });
  });
  powerMonitor.on('suspend', () => {
    win.webContents.send('system:suspend');
  });
  powerMonitor.on('resume', () => {
    win.webContents.send('system:resume');
  });

  // Network monitor
  let wasOnline = true;
  setInterval(() => {
    require('dns').resolve('google.com', (err) => {
      const isOnline = !err;
      if (isOnline !== wasOnline) {
        wasOnline = isOnline;
        win.webContents.send('network:change', { online: isOnline });
      }
    });
  }, 10000);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});