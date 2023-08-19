import * as THREE from 'three'
import $ from 'jquery'
import yaml from 'js-yaml'
import Stats from 'three/addons/libs/stats.module.js'
import ntc from '@yatiac/name-that-color'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Howl, Howler } from 'howler'
import { Screen } from './Screen'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MapMan } from './WorldMap'
import { GamepadManager } from './GamepadManager'
import { pathParse, pathJoin, readDir, pickFile, loadJsonFile, loadTextFileLines, outputFile } from './HandyApi'
import { filePathToMine } from './util'
import { exampleConfig } from './config'
import { Dlg } from './dlg'
import destroyedSound from '../sounds/Destroyed.mp3'

async function pick () {
  const info = await pickFile()
  if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
  return info.filePaths[0]
}

class Bong {
  constructor (appDiv) {
    this.settings = loadSettings('eldenBong', exampleConfig)
    this.screen = new Screen(appDiv)
    const c = this.screen
    this.gpm = new GamepadManager(this.screen)
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
        background: {
          colour: '#aa00ff',
          x11Colour: '',
          skyBox: '',
        }
      },
    }
    this.mapMan = new MapMan()
    // track what we are busy doing here - enforce only one job at a time...
    this.busyDoing = ''
    this.slicerDialog = null
    {
      const fld = this.gui.addFolder('Maps')
      fld.add(this, 'sliceBigMap').name('slice big map')
      fld.add(this, 'loadMapJson').name('load map json')
      fld.add(this, 'loadItemsScrape')
    }
    {
      const fld = this.gui.addFolder('Character') // .close()
      fld.add(this, 'testLoadCharacter')
    }
    {
      const fld = this.gui.addFolder('Test') // .close()
      fld.add(this, 'youDiedWithSound')
      fld.add(this, 'youDiedFadeIn')
      fld.add(this, 'testDialog')
      fld.add(this, 'testConfirmDialog')
      fld.add(this, 'testDialogAsync')
      fld.add(this, 'testIdentify')
    }
    {
      const fld = this.gui.addFolder('Settings').close()
      fld.add(this.settings.tools, 'magick')
      fld.add(this.settings.tools, 'sliceCommand')
      fld.add(this, 'resetSettings').name('restore defaults')
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
    const overlay = $('<div id="overlay"><div id="you-died">YOU DIED</div></div>').appendTo('body')
    overlay.on('click', this.youDiedFadeOut.bind(this))
  }

  async testLoadCharacter () {
    const fp = await pick()
    if (!fp) { return }
    const u = filePathToMine(fp)
    console.log(u)
    const scene = this.screen.scene
    const e = scene.getObjectByName('character')
    if (e) {
      Dlg.errorDialog('character already loaded')
      return
    }
    const loader = new GLTFLoader()
    loader.load(u, function (g) {
      scene.add(g.scene)
    }, undefined, function (error) {
      console.error(error)
    })
  }

  async testConfirmDialog () {
    const res = await Dlg.awaitableConfirmDialog('this is the message', 'TITLE!')
    console.dir(res)
  }

  youDiedWithSound () {
    const sound = new Howl({ src: [destroyedSound] })
    sound.play()
    this.youDiedFadeIn()
  }

  youDiedFadeOut () {
    $('#you-died').fadeOut(1400, () => { $('#overlay').css('display', 'none') })
  }

  youDiedFadeIn () {
    $('#overlay').css('display', 'block')
    $('#you-died').fadeIn(2000)
  }

  // TODO make this an event listener interface?
  notifyFromMain (event, topic, msg) {
    // specifics for job topics...
    if (topic === 'sliceBigMap') {
      console.log('main: ', topic, msg)
      // TODO find progress bar and update it
      if (this.slicerDialog) {
        // get the content and replace it
        let p = msg.replace('stdout: ', '')
        p = p.replace(topic, '')
        this.slicerDialog.setContent(`progress: ${p}`, true)
      }
      return
    }
    console.log('main process says: ', topic, msg)
  }

  async sliceBigMap () {
    if (this.busyDoing) {
      Dlg.errorDialog('busy doing something else!')
      return
    }
    const fp = await pick()
    if (!fp) { return }
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

  async testIdentify () {
    const fp = await pick()
    if (!fp) { return }
    const magick = this.settings.tools.magick
    try {
      const result = await window.handy.identifyImage({ fp, magick })
      console.dir(result)
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }

  async loadMapJson () {
    try {
      const fp = await pick()
      if (!fp) { return }
      const data = await loadJsonFile(fp)
      const pp = await pathParse(fp)
      this.mapMan.loadMapData(data, filePathToMine(pp.dir), this.screen.scene)
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }

  async loadItemsScrape () {
    try {
      const fp = await pick()
      if (!fp) { return }
      const lines = await loadTextFileLines(fp)
      const k = {
        hasThat: 0,
        img: 0,
        matches: 0,
        mapIds: {},
        iconTypes: {},
      }
      const incProp = (obj, propName) => {
        if (obj[propName] === undefined) {
          obj[propName] = 1
        } else {
          obj[propName]++
        }
      }

      const myCoolIcons = {}
      for (let i = 0; i < lines.length; i++) {
        const s2 = lines[i]
        // const s2 = 'whatever'
        if (s2.startsWith('<img src=')) {
          // <img src="/file/Elden-Ring/map-d8dc59f2-67df-452e-a9ea-d2c00ddc3a2b/maps-icons/shield.png" class="leaflet-marker-icon leaflet-zoom-animated leaflet-interactive" title="Inverted Hawk Heater Shield" alt="5720-Inverted Hawk Heater Shield" tabindex="0" style="margin-left: 0px; margin-top: 0px; width: 40px; height: 40px; transform: translate3d(524px, 738px, 0px); z-index: 738;">
          k.img++
          const bits = s2.match(/^<img src="\/file\/Elden-Ring\/map-([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})\/maps-icons\/([A-Za-z0-9]+\.[A-Za-z0-9]+)" class=".*" title="(.*)" alt="(.*)" tabindex=.* transform: translate3d\(([A-Za-z0-9]+, [A-Za-z0-9]+), [A-Za-z0-9]+\);/)
          if (!bits) {
            incProp(k, 'imgButNoMatch')
          } else {
            k.matches++
            incProp(k.mapIds, bits[1])
            incProp(k.iconTypes, bits[2])
            const [_fullLine, mapId, iconType, title, id, position] = [...bits]
            myCoolIcons[id] = { id, mapId, iconType, title, position }
          }
        }
        if (s2.includes('/file/Elden-Ring/map-')) {
          k.hasThat++
        }
      }
      console.dir(k)
      this.mapMan.addCoolIcons(myCoolIcons, this.screen.scene)
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }

  testDialog () { Dlg.errorDialog("that wasn't great!") }

  async testDialogAsync () {
    await Dlg.awaitableDialog('this is the first dialog', 'dialog1')
    await Dlg.awaitableDialog('this is the second dialog', 'dialog2')
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
      const s = this.gui.addFolder('Scene').close()
      const sp = this.PROPS.scene
      const x11ColourNames = { ...THREE.Color.NAMES }
      {
        const fld = s.addFolder('Fog')
        fld.add(sp.fog, 'enabled').onChange(v => { this.screen.scene.fog = v ? this.fog : null })
        fld.addColor(this.fog, 'color')
        fld.add(this.fog, 'near')
        fld.add(this.fog, 'far')
      }
      {
        const fld = s.addFolder('Background')
        const con = fld.add(sp.background, 'x11Colour', x11ColourNames).onChange(v => {
          this.screen.scene.background = new THREE.Color(v)
          // sp.background.colour =
        })
        fld.addColor(sp.background, 'colour').onChange(v => {
          this.screen.scene.background = new THREE.Color(v)
          const nc = ntc(v)
          sp.background.x11Colour = nc.colorName
          con.updateDisplay()
        })
        fld.add(sp.background, 'skyBox')
        // TODO when ready, load user-saved sky boxes from some dir somewhere
      }
      {
        const fld = s.addFolder('Grid')
        fld.add(sp.grid, 'visible').onChange(v => {
          const g = this.screen.scene.getObjectByName('grid')
          if (g) g.visible = v
        })
      }
      {
        const fld = s.addFolder('Axes')
        fld.add(sp.axes, 'visible').onChange(v => {
          const g = this.screen.scene.getObjectByName('axesHelper')
          if (g) g.visible = v
        })
      }
      {
        const fld = s.addFolder('Demo Cube')
        fld.add(sp.demoCube, 'rotating')
        fld.add(sp.demoCube, 'visible').onChange(v => {
          const g = this.screen.scene.getObjectByName('demoCube')
          if (g) g.visible = v
        })
      }
      s.onChange(() => { this.screen.forceRedraw = true })
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
