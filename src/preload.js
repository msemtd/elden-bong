// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer, webUtils } = require('electron')
const { DataDirPreload } = require('./DataDirPreload.js')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
})

contextBridge.exposeInMainWorld('notifications', {
  onNotifyFromMain: (callback) => ipcRenderer.on('renderer-notify', callback),
})

// NB: everything in handy API uses invoke and is therefore async
contextBridge.exposeInMainWorld('handy', {
  pickDir: (...args) => ipcRenderer.invoke('pickDir', ...args),
  pickFile: (...args) => ipcRenderer.invoke('pickFile', ...args),
  slurp: (filePath, options) => ipcRenderer.invoke('slurp', filePath, options),
  readDir: (path) => ipcRenderer.invoke('readDir', path),
  outputFile: (...args) => ipcRenderer.invoke('outputFile', ...args),
  // Map support...
  // getMapTiles: () => ipcRenderer.invoke('getMapTiles'),
  sliceBigMap: (...args) => ipcRenderer.invoke('sliceBigMap', ...args),
  identifyImage: (...args) => ipcRenderer.invoke('identifyImage', ...args),
  getSkyBoxMineUrlList: (...args) => ipcRenderer.invoke('getSkyBoxMineUrlList', ...args),
  readE57: (...args) => ipcRenderer.invoke('readE57', ...args),
  shellOpenPath: (...args) => ipcRenderer.invoke('shellOpenPath', ...args),
  shellOpenExternal: (...args) => ipcRenderer.invoke('shellOpenExternal', ...args),
  // File paths from File Drop API
  getPathForFile: (file) => webUtils.getPathForFile(file),
})

contextBridge.exposeInMainWorld('settings', {
  passSettingsToMain: (...args) => ipcRenderer.send('settings', ...args),
})

// webpack is kind enough to allow this...
DataDirPreload()
