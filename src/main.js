const { app, BrowserWindow, ipcMain, net, session, dialog } = require('electron')
const path = require('path')
const url = require('url')
const { Config } = require('./config')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

const config = new Config()
config.load()

let mainWindow = null
const createWindow = () => {
  mainWindow = new BrowserWindow({
    icon: path.join(process.cwd(), 'stuff', 'icon.ico'),
    width: 800,
    height: 600,
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
  const partition = 'persist:mine'
  const ses = session.fromPartition(partition)
  ses.protocol.handle('mine', (request) => {
    const filePath = request.url.slice('mine://'.length)
    return net.fetch(url.pathToFileURL(path.join(__dirname, filePath)).toString())
  })
  ipcMain.handle('ping', () => 'pong')
  ipcMain.handle('pickMapsDir', pickMapsDir)
  createWindow()
})

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

async function pickMapsDir () {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    console.log(result.canceled)
    console.log(result.filePaths)
    // TODO return file api object?
    return result.canceled ? '' : result.filePaths.length ? result.filePaths[0] : ''
  } catch (error) {
    console.error(error)
  }
}
