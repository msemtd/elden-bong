const { contextBridge, ipcRenderer } = require('electron')

export function DataDirPreload () {
  contextBridge.exposeInMainWorld('apiDataDir', {
    getJson: (...args) => ipcRenderer.invoke('DataDir:getJson', ...args),
    getText: (...args) => ipcRenderer.invoke('DataDir:getText', ...args),
    getBinary: (...args) => ipcRenderer.invoke('DataDir:getBinary', ...args),
    getCacheDir: (...args) => ipcRenderer.invoke('DataDir:getCacheDir', ...args),
  })
}
