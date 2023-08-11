import * as THREE from 'three'
import { CanvasThree } from './CanvasThree'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import yaml from 'js-yaml'
import { MapMan } from './WorldMap'
import { pathParse, pathJoin, readDir, pickFile, loadJsonFile, loadTextFileLines, outputFile } from './HandyApi'
import * as util from './util'
import { exampleConfig } from './config'
import { Dlg } from './dlg'

class Bong {
  constructor (appDiv) {
    this.settings = loadSettings('eldenBong', exampleConfig)
    this.canvas = new CanvasThree(appDiv)
    const c = this.canvas
    // Right now I want to see if I can define my whole GUI in just lil-gui and
    // a few dialog boxes
    this.gui = new GUI({ width: 310 })
    //  * Some things in the GUI need to be persisted in config.
    //  * Some things are temporary.
    //  * Some things drive THREE objects.
    this.PROPS = {
      resetCamera: () => { c.cameraControls.reset() },
      scene: {
        fog: {
          enabled: true,
        },
        grid: {
          visible: true,
          size: 100,
          divisions: 100,
        },
        axes: {
          visible: true,
        },
        demoCube: {
          rotating: true,
          visible: true,
        },
      },
    }
    this.mapMan = new MapMan()
    {
      const fld = this.gui.addFolder('Settings').close()
      fld.add(this.settings.tools, 'magick')
      fld.add(this.settings.tools, 'sliceCommand')
      fld.add(this, 'resetSettings').name('restore defaults')
    }
    // track what we are busy doing here - enforce only one job at a time...
    this.busyDoing = ''
    {
      const fld = this.gui.addFolder('Maps')
      fld.add(this, 'testDialog')
      fld.add(this, 'testIdentify')
      fld.add(this, 'sliceBigMap').name('import big map')
      // fld.add(this, 'loadItemsScrape')
      // fld.add(this, 'loadMapJson')
      // addMapTiles: () => { this.mapMan.loadMap(c.scene) },
      // fld.add(this, 'saveMapDef')
    }
    this.fog = new THREE.Fog(0x444444, 10, 200)
    c.scene.fog = this.fog
    addGrid(c.scene)
    {
      const axesHelper = new THREE.AxesHelper(5)
      axesHelper.name = 'axesHelper'
      c.scene.add(axesHelper)
    }
    this.addStats(c)
    this.addCamInfo(c)
    this.addDemoCube(c)
    this.makeGui()
  }

  /**
   * Further Setup with config files, etc.
   */
  hello () {

    // set resource dir or set map dir
    // set tools dir
    // get imageMagick
    // get other tools
    // dirs for icons, sounds, models, etc.
    // cube map backgrounds
    // routes for map
    // general dir picker and file picker in GUI
    // external hyperlinks with shell.openExternal(url)
    // shell.showItemInFolder(fullPath)
  }

  notifyFromMain (event, topic, msg) {
    // specifics for job topics...
    if (topic === 'sliceMapJob') {
      console.log('main sliceMapJob says: ', topic, msg)
      return
    }
    console.log('main process says: ', topic, msg)
  }

  async sliceBigMap () {
    const info = await pickFile()
    console.log('file picked: ', info)
    if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
    const fp = info.filePaths[0]
    const magick = this.settings.tools.magick
    const sliceCommand = this.settings.tools.sliceCommand
    const prefix = 'aSplitMapMyPrefix-'
    try {
      this.busyDoing = await window.handy.sliceBigMap({ fp, magick, sliceCommand, prefix })
    } catch (error) {
      console.log('nah mate')
      console.log(error)
    }
  }

  async testIdentify () {
    const info = await pickFile()
    console.log('file picked: ', info)
    if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
    const fp = info.filePaths[0]
    const magick = this.settings.tools.magick
    try {
      const result = await window.handy.identifyImage({ fp, magick })
      console.dir(result)
    } catch (error) {
      this.errorDialog(error)
    }
  }

  async renameMapTiles () {
    // TODO auto when complete map tiles slice
    const info = await pickFile()
    console.log('file picked: ', info)
    if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
    const fp = info.filePaths[0]
    const pp = pathParse(fp)
    const myPrefix = 'aSplitMapMyPrefix-'
    const postfix = '.png'
    const result = await window.handy.renameMapTiles(pp.pir, myPrefix, postfix)
    console.dir(result)
  }

  async loadMapJson () {
    // pick file, load it, assign name if no name, make GUI folder for it!
    try {
      console.log('load map definition file')
      const info = await pickFile()
      console.log('file picked: ', info)
      if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
      const fp = info.filePaths[0]
      const json = await loadJsonFile(fp)
      console.log(json)
      const pp = await pathParse(fp)
      console.dir(pp.dir)
      const files = await readDir(pp.dir)
      const prefix = 'map-00-overworld-tile256-'
      const postfix = '.png'
      const tilesX = 38
      const tilesY = 36
      const logicalTileCount = tilesX * tilesY
      const tiles = files.filter(f => f.startsWith(prefix) && f.endsWith(postfix))
      console.dir(tiles)
      const xyToIndex = (x, y, tilesX, tilesY) => {
        return ((tilesY - y - 1) * tilesX) + x
      }
      const xyFmt = (x, y, pad) => {
        return `x${util.leftFillNum(x, pad)}-y${util.leftFillNum(y, pad)}`
      }
      console.log(`logicalTileCount: ${logicalTileCount}`)
      if (tiles.length !== logicalTileCount) {
        console.log(`map logicalTileCount not OKAY: ${tiles.length}`)
        return
      }
      const renames = []
      for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
          const idx = xyToIndex(x, y, tilesX, tilesY)
          const d = util.leftFillNum(idx, 4)
          const fOld = `${prefix}${d}${postfix}`
          const fNew = `map-00-overworld-tile256-${xyFmt(x, y, 2)}.png`
          renames.push(`mv ${fOld} ${fNew}`)
        }
      }
      const script = renames.join('\n')

      console.log(script)
    } catch (error) {
      this.errorDialog(error)
    }
  }

  async loadItemsScrape () {
    try {
      console.log('load items scraped text file')
      const info = await pickFile()
      console.log('file picked: ', info)
      if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
      const fp = info.filePaths[0]
      console.log(fp)
      const lines = await loadTextFileLines(fp)
      console.log(lines)
    } catch (error) {
      this.errorDialog(error)
    }
  }

  async saveMapJson (map) {

  }

  testDialog () {
    Dlg.errorDialog("that wasn't great!")
  }

  addStats (c) {
    const stats = new Stats()
    c.container.appendChild(stats.dom)
    stats.domElement.style.cssText = 'position:absolute;top:40px;left:10px;'
    c.addMixer('stats', (_delta) => {
      stats.update()
      return false
    })
  }

  addCamInfo (c) {
    const camInfo = document.getElementById('camInfo')
    const dp = 2
    const timer = setInterval(() => {
      if (c.camInfo.count) {
        const p = c.camInfo.position
        const t = c.camInfo.target
        const s = `position: ${p.x.toFixed(dp)}, ${p.y.toFixed(dp)}, ${p.z.toFixed(dp)} target: ${t.x.toFixed(dp)}, ${t.y.toFixed(dp)}, ${t.z.toFixed(dp)} `
        c.camInfo.count = 0
        camInfo.textContent = s
        // console.log(s)
      }
    }, 100)
    c.updateCamInfo()
  }

  addDemoCube (c) {
    const p = this.PROPS.scene.demoCube
    const geometry = new THREE.BoxGeometry(1.2, 1.2, 0.5)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    const cube = new THREE.Mesh(geometry, material)
    cube.name = 'demoCube'
    c.scene.add(cube)
    c.addMixer('demoCube', (_delta) => {
      if (!p.rotating) return false
      // cube.rotation.x += 0.01;
      cube.rotation.z += 0.01
      return true
    })
  }

  makeGui () {
    {
      const fld = this.gui.addFolder('Base Actions')
      fld.add(this.PROPS, 'resetCamera')
    }
    {
      const s = this.gui.addFolder('Scene')
      const sp = this.PROPS.scene
      {
        const fld = s.addFolder('Fog')
        fld.add(sp.fog, 'enabled').onChange(v => { this.canvas.scene.fog = v ? this.fog : null })
        fld.addColor(this.fog, 'color')
        fld.add(this.fog, 'near')
        fld.add(this.fog, 'far')
      }
      {
        const fld = s.addFolder('Grid')
        fld.add(sp.grid, 'visible').onChange(v => {
          const g = this.canvas.scene.getObjectByName('grid')
          if (g) g.visible = v
        })
      }
      {
        const fld = s.addFolder('Axes')
        fld.add(sp.axes, 'visible').onChange(v => {
          const g = this.canvas.scene.getObjectByName('axesHelper')
          if (g) g.visible = v
        })
      }
      {
        const fld = s.addFolder('Demo Cube')
        fld.add(sp.demoCube, 'rotating')
        fld.add(sp.demoCube, 'visible').onChange(v => {
          const g = this.canvas.scene.getObjectByName('demoCube')
          if (g) g.visible = v
        })
      }
      s.onChange(() => { this.canvas.forceRedraw = true })
    }
  }

  resetSettings () {
    this.settings = saveTheseSettings('eldenBong', exampleConfig)
  }
}

function addGrid (scene) {
  const width = 100
  const gridPos = new THREE.Vector3(0, 0, 0)
  const gridVisible = true

  const grid = new THREE.GridHelper(width, width)
  grid.geometry.rotateX(Math.PI / 2)

  grid.position.copy(gridPos)
  grid.name = 'grid'
  grid.visible = gridVisible
  scene.add(grid)
}

function loadSettings (localStorageKey, defaultSettings) {
  let settings = structuredClone(defaultSettings)
  const sy = localStorage.getItem(localStorageKey)
  if (!sy) { return saveTheseSettings(localStorageKey, defaultSettings) }
  try {
    settings = yaml.load(sy)
  } catch (error) {
    console.error(`failed to load settings key as YAML: ${error}`)
    return saveTheseSettings(localStorageKey, defaultSettings)
  }
  return settings
}

function saveTheseSettings (localStorageKey, settings) {
  localStorage.setItem(localStorageKey, yaml.dump(settings))
  return structuredClone(settings)
}

export { Bong }
