/*
 * DataDir / DataDirMain / DataDirPreload
 *
 * Provides a convenient and standardised API for fetching, caching, and managing
 * files in a secure electron application (best practices as of August 2025).
 *
 * see https://www.electronjs.org/docs/latest/tutorial/process-model
 *
 * - DataDir - the API callable from a renderer process is provided here as a thin wrapper
 *   with jsdoc to assist the developer.
 * - DataDirMain - the code for the main process is in DataDirMain - this is what actually happens.
 * - DataDirPreload - the preload function that exposes the API to the renderer
 *   process via the contextBridge.
 *
 * Supports:
 * - data files (JSON as transferable objects)
 * - text files (e.g. HTML or plain text with utf8 encoding)
 * - binary image files (buffers of bytes - could be anything!)
 *
 * Uses the {Electron.Net.fetch()} so possibly another level of caching is done - that's just considered a bonus!
 * Uses fs-extra for convenient and safe file system operations.
 *
 */

// This is how preload exposes this API to the renderer process
const api = window.apiDataDir

export class DataDir {
  static async getJson (url, options) {
    return await api.getJson(url, options)
  }

  static async getText (url, options) {
    return await api.getText(url, options)
  }

  static async getBinary (url, options) {
    return await api.getBinary(url, options)
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
  static async getCachePath (p) {
    return await api.getCachePath(p)
  }

  /**
   * Checks if a file exists in the cache.
   * @param {string} f - The cache file path to check.
   * @returns {Promise<boolean>} Returns true if the file exists.
   */
  static async hasFile (f) {
    return await api.hasFile(f)
  }

  /**
   * Deletes a file from the cache.
   * @param {string} f - The cache file path to delete.
   * @returns {Promise<boolean>} Returns true if the file was deleted.
   */
  static async deleteFile (f) {
    return await api.deleteFile(f)
  }
}
