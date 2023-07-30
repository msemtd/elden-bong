// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke('ping'),
})

// NB: everything in handy API uses invoke and is therefore async
contextBridge.exposeInMainWorld('handy', {
  getMapTiles: () => ipcRenderer.invoke('getMapTiles'),
  pickFile: () => ipcRenderer.invoke('pickFile'),
  slurp: (fp, options) => ipcRenderer.invoke('slurp', fp, options),
  readDir: (path) => ipcRenderer.invoke('readDir', path),
  pathParse: (...args) => ipcRenderer.invoke('pathParse', ...args),
  pathJoin: (...args) => ipcRenderer.invoke('pathJoin', ...args),
  outputFile: (...args) => ipcRenderer.invoke('outputFile', ...args),
  sliceBigMap: (...args) => ipcRenderer.invoke('sliceBigMap', ...args),
})
