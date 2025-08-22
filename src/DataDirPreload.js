const { contextBridge, ipcRenderer } = require('electron')

export function DataDirPreload () {
  contextBridge.exposeInMainWorld('apiDataDir', {
    getJson: (...args) => ipcRenderer.invoke('DataDir:getJson', ...args),
    getText: (...args) => ipcRenderer.invoke('DataDir:getText', ...args),
    getBinary: (...args) => ipcRenderer.invoke('DataDir:getBinary', ...args),
    getCachePath: (...args) => ipcRenderer.invoke('DataDir:getCachePath', ...args),
    hasFile: (...args) => ipcRenderer.invoke('DataDir:hasFile', ...args),
    deleteFile: (...args) => ipcRenderer.invoke('DataDir:deleteFile', ...args),
  })
}
