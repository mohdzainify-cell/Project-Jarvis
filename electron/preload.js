const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jarvis', {
  // Window
  minimize:    () => ipcRenderer.send('window:minimize'),
  maximize:    () => ipcRenderer.send('window:maximize'),
  close:       () => ipcRenderer.send('window:close'),
  hideToHUD:   () => ipcRenderer.send('window:hide-to-hud'),
  restore:     () => ipcRenderer.send('window:restore'),

  // Shell
  openURL: (url) => ipcRenderer.send('shell:open-url', url),

  // Dialogs
  openFile: (opts) => ipcRenderer.invoke('dialog:open-file', opts),

  // System
  exec: (cmd) => ipcRenderer.invoke('system:exec', cmd),

  // Event listeners
  onBatteryUpdate:  (cb) => ipcRenderer.on('battery:update',  (_, d) => cb(d)),
  onJarvisSpeak:    (cb) => ipcRenderer.on('jarvis:speak',    (_, d) => cb(d)),
  onNetworkChange:  (cb) => ipcRenderer.on('network:change',  (_, d) => cb(d)),

  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  platform: process.platform,
});