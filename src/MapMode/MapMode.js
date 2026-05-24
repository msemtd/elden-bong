import $ from 'jquery'
import path from 'path-browserify'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Bong } from '../bong.js'
import { DataDir } from '../DataDir'
import { Dlg } from '../dlg'
import { listZipFileContents, loadJsonFile, loadTextFileLines, pickFile } from '../HandyApi'
import { MiniGameBase } from '../MiniGameBase'
import { filePathToMine } from '../util'
import { MapMan, WorldMap } from './WorldMap'

/**
 * MapMode is a mini-game for exploring the map data of Elden Ring.
 *
 * It will be used for testing and exploring the map data, and for building
 * tools for working with the map data, such as the map icon editor.
 *
 * Move all the map-related functionality out of bong.js and into here.
 * Have an independent scene graph
 *
 * The map uses an Ortho camera and OrbitControls with control limited to
 * zoom and pan.
 *
 * Switching to map mode saves the current camera which is restored when leaving.
 *
 * TODO:  keyboard controls
 *
 * Map slicer - given a zipfile with the Nexus Mods Elden Ring
 * - extract to a user-specified dir (main thread)
 * - use ImageMagick to slice up the huge bitmap to manageable tiles (main thread)
 * - etc.
 * - catalogue the items, icons etc.
 * - save settings
 * - can ask user when they switch to map mode
 */
export class MapMode extends MiniGameBase {
  constructor (parent) {
    super(parent, 'MapMode')
    this.mapModeData = null
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(ev.gui instanceof GUI)
      console.assert(ev.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.add(this, 'mapMode')
      this.gui.add(this, 'mapModeOff')
      this.gui.add(this, 'sliceBigMap').name('slice big map')
      this.gui.add(this, 'loadMapJson').name('load map json')
      this.gui.add(this, 'loadMapIcons').name('load map icons')

      this.bong = Bong.getInstance()
      this.bong.addEventListener('zipFileDropped', async (ev) => {
        console.log('zip file dropped', ev)
        const contents = await listZipFileContents(ev.filePath)
        console.log('zip file contents', contents)
      })
      this.bong.addEventListener('sliceBigMap', async (ev) => {
        // TODO map slicer events
        // if (topic === 'sliceBigMap') {
        //   console.log('main: ', topic, msg)
        //   // TODO find progress bar and update it
        //   if (this.slicerDialog) {
        //     // get the content and replace it
        //     let p = msg.replace('stdout: ', '')
        //     p = p.replace(topic, '')
        //     this.slicerDialog.setContent(`progress: ${p}`, true)
        //   }
        // }
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

  mapMode () {
    if (this.mapModeData) {
      return Dlg.popup('mapMode already activated!', 'Hmm')
    }
    const s = this.screen
    const mmd = this.mapModeData = {
      savedCamera: s.camera,
      mapControls: null,
    }
    s.cameraControls.enabled = false
    const oc = new THREE.OrthographicCamera()
    oc.position.z = 5
    s.camera = oc
    const mc = new OrbitControls(oc, s.container)
    mc.enableRotate = false
    mc.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.ZOOM,
      RIGHT: THREE.MOUSE.PAN,
    }
    mmd.mapControls = mc
    s.addMixer('mapControls', (_delta) => {
      mc.update()
      return true
    })
    s.resizeRequired = true
  }

  mapModeOff () {
    if (!this.mapModeData) {
      return Dlg.popup('mapMode not activated!', 'Hmm')
    }
    const s = this.screen
    // const oc = s.camera
    s.removeMixer('mapControls')
    s.camera = this.mapModeData.savedCamera
    s.cameraControls.enabled = true
    this.mapModeData.mapControls.dispose()
    this.mapModeData = null
    s.resizeRequired = true
  }

  async sliceBigMap () {
    if (this.busyDoing) {
      Dlg.errorDialog('busy doing something else!')
      return
    }
    const p = await pickFile()
    if (p.canceled || !Array.isArray(p.filePaths) || !p.filePaths.length || !p.filePaths[0]) return
    const fp = p.filePaths[0]
    try {
      // pop persistent dialog that should stay up until end of job, receive
      // progress notifications, etc.
      const id = 'slicerDialog'
      if (!$(`#${id}`).length) {
        const h = `<div id="${id}" style="display:none;width:600px;">`
        const div = $(h).appendTo(this.screen.container)
        div.append('Starting to slice...')
      }
      this.slicerDialog = Dlg.tempDialogShow({ title: 'Map Slicing', theme: 'tpDialog' }, $(`#${id}`))
      const magick = this.settings.tools.magick
      const sliceCommand = this.settings.tools.sliceCommand
      const prefix = 'aSplitMapMyPrefix-'
      const tileSize = 256
      const identifyData = await window.handy.identifyImage({ fp, magick })
      console.dir(identifyData)
      this.busyDoing = ''
      const mapJsonFile = await window.handy.sliceBigMap({ fp, magick, sliceCommand, prefix, tileSize, identifyData })
      console.log(mapJsonFile)
      this.busyDoing = ''
      this.slicerDialog?.close()
      // const response = Dlg.prompt('Map processed. Load it?', ['Y', 'N'])
      // if (response !== 'Y') { return }
      // await loadMapJson2(mapJsonFile)
    } catch (error) {
      console.log('nah mate')
      console.log(error)
    }
  }

  async loadMapJson (fileIn) {
    try {
      async function pick () {
        const info = await pickFile()
        if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
        return info.filePaths[0]
      }
      const fp = fileIn || await pick()
      if (!fp) { return }
      const data = await loadJsonFile(fp)
      const pp = path.parse(fp)
      this.mapMan.loadMapData(data, filePathToMine(pp.dir), this.screen.scene, () => { this.redraw() })
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }

  async loadMapIcons () {
    try {
      const pg = this.screen.scene
      if (pg.getObjectByName('mapIconSets')) {
        throw Error('group named \'mapIconSets\' already exists')
      }
      const pi = await pickFile()
      if (pi.canceled || !Array.isArray(pi.filePaths) || !pi.filePaths.length || !pi.filePaths[0]) return
      const fp = pi.filePaths[0]
      const lines = await loadTextFileLines(fp)
      const data = this.mapMan.iconsFromText(lines)
      const mapIconSets = new THREE.Group()
      mapIconSets.name = 'mapIconSets'
      this.screen.scene.add(mapIconSets)
      const fld = this.gui.addFolder('mapIconSets')
      fld.add(mapIconSets, 'visible')
      fld.onChange(() => { this.redraw() })
      for (const [k, v] of Object.entries(data.mapIds)) {
        const g = new THREE.Group()
        g.name = k
        g.userData = v
        mapIconSets.add(g)
        const fld2 = fld.addFolder(k)
        fld2.add(g, 'visible')
        fld2.add(g, 'userData').disable()
      }
      this.mapMan.addCoolIcons(data.myCoolIcons, mapIconSets)
      const v = 0.017
      const p = {
        scaleFactor: v,
        iconType: 'all',
        translate: {
          x: 0,
          y: 31.5,
          z: 0,
        }
      }
      const d = p.translate
      mapIconSets.scale.set(v, -v, v)
      mapIconSets.position.set(d.x, d.y, d.z)
      const allIconTypes = ['all', ...Object.keys(data.iconTypes)]
      fld.add(p, 'iconType', allIconTypes).onChange((v) => {
        for (const map of mapIconSets.children) {
          for (const icon of map.children) {
            icon.visible = (v === 'all' || icon.userData?.iconType === v)
          }
        }
      })
      fld.add(p, 'scaleFactor', 0.010, 0.050, 0.001).onChange((v) => {
        mapIconSets.scale.set(v, -v, v)
      })
      fld.add(p.translate, 'x').onChange((v) => {
        mapIconSets.position.setX(v)
      })
      fld.add(p.translate, 'y').onChange((v) => {
        mapIconSets.position.setY(v)
      })
      this.mapIconSets = mapIconSets
    } catch (error) {
      Dlg.errorDialog(error)
    }
    this.redraw()
  }
}
