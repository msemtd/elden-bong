import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import $ from 'jquery'
import yaml from 'js-yaml'
import Stats from 'three/addons/libs/stats.module.js'
import ntc from '@yatiac/name-that-color'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { Howl } from 'howler'
import { Screen } from './Screen'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MapMan } from './WorldMap'
import { GamepadManager } from './GamepadManager'
import { pathParse, pickFile, loadJsonFile, loadTextFileLines, loadBinaryFile, loadTextFile } from './HandyApi'
import { filePathToMine } from './util'
import { exampleConfig } from './config'
import { Dlg } from './dlg'
import { Mouse } from './Mouse'
import { bongData } from './bongData'
import { VanStuff } from './VanStuff'
import { MoanSwooper } from './MoanSwooper/MoanSwooper'
import { CardsDude } from './CardsDude/CardsDude'
import deathSound from '../sounds/Humanoid Fall.mp3'
import { UserControls } from './Controls'
import { depthFirstReverseTraverse, generalObj3dClean } from './threeUtil'

async function pick () {
  const info = await pickFile()
  if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
  return info.filePaths[0]
}

const characterClasses = bongData.characterClasses
const locations = bongData.regions.map(x => x.name)

class Bong {
  constructor (appDiv) {
    this.settings = loadSettings('eldenBong', exampleConfig)
    this.distributeSettings()
    this.screen = new Screen(appDiv)
    const c = this.screen
    this.gpm = new GamepadManager(this.screen)
    this.mouse = new Mouse(this.screen)
    this.userControls = new UserControls(this.screen)
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
          skyBox: '...none',
          skyBoxList: ['...none'],
        }
      },
      character: {
        className: 'Dork',
      }
    }
    this.mapMan = new MapMan()
    this.mapModeData = null
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
    this.addMoanSwooper(c)
    this.makeGui()
    const overlay = $('<div id="overlay"><div id="you-died">YOU DIED</div></div>').appendTo('body')
    overlay.on('click', this.youDiedFadeOut.bind(this))
    if (this.settings.autoLoadMap) {
      this.loadMapJson(this.settings.autoLoadMap)
    }
  }

  testVanStuff () {
    const v = new VanStuff()
    v.testModal()
  }

  distributeSettings () {
    // send settings to components and have them validated!
    // quite especially pass settings to main process (which may cause other async events)
    window.settings.passSettingsToMain(this.settings)
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
    loader.parse(buffer.buffer, '', (gObj) => {
      const charGroup = new THREE.Group()
      charGroup.name = 'character'
      // TODO Are we guaranteed a scene? It looks like there can be multiple scenes in the GLTF
      // For the ones I have here, the scene is the model
      charGroup.add(gObj.scene)
      // the object contains the animations and other stuff which may be useful!
      charGroup.userData = gObj
      // need to rotate it upright for our Z-up...
      gObj.scene.rotateX(Math.PI / 2)
      scene.add(charGroup)
      this.redraw()
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
    this.redraw()
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
    if (topic === 'skyBoxList') {
      return this.setSkyBoxList(msg)
    }
    console.log('main process says: ', topic, msg)
  }

  async setSkyBox (v) {
    console.log('TODO setSkyBox: ', v)
    const scene = this.screen.scene
    if (scene.background?.isTexture) {
      scene.background.dispose()
    }
    if (v === '...none') {
      // TODO - chose previous colour
      scene.background = new THREE.Color(0xff0000)
      return
    }
    const urls = await window.handy.getSkyBoxMineUrlList(v)
    console.log(urls)
    new THREE.CubeTextureLoader().load(urls, (textureCube) => {
      scene.background = textureCube
      this.redraw()
    })
  }

  setSkyBoxList (va) {
    console.log('main process skyBoxList: ', va)
    if (!Array.isArray(va)) {
      throw Error('bad skyBoxList')
    }
    // find gui folder, inject options
    let fld = this.gui.folders.find(x => x._title === 'Scene')
    fld = fld?.folders.find(x => x._title === 'Background')
    const ctr = fld?.controllers.find(x => x._name === 'skyBox')
    if (!ctr) {
      console.warn('gui path not found')
      return
    }
    const o = ctr.object
    if (Array.isArray(o.skyBoxList)) {
      o.skyBoxList = ['...none', ...va]
      ctr.options(o.skyBoxList).onChange((v) => { this.setSkyBox(v) })
    } else {
      console.warn('gui not right!')
    }
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

  redraw () {
    this.screen.forceRedraw = true
  }

  async loadMapJson (fileIn) {
    try {
      const fp = fileIn || await pick()
      if (!fp) { return }
      const data = await loadJsonFile(fp)
      const pp = await pathParse(fp)
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
      const fp = await pick()
      if (!fp) { return }
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

  mapMode () {
    if (this.mapModeData) {
      return Dlg.errorDialog('mapMode already activated!')
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
      return Dlg.errorDialog('mapMode not activated!')
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

  characterMode () {
    if (this.mapModeData) {
      this.mapModeOff()
    }
    if (this.characterModeData) {
      return Dlg.errorDialog('characterMode already activated!')
    }
    const s = this.screen
    // target the character and be behind it
    // set up controls just so
    this.characterModeData = {
      // position and direction is implicit but animations need to be tracked
      loadedCharacter: s.scene.getObjectByName('character')
    }
    // add a mixer for live character movement
    s.addMixer('characterLive', (_delta) => {
      // read inputs - figure out what happened and act
      const redraw = this.userControls.characterActOnInputs(this.characterModeData?.loadedCharacter, _delta)
      return redraw
    })
  }

  characterModeOff () {
    if (!this.characterModeData) {
      return Dlg.errorDialog('characterMode not activated!')
    }
    // TODO whatever is required to do whatever
    this.characterModeData = null
    const s = this.screen
    s.removeMixer('characterLive')
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

  addMoanSwooper (c) {
    this.moanSwooper = new MoanSwooper()
    // we control the group - it controls its own group contents
    const g = new THREE.Group()
    g.name = 'MoanSwooper'
    g.position.set(2, -1, 1)
    g.scale.set(0.5, 0.5, 0.5)
    this.moanSwooper.group = g
    this.moanSwooper.resetThreeGroup()
    // s.addMixer('MoanSwooper', (_delta) => {
    //   return moanSwooper.update()
    // })
    c.scene.add(g)
    this.redraw()
  }

  makeGui () {
    {
      const fld = this.gui.addFolder('Base Actions')
      fld.add(this.PROPS, 'resetCamera')
      fld.add(this, 'mapMode')
      fld.add(this, 'mapModeOff')
      fld.add(this, 'characterMode')
      fld.add(this, 'characterModeOff')
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
      fld.add(this, 'generateLandscape')
      fld.add(this, 'trySomeSvg')
      fld.add(this, 'testVanStuff')
      fld.add(this.moanSwooper, 'runTest').name('moanSwooper test 1')
      // TODO -
      // enable/disable mixer
      // show/hide group
      // create/destroy group
      // position/scale
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
        fld.add(sp.background, 'skyBox', [sp.skyBoxList]).onChange(v => {
          this.setSkyBox(v)
        })
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

      s.onChange(() => { this.redraw() })
    }
  }

  resetSettings () {
    this.settings = saveTheseSettings('eldenBong', exampleConfig)
  }

  singleClick (ev, mousePos) {
    this.raycaster.setFromCamera(mousePos, this.screen.camera)
    // TODO modes of operation
    if (this.moanSwooper?.active) {
      return this.moanSwooper.intersect(this.raycaster, ev)
    }
    const clickable = this.mapIconSets
    if (!clickable) { return }
    const hits = this.raycaster.intersectObject(clickable)
    if (hits.length) {
      console.dir(hits)
      const h = hits[0]
      if (h.object?.name) {
        Dlg.popup(h.object.name)
      }
    }
  }

  doubleClick (ev, mousePos) {
    console.log(mousePos)
  }

  generateLandscape () {
    const p = this.screen.scene
    const nom = 'landscape'
    const existing = p.getObjectByName(nom)
    if (existing) {
      Dlg.errorDialog('landscape already exists')
      return
    }
    // TODO
    const floor = new THREE.PlaneGeometry(400, 400, 63, 63)
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })
    const plane = new THREE.Mesh(floor, material)
    const g = new THREE.Group()
    g.name = nom
    g.add(plane)
    p.add(g)
  }

  async trySomeSvg () {
    // get an SVG image from the custom URL
    const cp = '066f8'
    const kvgDir = 'C:\\Users\\msemt\\Documents\\dev\\kanjivg'
    const f = `${kvgDir}/kanji/${cp}.svg`
    const url = filePathToMine(f)
    const alreadyGotData = await loadTextFile(f)
    await this.loadSvg(url, this.screen.scene, alreadyGotData)
  }

  async loadSvg (url, scene, alreadyGotData) {
    // taken from https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_svg.html
    const guiData = {
      currentURL: '',
      drawFillShapes: true,
      drawStrokes: true,
      fillShapesWireframe: false,
      strokesWireframe: false
    }
    const loader = new SVGLoader()
    const callback = (data) => {
      const group = new THREE.Group()
      group.scale.multiplyScalar(0.1)
      group.position.x = 5
      group.position.y = 5
      group.position.z = 1
      group.scale.y *= -1
      let renderOrder = 0
      for (const path of data.paths) {
        const fillColor = path.userData.style.fill
        if (guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none') {
          const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setStyle(fillColor),
            opacity: path.userData.style.fillOpacity,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: guiData.fillShapesWireframe
          })
          const shapes = SVGLoader.createShapes(path)
          for (const shape of shapes) {
            const geometry = new THREE.ShapeGeometry(shape)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.renderOrder = renderOrder++
            group.add(mesh)
          }
        }
        const strokeColor = path.userData.style.stroke
        if (guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none') {
          const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setStyle(strokeColor),
            opacity: path.userData.style.strokeOpacity,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: guiData.strokesWireframe
          })
          for (const subPath of path.subPaths) {
            const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style)
            if (geometry) {
              const mesh = new THREE.Mesh(geometry, material)
              mesh.renderOrder = renderOrder++
              group.add(mesh)
            }
          }
        }
      }
      scene.add(group)
    }
    if (alreadyGotData) {
      const parsedData = loader.parse(alreadyGotData)
      callback(parsedData)
    } else {
      loader.load(url, callback)
    }
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

export { Bong }
