import { ipcMain, net, app } from 'electron'
import path from 'path'
import fs from 'fs-extra'

// The default location for our data is...
let dataDirLocation = path.join(app.getPath('userData'), 'dataDirLocation')

export class DataDirMain {
  static setupIpcMainHandlers (p) {
    if (p) {
      dataDirLocation = p
    }
    ipcMain.handle('DataDir:getJson', async (_event, ...args) => { return await DataDirMain.getJson(...args) })
    ipcMain.handle('DataDir:getText', async (_event, ...args) => { return await DataDirMain.getText(...args) })
    ipcMain.handle('DataDir:getBinary', async (_event, ...args) => { return await DataDirMain.getBinary(...args) })
    ipcMain.handle('DataDir:getCacheDir', async (_event, ...args) => { return await DataDirMain.getCacheDir(...args) })
  }

  // Caching JSON data under the user's data directory.
  // Pass a url and options with a cacheFile relative path
  // The relative path must not be able to escape the data directory
  // The URL must return a body that can be parsed as JSON
  static async getJson (url, options) {
    const cf = await DataDirMain.checkCachePath(options?.cacheFile)
    let data = null
    if (cf) {
      if (await fs.exists(cf)) {
        // NB: fs-extra readJson with throws=false returns null if the data does not parse
        data = await fs.readJson(cf, { throws: false })
      }
      if (data !== null) {
        return data
      }
    }
    const response = await net.fetch(url)
    if (response.ok) {
      data = await response.json()
      if (cf) {
        await fs.writeJson(cf, data)
      }
    }
    return data
  }

  static async getText (url, options) {
    const cf = await DataDirMain.checkCachePath(options?.cacheFile)
    let data = null
    if (cf) {
      if (await fs.exists(cf)) {
        if (options?.noDataJustCache) {
          return data
        }
        return await fs.readFile(cf)
      }
    }
    const response = await net.fetch(url)
    if (response.ok) {
      const blob = await response.blob()
      const buf = await blob.arrayBuffer()
      data = new Uint8Array(buf)
      if (cf) {
        await fs.outputFile(cf, data)
      }
    }
    return data
  }

  static async getBinary (url, options) {
    const cf = await DataDirMain.checkCachePath(options?.cacheFile)
    let data = null
    if (cf) {
      if (await fs.exists(cf)) {
        if (options?.noDataJustCache) {
          return data
        }
        return await fs.readFile(cf)
      }
    }
    const response = await net.fetch(url)
    if (response.ok) {
      const blob = await response.blob()
      const buf = await blob.arrayBuffer()
      data = new Uint8Array(buf)
      if (cf) {
        await fs.outputFile(cf, data)
      }
    }
    return data
  }

  // Ensure the cache file path is relative to the dataDir.
  // If the path is falsy, return it as is.
  // If the path is absolute, or not relative to dataDir, throw an error.
  // If the path is valid, ensure the directory exists and return the full path.
  // Purpose:
  // Common behaviour to stop jailbreaking the data directory.
  // Creating the directory allows a cache file to be read or written without
  // further checks.
  // Immediate return of falsy path simplifies caller in my use cases.
  static async checkCachePath (p) {
    if (!p) {
      return p
    }
    const cp = await DataDirMain.getCacheDir(p)
    const pp = path.parse(cp)
    await fs.ensureDir(pp.dir)
    return cp
  }

  static async getCacheDir (p) {
    // Implementation for getting cache directory
    if (path.isAbsolute(p)) {
      throw new Error('Cache file path must be relative')
    }
    const cp = path.join(dataDirLocation, p)
    if (cp.indexOf(dataDirLocation) !== 0) {
      throw new Error('Cache file path must be relative to dataDir')
    }
    return cp
  }
}
