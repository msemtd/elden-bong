/*
 * DataDir
 * Provides methods for fetching, caching, and managing files in an electron
 * application.
 *
 * Supports:
 * - data files (JSON)
 * - text files
 * - binary image files
 *
 * Just an attempt at a nicer formal way of doing the right thing for process context isolation in electron
 * This class is used in the renderer process because that's where I like to keep my app logic.
 * The gubbins for the main process is in DataDirMain
 * preload and main contextBridge
 */

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
}
