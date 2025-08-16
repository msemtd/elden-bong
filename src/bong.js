import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/addons/libs/stats.module.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import $ from 'jquery'
import { Howl } from 'howler'
// cSpell:ignore yatiac, kanjivg
import ntc from '@yatiac/name-that-color'
import { path } from 'path-browserify'

import { Screen } from './Screen'
import { MapMan } from './WorldMap'
import { GamepadManager } from './GamepadManager'
import { pickFile, loadJsonFile, loadTextFileLines, loadBinaryFile, loadTextFile, shellOpenExternal } from './HandyApi'
import { filePathToMine, isInputEvent } from './util'
import { defaultSettings, loadSettings, saveTheseSettings, distributeSettings } from './settings'
import { Dlg } from './dlg'
import { Mouse } from './Mouse'
import { bongData } from './bongData'
import { VanStuff } from './VanStuff'
import { UserControls } from './Controls'
import { MiniGames } from './MiniGames'
import { depthFirstReverseTraverse, generalObj3dClean, addGrid } from './threeUtil'
import deathSound from '../sounds/Humanoid Fall.mp3'
import { isInteger } from './wahWah'
import { FileDrop } from './FileDrop'

async function pick () {
  const info = await pickFile()
  if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
  return info.filePaths[0]
}

const characterClasses = bongData.characterClasses
const regionNames = bongData.regions.map(x => x.name)

class Bong extends THREE.EventDispatcher {
  constructor (appDiv) {
    super()
    this.settings = loadSettings('eldenBong', defaultSettings)
    distributeSettings(this.settings)
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
    // Now then, do we grab key events from the main window or just the canvas?
    // And how does the lil-gui respect this?
    // https://github.com/georgealways/lil-gui/pull/138#issuecomment-2381385272
    // currently, a button pressed in lil-gui will keep focus even when the canvas is explicitly given focus after click events somehow!
    document.addEventListener('keydown', (e) => { this.onKeyDown(e) })
    //  * Some things in the GUI need to be persisted in config.
    //  * Some things are temporary.
    //  * Some things drive THREE objects.
    this.PROPS = {
      resetCamera: () => { c.cameraControls.reset() },
      scene: {
        // This is probably a bad idea - the settings are too volatile
        // TODO use a real state system like redux!
        ...this.settings.scene,
      },
      character: {
        className: 'Dork',
      },
      // this needs to be validated surely?
      gameState: { ...this.settings.gameState },
    }
    this.mapMan = new MapMan()
    this.mapModeData = null
    // track what we are busy doing here - enforce only one job at a time...
    this.busyDoing = ''
    this.slicerDialog = null
    // Lighting
    {
      const intensity = 1.0
      const dl = new THREE.DirectionalLight(0xffffff, 5)
      dl.position.set(50, 100, 75)
      c.scene.add(dl)
      const skyColor = 0xB1E1FF // light blue
      const groundColor = 0xB97A20 // brownish orange
      const light = new THREE.HemisphereLight(skyColor, groundColor, intensity)
      light.name = 'light'
      c.scene.add(light)
      this.light = light
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
    this.fileDrop = new FileDrop()
    this.fileDrop.init(c.container, (filePaths) => {
      console.log('file drop: ', filePaths)
    })
    // this.addDemoCube(c)
    this.miniGames = null
    this.makeGui()
    // this.gui.close()
    const overlay = $('<div id="overlay"><div id="you-died">YOU DIED</div><div id="region-intro" class="big-elden-text">This Region!</div></div>').appendTo('body')
    overlay.on('click', this.youDiedFadeOut.bind(this))
    setTimeout(this.whenReady.bind(this), 30)
  }

  onKeyDown (ev) {
    if (isInputEvent(ev)) {
      console.log('apparently an input event')
    }
    // give mini-games the first refusal...
    if (this.miniGames?.onKeyDown(ev)) {
      return true
    }
    console.log('bong ev.key: <' + ev.key + '>')
    if (ev.key === 'Escape') {
      // TODO special mode changes etc. drop to default mode?
    }
    return false
  }

  makeGui () {
    this.gui.add(this.light, 'intensity', 0, 15, 0.01).onChange(this.redraw.bind(this))
    {
      const fld = this.gui.addFolder('Base Actions').close()
      fld.add(this.PROPS, 'resetCamera')
      fld.add(this, 'mapMode')
      fld.add(this, 'mapModeOff')
      fld.add(this, 'characterMode')
      fld.add(this, 'characterModeOff')
    }
    {
      const fld = this.gui.addFolder('Maps').close()
      fld.add(this, 'sliceBigMap').name('slice big map')
      fld.add(this, 'loadMapJson').name('load map json')
      fld.add(this, 'loadMapIcons').name('load map icons')
      const loc = {
        location: regionNames[this.PROPS.gameState.region]
      }
      fld.add(loc, 'location', regionNames).onChange(v => {
        const i = regionNames.findIndex(x => x === v)
        this.changeRegionByNumber(i)
      })
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
      fld.add(this, 'loadTokyo')
      fld.add(this, 'loadE57')

      // fld.add(this.moanSwooper, 'runTestBomb').name('moanSwooper test bomb')
      // fld.add(this.moanSwooper, 'runTest').name('moanSwooper test 1')
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
        const rotMap = { '0 deg': 0, '90 deg': Math.PI / 2, '180 deg': Math.PI, '270 deg': Math.PI * 3 / 2 }
        const setRot = () => {
          this.screen.scene.backgroundRotation?.set(sp.background.rotateX, sp.background.rotateY, sp.background.rotateZ)
          this.redraw()
        }
        fld.add(sp.background, 'rotateX', rotMap).onChange(v => { setRot() })
        fld.add(sp.background, 'rotateY', rotMap).onChange(v => { setRot() })
        fld.add(sp.background, 'rotateZ', rotMap).onChange(v => { setRot() })
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
          const g = this.screen?.scene?.getObjectByName('demoCube')
          if (g) g.visible = v
        })
      }
      {
        const fld = this.gui.addFolder('Settings').close()
        fld.onFinishChange(() => { saveTheseSettings('eldenBong', this.settings) })
        fld.add(this.settings.tools, 'magick')
        fld.add(this.settings.tools, 'sliceCommand')
        fld.add(this.settings, 'autoLoadMap')
        fld.add(this.settings, 'autoRunMiniGame')
        const sub = fld.addFolder('onScreen').onFinishChange(() => {
          this.updateOnScreenGubbins()
        })
        sub.add(this.settings.scene.onScreen, 'showTitleText')
        sub.add(this.settings.scene.onScreen, 'showControllerSvg')
        sub.add(this.settings.scene.onScreen, 'showCameraPosition')
        fld.add(this, 'resetSettings').name('⚠️ Restore Default Settings! ⚠️')
      }
      {
        this.gui.addFolder('Mini-Games') // .close()
        const fld = this.gui.addFolder('Help').close()
        fld.add(this, 'helpAbout').name('About')
      }

      s.onChange(() => { this.redraw() })
    }
  }

  resetSettings () {
    console.log('reset settings to defaults')
    this.settings = saveTheseSettings('eldenBong', defaultSettings)
  }

  helpAbout () {
    // TODO - show a dialog with attribution, links, etc.
    console.warn('TODO help about')
  }

  whenReady () {
    this.updateOnScreenGubbins()
    // this.moanSwooper.runTestBomb()
    if (this.settings.autoLoadMap) {
      this.loadMapJson(this.settings.autoLoadMap)
    }
    if (this.settings?.gameState) {
      this.restoreGameState(this.settings.gameState)
    }
    this.miniGames = new MiniGames(this)
    if (this.settings.autoRunMiniGame) {
      this.miniGames.autoRunMiniGame = this.settings.autoRunMiniGame
    }
    // OK, now we provide services to all listeners...
    this.dispatchEvent({
      type: 'ready',
      gui: this.gui,
      group: this.screen.scene,
      redrawFunc: this.redraw.bind(this),
      screen: this.screen,
    })
    this.redraw()
  }

  updateOnScreenGubbins () {
    // read from settings
    const s = this.settings.scene.onScreen
    if (s.showTitleText) {
      $('#elden').show()
    } else {
      $('#elden').hide()
    }
    if (s.showControllerSvg) {
      $('#gamePad').show()
    } else {
      $('#gamePad').hide()
    }
    if (s.showCameraPosition) {
      $('#camInfo').show()
    } else {
      $('#camInfo').hide()
    }
  }

  testVanStuff () {
    const v = new VanStuff()
    v.testModal()
  }

  // this should be a generic interactive GLTF loading thing (like the character loader below) -
  // - ask the target group and show a tree of items to load from the GLTF scene
  // - or as we do here, load everything into a new group
  // - then allow user to save the params for loading next time
  // - with a transform etc.
  async loadTokyo () {
    const fp = await pick()
    if (!fp) { return }
    const u = filePathToMine(fp)
    console.log(u)
    const scene = this.screen.scene
    const e = scene.getObjectByName('tokyo')
    if (e) {
      Dlg.errorDialog('tokyo already loaded')
      return
    }
    const manager = new THREE.LoadingManager()
    const loader = new GLTFLoader(manager)
    const buffer = await loadBinaryFile(fp)
    loader.parse(buffer.buffer, '', (gObj) => {
      const g = new THREE.Group()
      g.name = 'tokyo'
      // TODO Are we guaranteed a scene? It looks like there can be multiple scenes in the GLTF
      // For the ones I have here, the scene is the model
      g.add(gObj.scene)
      scene.add(g)
      this.redraw()
    }, undefined, function (error) {
      console.error(error)
    })
  }

  async loadE57 () {
    const fp = await pick()
    if (!fp) { return }
    console.log(fp)
    const info = await window.handy.readE57(fp)
    console.dir(info)
  }

  static openExternal (url) {
    shellOpenExternal(url)
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

  restoreGameState (gameState) {
    // given this gameState, set props, and make it so

    // region number
    this.changeRegionByNumber(gameState.region)
  }

  changeRegionByNumber (n) {
    console.log(`change region to ${n}`)
    const inRange = (isInteger(n) && n >= 0 && n < regionNames.length)
    console.assert(inRange)
    if (!inRange) { return }
    // do the location banner thing briefly
    // put the overlay up briefly but allow click-through somehow!
    // want a boom sound
    this.PROPS.gameState.region = n
    const name = regionNames[n]
    $('#region-intro').text(name)
    $('#overlay').css('display', 'block')
    $('#region-intro').fadeIn(1000, () => {
      $('#region-intro').fadeOut(2000, () => {
        $('#overlay').css('display', 'none')
      })
    })
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
      this.setSkyBoxList(msg)
      if (this.settings.scene.background?.skyBox) {
        this.setSkyBox(this.settings.scene.background.skyBox)
      }
      console.dir(this.settings.scene)
      return
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
      // set the default skybox rotation here...
      scene.backgroundRotation?.set(Math.PI / 2, 0, 0)
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

  singleClick (ev, mousePos) {
    this.raycaster.setFromCamera(mousePos, this.screen.camera)
    // TODO modes of operation
    // TODO this.moanSwooper.intersect(this.raycaster, ev)
    if (this.miniGames.stealIntersectForGame(ev, mousePos, this.raycaster)) {
      return
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
    // offer up double click for use by mini games
    this.raycaster.setFromCamera(mousePos, this.screen.camera)
    if (this.miniGames.offerDoubleClick(ev, mousePos, this.raycaster)) {
      return
    }
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
    // TODO: setting for kanjivg folder
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

export { Bong }
