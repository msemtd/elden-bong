import debug from 'debug'
import fs from 'fs-extra'
import path from 'path'
import { spawn } from 'child_process'
import readline from 'readline'
import * as Store from 'electron-store'
import { schema } from './config'

const dbg = debug('main')
debug.enable('main')

const { app, BrowserWindow, ipcMain, net, protocol, dialog, shell } = require('electron')
const url = require('url')
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

let mapsDir = ''

let mainWindow = null
const createWindow = () => {
  mainWindow = new BrowserWindow({
    icon: path.join(process.cwd(), 'stuff', 'icon.ico'),
    width: 1200,
    height: 760,
    webPreferences: {
      // eslint-disable-next-line no-undef
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  })
  // eslint-disable-next-line no-undef
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
  mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  setupMine()
  ipcMain.handle('ping', () => 'pong')
  ipcMain.handle('getMapTiles', getMapTiles)
  ipcMain.handle('pickFile', pickFile)
  ipcMain.handle('slurp', async (event, ...args) => { return await slurp(...args) })
  ipcMain.handle('shellOpenPath', async (event, ...args) => { return await shellOpenPath(...args) })
  ipcMain.handle('readDir', async (event, ...args) => { return await readDir(...args) })
  ipcMain.handle('pathParse', (event, ...args) => { return pathParse(...args) })
  ipcMain.handle('pathJoin', (event, ...args) => { return pathJoin(...args) })
  ipcMain.handle('outputFile', (event, ...args) => { return outputFile(...args) })
  ipcMain.handle('configGet', (event, ...args) => { return configGet(...args) })
  ipcMain.handle('configSet', (event, ...args) => { return configSet(...args) })
  ipcMain.handle('sliceBigMap', (event, ...args) => { return sliceBigMap(...args) })
  createWindow()
})

function setupMine () {
  protocol.handle('mine', (request) => {
    const filePath = request.url.slice('mine://'.length)
    if (filePath.startsWith('maps/')) {
      const tile = filePath.slice('maps/'.length)
      return net.fetch(url.pathToFileURL(path.join(mapsDir, tile)).toString())
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

// return list all tiles as special "mine" protocol URLs
async function getMapTiles () {
  try {
    const dir = await pickDir()
    mapsDir = dir
    const prefix = 'map-0-overworld-tile256-'
    const postfix = '.png'
    const files = await fs.readdir(dir)
    const urls = files.filter(f => f.startsWith(prefix) && f.endsWith(postfix)).map(f => `mine://maps/${f}`)
    return urls
  } catch (error) {
    console.error(error)
  }
  return ''
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

let runningProc = null

async function sliceBigMap (exe, args, cwd) {
  console.log('OK, slice a big map')
  console.log('spawning', exe, args, cwd)
  const s = {
    exe,
    args,
    cwd,
    collectedOutput: '',
    logPrefix: 'slicer ',
    subProc: null,
    running: true,
    exit_code: 0,
    exit_signal: null,
  }
  // maybe steal ideas from https://www.npmjs.com/package/await-spawn
  s.subProc = subProcess(exe, args, { cwd },
    (data) => {
      if (!data) { return }
      const msg = `${s.logPrefix}stdout: ${data}`
      s.collectedOutput.concat(msg)
      console.log(msg)
    },
    (data) => {
      if (!data) { return }
      const msg = `${s.logPrefix}stderr: ${data}`
      s.collectedOutput.concat(msg)
      console.log(msg)
    },
    (code, signal) => {
      s.exit_code = code
      s.exit_signal = signal
      const msg = `${s.logPrefix}exit code=${code} signal=${signal}`
      s.collectedOutput.concat(msg)
      s.running = false
      console.log(msg)
    },
  )
  runningProc = s
  return 'Job started as whatever'
}

function subProcess (exe, args, options, stdoutCallback, stderrCallback, exitCallback) {
  const proc = spawn(exe, args, { ...options })
  if (typeof stdoutCallback === 'function') {
    const stdoutLine = readline.createInterface({ input: proc.stdout, crlfDelay: Infinity })
    stdoutLine.on('line', stdoutCallback)
  }
  if (typeof stderrCallback === 'function') {
    const stderrLine = readline.createInterface({ input: proc.stderr, crlfDelay: Infinity })
    stderrLine.on('line', stderrCallback)
  }
  if (typeof exitCallback === 'function') {
    proc.on('close', (code, signal) => {
      exitCallback(code, signal)
    })
  }
  return proc
}
