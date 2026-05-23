import { MiniGameBase } from '../MiniGameBase'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import * as THREE from 'three'
import { Bong } from '../bong.js'
import { WorldMap, MapMan } from './WorldMap'
import { DataDir } from '../DataDir'
import { listZipFileContents } from '../HandyApi'
/**
 * MapMode is a mini-game for exploring the map data of Elden Ring.
 *
 * It will be used for testing and exploring the map data, and for building
 * tools for working with the map data, such as the map icon editor.
 *
 * Move all the map-related functionality out of bong.js and into here.
 * Hook into controls, camera, etc.
 * Have an independent scene graph
 */
export class MapMode extends MiniGameBase {
  constructor (parent) {
    super(parent, 'MapMode')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(ev.gui instanceof GUI)
      console.assert(ev.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.bong = Bong.getInstance()
      this.bong.addEventListener('zipFileDropped', async (ev) => {
        console.log('zip file dropped', ev)
        const contents = await listZipFileContents(ev.filePath)
        console.log('zip file contents', contents)
      })
    })
  }

  async runTest () {
    console.log('map mode test')
    console.log('TODO: do all map handling here and hook into ' + MapMan.name + ' and ' + WorldMap.name + ' functionality hooking in via main preload ')
    console.log('TODO: register zip file drop handler in Bong class hook into controls and camera and other functionality from bong.js')
    this.activate()
    const fp = await DataDir.getCachePath('MapMode/test.txt')
    console.log('got cache path', fp)
    // when dropped zip file or open zip file, ask user if they want to delete the existing cache and start fresh
    // if so delete the cache and start fresh, otherwise just add the new zip file to the existing cache
    // but first ask if they want this zip file opening and examining
  }
}
