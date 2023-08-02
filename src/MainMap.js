import { subProcess } from './SubProc'
import fs from 'fs-extra'
import path from 'path'
import * as util from './util'

/**
 * Main process map support
 */
class MainMap {
  constructor (rendererNotify) {
    this.rendererNotify = rendererNotify
    // TODO jobs queue
    this.busyJob = null
  }

  async sliceBigMap (options) {
    if (this.busyJob) throw Error('busy with another job')
    const { fp, prefix, magick, sliceCommand } = options
    const pp = path.parse(fp)
    const cwd = pp.dir
    const args = sliceCommand.split(' ')
    for (let i = 0; i < args.length; i++) {
      let s = args[i]
      s = s.replace('{{BIG_MAP_FILE}}', fp)
      s = s.replace('{{PREFIX}}', prefix)
      args[i] = s
    }
    const metaFile = `${prefix}-meta.json`
    const fn = path.join(cwd, metaFile)
    let meta = null
    try {
      meta = await fs.readJson(fn, { throws: false })
      if (meta) {
        throw Error('uh, map meta json file already exists')
      }
    } catch (_error) {
    }
    // TODO - these are currently assumptions but should be as the result of a magick query
    const postfix = '.png'
    const tilesX = 38
    const tilesY = 36
    // renamed tiles will have -xnn-ynn
    const logicalTileCount = tilesX * tilesY

    const files = await fs.readdir(cwd)
    const rx = util.rxBetween(prefix, postfix)
    const tiles = files.filter(f => rx.exec(f))
    console.dir(tiles)

    try {
      this.busyJob = this.startProcessJob('sliceBigMap', magick, args, cwd, (err, value) => {
        if (err) {
          console.error("job went badly: ", err)
          return
        }
        console.log('job ended somehow with ' + value.exit_code)
        // if all OK, auto rename tiles
        return this.sliceComplete(cwd, prefix, postfix, zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz)
      })
      return
    } catch (error) {
      console.error("starting the job went badly: ", error)
      return
    }
  }

  async sliceComplete (jc) {


  }

  startProcessJob (jobName, exe, args, cwd, callback) {
    console.log(`spawning "${jobName}"...`, exe, args, cwd)
    const s = {
      exe,
      args,
      cwd,
      collectedOutput: '',
      logPrefix: jobName,
      subProc: null,
      running: true,
      exit_code: 0,
      exit_signal: null,
    }
    // maybe steal ideas from https://www.npmjs.com/package/await-spawn
    s.subProc = subProcess(exe, args, { cwd },
      (data) => {
        if (!data) { return }
        const msg = `${s.logPrefix} stdout: ${data}`
        s.collectedOutput.concat(msg)
        this.rendererNotify(jobName, msg)
      },
      (data) => {
        if (!data) { return }
        const msg = `${s.logPrefix} stderr: ${data}`
        s.collectedOutput.concat(msg)
        this.rendererNotify(jobName, msg)
      },
      (code, signal) => {
        s.exit_code = code
        s.exit_signal = signal
        const msg = `${s.logPrefix} exit code=${code} signal=${signal}`
        s.collectedOutput.concat(msg)
        s.running = false
        // trigger completion
        this.rendererNotify(jobName, msg)
        if (callback instanceof Function) {
          const err = s.exit_code === 0 ? null : Error('exit code ' + s.exit_code)
          callback(err, s)
        }
      },
    )
    return s
  }

  async renameMapTiles (dir, prefix, postfix) {
    const files = await fs.readdir(dir)
    // TODO
    const fa = files.filter(f => f.startsWith(prefix) && f.endsWith(postfix))
    console.dir(fa)
    for (let i = 0; i < fa.length; i++) {
      const f = fa[i]
      // f.slice()
    }
  }

  // return list all tiles as special "mine" protocol URLs
  // async getMapTiles () {
  //   try {
  //     const dir = await pickDir()
  //     mapsDir = dir
  //     const prefix = 'map-0-overworld-tile256-'
  //     const postfix = '.png'
  //     const files = await fs.readdir(dir)
  //     const urls = files.filter(f => f.startsWith(prefix) && f.endsWith(postfix)).map(f => `mine://maps/${f}`)
  //     return urls
  //   } catch (error) {
  //     console.error(error)
  //   }
  //   return ''
  // }
}

export { MainMap }
