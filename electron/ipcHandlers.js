const { ipcMain, shell, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');

module.exports = function registerIpcHandlers(mainWindow) {

  // Window controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });
  ipcMain.on('window:close', () => mainWindow?.close());
  ipcMain.on('window:hide-to-hud', () => {
    mainWindow?.setSize(420, 140);
    mainWindow?.setAlwaysOnTop(true, 'floating');
    mainWindow?.setVisibleOnAllWorkspaces(true);
  });
  ipcMain.on('window:restore', () => {
    mainWindow?.setSize(1400, 900);
    mainWindow?.center();
    mainWindow?.setAlwaysOnTop(false);
    mainWindow?.setVisibleOnAllWorkspaces(false);
  });

  // Open external links safely
  ipcMain.on('shell:open-url', (_, url) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
  });

  // File dialog
  ipcMain.handle('dialog:open-file', async (_, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  // System exec (sandboxed — only whitelisted commands)
  const ALLOWED_COMMANDS = ['open', 'xdg-open', 'start'];
  ipcMain.handle('system:exec', async (_, command) => {
    const base = command.split(' ')[0];
    if (!ALLOWED_COMMANDS.includes(base)) {
      return { error: 'Command not permitted, Sir.' };
    }
    return new Promise((resolve) => {
      exec(command, (err, stdout, stderr) => {
        resolve({ stdout, stderr, error: err?.message });
      });
    });
  });

  // Forward backend events to renderer
  ipcMain.on('jarvis:speak', (_, text) => {
    mainWindow?.webContents.send('jarvis:speak', text);
  });
};