import { ipcMain, net } from 'electron'
import path from 'path'
import fs from 'fs-extra'

export class DataDirMain {
  constructor (p) {
    this.dir = p
  }

  /**
   * Sets up the IPC main handlers for data directory operations.
   * The glue between the main and renderer processes via preload.
   */
  setupIpcMainHandlers () {
    // TODO - to have multiple data directories we could have different prefixes
    ipcMain.handle('DataDir:getJson', async (_event, ...args) => { return await this.getJson(...args) })
    ipcMain.handle('DataDir:getText', async (_event, ...args) => { return await this.getText(...args) })
    ipcMain.handle('DataDir:getBinary', async (_event, ...args) => { return await this.getBinary(...args) })
    ipcMain.handle('DataDir:getCachePath', async (_event, ...args) => { return await this.getCachePath(...args) })
    ipcMain.handle('DataDir:hasFile', async (_event, ...args) => { return await this.hasFile(...args) })
    ipcMain.handle('DataDir:deleteFile', async (_event, ...args) => { return await this.deleteFile(...args) })
  }

  /**
   * Checks if a file exists in the cache.
   * @argument {string} f - The cache file path to check.
   * @returns {Promise<boolean>} Returns true if the file exists.
   */
  async hasFile (f) {
    const cf = await this.ensureCachePath(f)
    if (!cf) return false
    if (!await fs.exists(cf)) return false
    return true
  }

  /**
   * Deletes a file from the cache.
   * @argument {string} f - The cache file path to delete.
   * @returns {Promise<boolean>} Returns true if the file was deleted.
   */
  async deleteFile (f) {
    const cf = await this.ensureCachePath(f)
    if (!cf) return false
    if (!await fs.exists(cf)) return false
    await fs.remove(cf)
    return true
  }

  /**
   * @typedef GetOptions
   * @type {object}
   * @property {string =} cacheFile - relative cache file path, optional.
   * @property {boolean = false} noDataJustCache - do not return the data (e.g.
   * if huge), just cache it.
   * @property {Object =} cacheThisData - kind of a hack right now in place of put commands - just
   * stick this data in the cache when it doesn't make sense to fetch from a remote URL.
   */

  /**
   * The idea here is to cover all the common cases of fetching and caching
   * data in one function. It can be used for JSON, text, binary data.
   *
   * It can also be used to just cache some data locally without fetching it.
   * It can also be used to just fetch data without caching it.
   * It can also be used to just read cached data without fetching it.
   * It can also be used to write data to the cache (without fetching it).
   *
   * Need options to enable all cases.
   *
   * Need unit tests to cover all cases.
   * empty files are OK
   * empty data is OK
   * empty JSON when properly defined is OK
   * when a fetch fails throw an error
   * when a write to disk fails throw an error
   * when a read from disk fails throw an error
   */

  async doWhatever (fetch = '', dataType = 'binary', cacheFile = '', dataIn = null, returnData = true) {
    // cf (if set) is going to be read from or written to (maybe both?)
    const cf = await this.ensureCachePath(cacheFile)
    let readFromCache = !!cf
    const writeToCache = !!cf
    let data = null
    if (cf && dataIn !== null) {
      // when dataIn is provided, we just write it to the cache and return no data.
      data = dataIn
      fetch = ''
      readFromCache = false
      returnData = false
    }
    if (readFromCache) {
      if (await fs.exists(cf)) {
        // The file is there in the cache - it should read OK
        if (dataType === 'json') {
          // NB: fs-extra readJson with throws=false returns null if the data does not parse
          data = await fs.readJson(cf, { throws: false })
        } else if (dataType === 'text') {
          data = await fs.readFile(cf, { encoding: 'utf8' })
        } else if (dataType === 'binary') {
          data = await fs.readFile(cf)
        }
      }
      // TODO this is just for the bad JSON case - if it doesn't parse then maybe we want to try fetching it again?
      if (data !== null) {
        return data
      }
    }
    if (fetch) {
      const response = await net.fetch(fetch)
      if (response.ok) {
        if (dataType === 'json') {
          data = await response.json()
        } else if (dataType === 'text') {
          data = await response.text()
        } else if (dataType === 'binary') {
          const blob = await response.blob()
          const buf = await blob.arrayBuffer()
          data = new Uint8Array(buf)
        }
      } else {
        // When fetching fails just throw an error
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`)
      }
    }
    if (writeToCache) {
      if (dataType === 'json') {
        await fs.writeJson(cf, data)
      } else if (dataType === 'text') {
        await fs.outputFile(cf, data, { encoding: 'utf8' })
      } else if (dataType === 'binary') {
        await fs.outputFile(cf, data)
      }
    }
    return returnData ? data : null
  }

  /**
   * Get some JSON given a URL and maybe cache it.
   * @argument {string} url - The URL to fetch JSON from.
   * @argument {GetOptions} options - Options for the fetch operation.
   * Pass a url and options with a cacheFile relative path
   * The relative path must not be able to escape the data directory
   * The URL must return a body that can be parsed as JSON
   */
  async getJson (url, options = {}) {
    const cf = await this.ensureCachePath(options?.cacheFile)
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
    // when there is no URL, there is nothing to fetch and this is a local-only file...
    if (!url) {
      // ...but we also need a way to write data in this case so provide a way...
      if (cf && (options?.cacheThisData instanceof Object)) {
        await fs.writeJson(cf, options.cacheThisData)
      }
      return data
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

  async getText (url, options = {}) {
    const cf = await this.ensureCachePath(options?.cacheFile)
    let data = null
    if (cf) {
      if (await fs.exists(cf)) {
        if (options?.noDataJustCache) {
          return data
        }
        return await fs.readFile(cf, { encoding: 'utf8' })
      }
    }
    const response = await net.fetch(url)
    if (response.ok) {
      data = await response.text()
      if (cf) {
        await fs.outputFile(cf, data, { encoding: 'utf8' })
      }
    }
    return data
  }

  async getBinary (url, options = {}) {
    const cf = await this.ensureCachePath(options?.cacheFile)
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

  /**
   * Common behaviour to stop jailbreaking the data directory.
   * @private
   *
   * @param {string} p - The cache file path to check.
   * @returns {Promise<string>} Returns the full cache file path if valid, or falsy if not.
   * @throws {Error} If the cache path is not relative.
   *
   * Ensures the cache file path is relative to the dataDir.
   * If the path is falsy, return it as is (simplifies caller in my use cases).
   * If the path is absolute, or not relative to dataDir, throw an error.
   * If the path is valid, ensure the directory exists and return the full path.
   *
   * Creating the directory is considered a worthwhile side-effect! It allows a
   * cache file to be read or written without further checks.
   */
  async ensureCachePath (p) {
    if (!p) {
      return p
    }
    const cp = await this.getCachePath(p)
    const pp = path.parse(cp)
    await fs.ensureDir(pp.dir)
    return cp
  }

  /**
   * Get the absolute path of a relative cache path.
   * @public
   * The API user in the Renderer process should only work in relative paths and
   * only within the data directory.
   * Sometimes we want to expose that path and that's acceptable. The user owns
   * the data so there's no reason to hide it.
   * @param {string} p - The relative cache path to convert.
   * @return {Promise<string>} Returns the absolute cache path.
   * @throws {Error} If the cache path is not relative.
   */
  async getCachePath (p) {
    // Implementation for getting cache directory
    if (path.isAbsolute(p)) {
      throw new Error('Cache file path must be relative')
    }
    const cp = path.join(this.dir, p)
    if (cp.indexOf(this.dir) !== 0) {
      throw new Error('Cache file path must be relative to dataDir')
    }
    return cp
  }
}
