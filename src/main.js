import debug from 'debug'
import fs from 'fs-extra'
import path from 'path'
import * as Store from 'electron-store'
import { schema } from './config'
import { MainMap } from './MainMap'
import { mineToFilePath } from './util'

const dbg = debug('main')
debug.enable('main')

const { app, BrowserWindow, ipcMain, net, protocol, dialog, shell } = require('electron')

dbg('we appear to be alive')
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const staticDir = path.join(path.resolve(__dirname), '..', 'main', 'static')

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
  mainWindow.webContents.openDevTools()
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
  ipcMain.on('settings', (event, ...args) => { settingsFromRenderer(...args) })
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
  ipcMain.handle('identifyImage', (event, ...args) => { return mainMap.identifyImage(...args) })
  createWindow()
})

function setupMine () {
  // The mine protocol just allows full file paths to get through...
  // This has been a right royal pain to get working!
  protocol.handle('mine', (request) => {
    return net.fetch(mineToFilePath(request.url))
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

async function settingsFromRenderer (settings) {
  dbg('settingsFromRenderer', settings)
  // right now there are a few skyBox folders in static dir
  // const skyBoxList = await getSkyBoxList(settings?.skyBoxDir)
  const skyBoxList = await getSkyBoxList(path.join(staticDir, 'skyBoxes'))
  dbg('skyBoxList', skyBoxList)
  mainWindow.webContents.send('renderer-notify', 'skyBoxList', skyBoxList)
}

async function getSkyBoxList (p) {
  if (!p) return []
  const suitableSubDirectories = []
  const requiredNames = (n) => {
    const ia = ['ft', 'bk', 'up', 'dn', 'rt', 'lf']
    return ia.map(x => `${n}_${x}.jpg`)
  }
  let dirs = await fs.readdir(p, { withFileTypes: true })
  dirs = dirs.filter(de => de.isDirectory())
  for (let i = 0; i < dirs.length; i++) {
    const dn = dirs[i].name
    const sd = path.join(p, dn)
    let dea = await fs.readdir(sd, { withFileTypes: true })
    dea = dea.filter(de => de.isFile())
    const required = requiredNames(dn)
    const fileNames = dea.map(x => x.name).filter(x => required.includes(x))
    if (fileNames.length === 6) {
      suitableSubDirectories.push(dn)
    } else {
      dbg(`skyBox not suitable ${dn}`)
    }
  }
  return suitableSubDirectories
}

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
