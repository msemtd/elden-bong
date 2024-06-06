import { awaitableSubProcess } from './SubProc'
import fs from 'fs-extra'
import path from 'path'
import { identifyDataParse, rxBetween, tileFile, xyToIndex, getPad } from './util'

/**
 * Main process map support
 */
class MainMap {
  constructor (rendererNotify) {
    if (rendererNotify instanceof Function) {
      this.rendererNotify = rendererNotify
    } else {
      throw Error('rendererNotify arg must be a function')
    }
    // TODO jobs queue
    this.busyJob = null
  }

  async identifyImage (options) {
    if (this.busyJob) throw Error('busy with another job')
    const { fp, magick } = options
    // this.busyJob = this.startProcessJob('identifyImage', magick, ['identify', fp])
    try {
      const s = await awaitableSubProcess(magick, ['identify', '-format', '%m %B %w x %h', fp], path.dirname(fp), 'identifyImage')
      console.dir(s)
      const k = identifyDataParse(s)
      console.dir(k)
      return s
    } catch (error) {
      console.log('nah mate')
      throw error
    }
  }

  async sliceBigMap (options) {
    if (this.busyJob) throw Error('busy with another job')
    try {
      this.rendererNotify('underpants', 'slicing yo')
      const { fp, prefix, magick, sliceCommand, identifyData, tileSize } = options
      const pp = path.parse(fp)
      const cwd = pp.dir
      const ext = pp.ext
      const name = pp.name
      const k = identifyDataParse(identifyData)
      const tilesX = k.width / tileSize
      const tilesY = k.height / tileSize
      if (k.width % tileSize || k.height % tileSize) {
        console.warn('not an exact tile split - expect some nonsense')
      }
      const expectedTileCount = tilesX * tilesY
      const pad = getPad(tilesX, tilesY)
      const data = {
        name,
        bigOriginalFile: fp,
        tileSize,
        tilesX,
        tilesY,
        tiles: [],
      }
      console.log(`we expect ${expectedTileCount} :: ${tilesX} by ${tilesY}`)
      // prepare the args for the slice command line...
      const args = sliceCommand.split(' ')
      for (let i = 0; i < args.length; i++) {
        let s = args[i]
        s = s.replaceAll('{{BIG_MAP_FILE}}', fp)
        s = s.replaceAll('{{PREFIX}}', prefix)
        s = s.replaceAll('{{TILE_SIZE}}', tileSize)
        args[i] = s
      }
      const topic = 'sliceBigMap'
      this.rendererNotify(topic, 'Preparing...')
      await awaitableSubProcess(magick, args, cwd, topic, (msg) => { this.rendererNotify(topic, msg) })
      // now rename tiles
      const files = await fs.readdir(cwd)
      const rx = rxBetween(prefix, ext)
      const tiles = files.filter(f => rx.exec(f))
      if (expectedTileCount !== tiles.length) {
        throw Error('unexpected tile count after slice')
      }
      this.rendererNotify(topic, `slicing is done - renaming ${tiles.length} tiles...`)
      for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
          const idx = xyToIndex(x, y, tilesX, tilesY)
          const fOld = `${prefix}${idx}${ext}`
          const fNew = tileFile(name, tileSize, x, y, pad, ext)
          this.rendererNotify(topic, `rename ${fOld} ${fNew}`)
          await fs.rename(path.join(cwd, fOld), path.join(cwd, fNew))
          data.tiles.push(fNew)
        }
      }
      const iFile = `${name}-info.json`
      this.rendererNotify(topic, `rename complete, writing ${iFile}`)
      await fs.outputJSON(path.join(cwd, iFile), data, { spaces: 2 })
    } catch (error) {
      console.log('sliceBigMap major malfunction')
      throw error
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
