import * as THREE from 'three'
import $ from 'jquery'
import yaml from 'js-yaml'
import Stats from 'three/addons/libs/stats.module.js'
import ntc from '@yatiac/name-that-color'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Howl } from 'howler'
import { Screen } from './Screen'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MapMan } from './WorldMap'
import { GamepadManager } from './GamepadManager'
import { pathParse, pickFile, loadJsonFile, loadTextFileLines, loadBinaryFile } from './HandyApi'
import { filePathToMine } from './util'
import { exampleConfig } from './config'
import { Dlg } from './dlg'
import { Mouse } from './Mouse'
import deathSound from '../sounds/Humanoid Fall.mp3'

async function pick () {
  const info = await pickFile()
  if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
  return info.filePaths[0]
}

const characterClasses = ['Dork', 'Nerd', 'Jerk', 'Goon', 'Jock', 'Geek', 'Wuss']
const locations = ['LameGrove', 'Weeping Peanuts', 'Learner Lakes', 'Kale-Eyed']

class Bong {
  constructor (appDiv) {
    this.settings = loadSettings('eldenBong', exampleConfig)
    this.screen = new Screen(appDiv)
    const c = this.screen
    this.gpm = new GamepadManager(this.screen)
    this.mouse = new Mouse(this.screen)
    this.raycaster = new THREE.Raycaster()
    this.mouse.doubleClickHandler = this.doubleClick.bind(this)
    this.mouse.singleClickHandler = this.singleClick.bind(this)
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
          rotating: false,
          visible: true,
        },
        background: {
          colour: '#aa00ff',
          x11Colour: '',
          skyBox: '',
        }
      },
      character: {
        className: 'Dork',
      }
    }
    this.mapMan = new MapMan()
    // track what we are busy doing here - enforce only one job at a time...
    this.busyDoing = ''
    this.slicerDialog = null
    c.scene.add(new THREE.AmbientLight())
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
    if (this.settings.autoLoadMap) {
      this.loadMapJson(this.settings.autoLoadMap)
    }
  }

  /**
   * Load a third-party character model and try to make it useful.
   * Add it to a new group called 'character'.
   * When loaded the user should be able to examine it and tweak it.
   * Get a list of animations and test them.
   * When user is happy with their edits they can save it in a known game format.
   */
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
    // The GLTF loader doesn't like the mine URL type - texture loader seemed OK with it though!
    // Load the file in main as binary and pass the ArrayBuffer
    const buffer = await loadBinaryFile(fp)
    loader.parse(buffer.buffer, '', function (gObj) {
      const charGroup = new THREE.Group()
      charGroup.name = 'character'
      // TODO Are we guaranteed a scene? It looks like there can be multiple scenes in the GLTF
      // For the ones I have here, the scene is the model
      charGroup.add(gObj.scene)
      // the object contains the animations and other stuff which may be useful!
      charGroup.userData = gObj
      // need to rotate it upright for some reason, despite Z-up everywhere!
      gObj.scene.rotateX(Math.PI / 2)
      scene.add(charGroup)
    }, undefined, function (error) {
      console.error(error)
    })
  }

  deleteCharacter () {
    const scene = this.screen.scene
    const e = scene.getObjectByName('character')
    if (!e) { return }
    depthFirstReverseTraverse(null, e, generalObj3dClean)
    e.removeFromParent()
  }

  async testConfirmDialog () {
    const res = await Dlg.awaitableConfirmDialog('this is the message', 'TITLE!')
    console.dir(res)
  }

  youDiedWithSound () {
    const sound = new Howl({ src: [deathSound] })
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

  async loadMapJson (fileIn) {
    try {
      const fp = fileIn || await pick()
      if (!fp) { return }
      const data = await loadJsonFile(fp)
      const pp = await pathParse(fp)
      this.mapMan.loadMapData(data, filePathToMine(pp.dir), this.screen.scene, () => { this.screen.forceRedraw = true })
      this.screen.forceRedraw = true
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
      const fp = await pick()
      if (!fp) { return }
      const lines = await loadTextFileLines(fp)
      const data = this.mapMan.iconsFromText(lines)
      const mapIconSets = new THREE.Group()
      mapIconSets.name = 'mapIconSets'
      this.screen.scene.add(mapIconSets)
      const fld = this.gui.addFolder('mapIconSets')
      fld.add(mapIconSets, 'visible')
      fld.onChange(() => { this.screen.forceRedraw = true })
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
    this.screen.forceRedraw = true
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
      const fld = this.gui.addFolder('Maps') // .close()
      fld.add(this, 'sliceBigMap').name('slice big map')
      fld.add(this, 'loadMapJson').name('load map json')
      fld.add(this, 'loadMapIcons').name('load map icons')
      const loc = {
        location: locations[0]
      }
      fld.add(loc, 'location', locations)
    }
    {
      const fld = this.gui.addFolder('Character').close()
      fld.add(this, 'testLoadCharacter')
      fld.add(this, 'deleteCharacter')
      fld.add(this.PROPS.character, 'className', characterClasses)
    }
    {
      const fld = this.gui.addFolder('Test').close()
      fld.add(this, 'youDiedWithSound')
      fld.add(this, 'youDiedFadeIn')
      fld.add(this, 'testDialog')
      fld.add(this, 'testConfirmDialog')
      fld.add(this, 'testDialogAsync')
      fld.add(this, 'testIdentify')
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
        const con = fld.add(sp.background, 'x11Colour', x11ColourNames).name('cname').onChange(v => {
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
      {
        const fld = this.gui.addFolder('Settings').close()
        fld.add(this.settings.tools, 'magick')
        fld.add(this.settings.tools, 'sliceCommand')
        fld.add(this.settings, 'autoLoadMap')
        fld.add(this, 'resetSettings').name('restore defaults')
        fld.onFinishChange(() => { saveTheseSettings('eldenBong', this.settings) })
      }

      s.onChange(() => { this.screen.forceRedraw = true })
    }
  }

  resetSettings () {
    this.settings = saveTheseSettings('eldenBong', exampleConfig)
  }

  singleClick (ev, mousePos) {
    // console.log(mousePos)
    this.raycaster.setFromCamera(mousePos, this.screen.camera)
    // TODO modes of operation
    const clickable = this.mapIconSets
    if (!clickable) { return }
    const hits = this.raycaster.intersectObject(clickable)
    if (hits.length) {
      console.dir(hits)
      const h = hits[0]
      if (h.object?.name) {
        console.log(h.object.name)
      }
    }
  }

  doubleClick (ev, mousePos) {
    console.log(mousePos)
  }
}

// -----------------------------------------------------------------------------
// TODO do these functions belong elsewhere?

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

function generalObj3dClean (p, o) {
  if (!o) { return }
  if (o.geometry && o.geometry.dispose instanceof Function) {
    o.geometry.dispose()
  }
  if (o.material) {
    if (o.material.dispose instanceof Function) {
      o.material.dispose()
    }
  }
  if (p && p.children && o.parent === p && o.parent.remove instanceof Function) {
    o.parent.remove(o)
  }
}

/**
 * Helper function to traverse a tree depth first in reverse order (so that is is safe to remove an element from the nest within the callback)
 *
 * @param {object} p a parent object with a children array
 * @param {object} o an object that is a child of a parent(!)
 * @param {Function} cb a callback to do whatever
 */
function depthFirstReverseTraverse (p, o, cb) {
  if (o.children instanceof Array) {
    const len = o.children.length
    for (let i = len - 1; i >= 0; i--) {
      depthFirstReverseTraverse(o, o.children[i], cb)
    }
  }
  cb(p, o)
}

export { Bong }
