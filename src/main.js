import debug from 'debug'
import fs from 'fs-extra'
import path from 'path'
import * as Store from 'electron-store'
import { schema } from './config'
import { MainMap } from './MainMap'
import url from 'node:url'

const dbg = debug('main')
debug.enable('main')

const { app, BrowserWindow, ipcMain, net, protocol, dialog, shell } = require('electron')

dbg('we appear to be alive')
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const store = new Store({
  // schema, clearInvalidConfig: true
})
function configGet (k) { return store.get(k) }
function configSet (k, v) { return store.set(k, v) }

const rendererNotify = (topic, msg) => {
  mainWindow.webContents.send('renderer-notify', topic, msg)
}

const mainMap = new MainMap(rendererNotify)

let mainWindow = null
const createWindow = () => {
  mainWindow = new BrowserWindow({
    icon: path.join(process.cwd(), 'stuff', 'icon.ico'),
    fullscreen: true,
    webPreferences: {
      // eslint-disable-next-line no-undef
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  })
  mainWindow.removeMenu()
  // eslint-disable-next-line no-undef
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
  // mainWindow.webContents.openDevTools()
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && !input.control && !input.alt && !input.meta && !input.shift) {
      mainWindow.webContents.openDevTools()
      event.preventDefault()
    }
  })
}

app.whenReady().then(() => {
  setupMine()
  // All the main process functionality exposed in preload...
  ipcMain.handle('ping', () => 'pong')
  // ipcMain.handle('getMapTiles', getMapTiles)
  ipcMain.handle('pickFile', pickFile)
  ipcMain.handle('pickDir', pickDir)
  ipcMain.handle('slurp', async (event, ...args) => { return await slurp(...args) })
  ipcMain.handle('shellOpenPath', async (event, ...args) => { return await shellOpenPath(...args) })
  ipcMain.handle('readDir', async (event, ...args) => { return await readDir(...args) })
  ipcMain.handle('pathParse', (event, ...args) => { return pathParse(...args) })
  ipcMain.handle('pathJoin', (event, ...args) => { return pathJoin(...args) })
  ipcMain.handle('outputFile', (event, ...args) => { return outputFile(...args) })
  ipcMain.handle('configGet', (event, ...args) => { return configGet(...args) })
  ipcMain.handle('configSet', (event, ...args) => { return configSet(...args) })
  // map-related functionality...
  ipcMain.handle('sliceBigMap', (event, ...args) => { return mainMap.sliceBigMap(...args) })
  ipcMain.handle('renameMapTiles', (event, ...args) => { return mainMap.renameMapTiles(...args) })
  ipcMain.handle('identifyImage', (event, ...args) => { return mainMap.identifyImage(...args) })
  createWindow()
})

function setupMine () {
  protocol.handle('mine', (request) => {
    const filePath = request.url.slice('mine://'.length)
    if (filePath.startsWith('maps/')) {
      const tile = filePath.slice('maps/'.length)
      return net.fetch(url.pathToFileURL(tile).toString())
    }
    return net.fetch(url.pathToFileURL(path.join(__dirname, filePath)).toString())
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

async function pickDir () {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result.canceled ? '' : result.filePaths.length ? result.filePaths[0] : ''
}

async function pickFile () {
  const result = await dialog.showOpenDialog(mainWindow, {
  })
  return result
}

async function readDir (path) {
  return await fs.readdir(path)
}

function pathParse (...args) {
  return path.parse(...args)
}

function pathJoin (...args) {
  return path.join(...args)
}

async function slurp (fp, options) {
  options ??= {
    json: false,
    text: true,
    split: '',
  }
  if (options.json) {
    return await fs.readJSON(fp)
  }
  const opts = {
    encoding: options.text ? 'utf8' : null
  }
  const data = await fs.readFile(fp, opts)
  if (options.text && options.split) {
    const lines = data.split(options.split)
    return lines
  }
  return data
}

async function outputFile (...args) {
  return await fs.outputFile(...args)
}

async function shellOpenPath (path) {
  return await shell.openPath(path)
}
