// cSpell:ignore yatiac
import ntc from '@yatiac/name-that-color'
import $ from 'jquery'
import path from 'path-browserify'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { AboutBox } from './AboutBox'
import { bongData } from './bongData'
import { UserControls } from './Controls'
import { Dlg } from './dlg'
import { FileDrop } from './FileDrop'
import { GamepadManager } from './GamepadManager'
import { loadBinaryFile, pickFile } from './HandyApi'
import { MiniGames } from './MiniGames'
import { Mouse } from './Mouse'
import { Screen } from './Screen'
import { defaultSettings, distributeSettings, loadSettings, saveTheseSettings } from './settings'
import { SoundBoard } from './SoundBoard'
import { addGrid } from './threeUtil'
import { filePathToMine, isInputEvent } from './util'
import { VanStuff } from './VanStuff'
import { isInteger } from './wahWah'

const regionNames = bongData.regions.map(x => x.name)
let instance = null

export class Bong extends THREE.EventDispatcher {
  constructor (appDiv) {
    super()
    instance = this
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
    addGrid(c.scene, this.PROPS.scene?.grid?.visible)
    {
      const axesHelper = new THREE.AxesHelper(5)
      axesHelper.name = 'axesHelper'
      axesHelper.visible = !!(this.PROPS.scene?.axes?.visible)
      c.scene.add(axesHelper)
    }
    this.addStats(c)
    this.addCamInfo(c)
    this.fileDrop = new FileDrop()
    this.fileDrop.init(c.container, this.fileDropHandler.bind(this), this.urlDropHandler.bind(this))
    this.miniGames = null
    this.makeGui()
    this.gui.close()
    const overlay = $('<div id="overlay"><div id="you-died">YOU DIED</div><div id="region-intro" class="big-elden-text">This Region!</div></div>').appendTo('body')
    overlay.on('click', this.youDiedFadeOut.bind(this))
    setTimeout(this.whenReady.bind(this))
  }

  /**
   * @returns {Bong} the singleton Bong instance
   */
  static getInstance (appDiv) {
    return instance
  }

  // for regular character movement in character mode just store the current
  // state of held keys?
  onKeyDown (ev) {
    if (isInputEvent(ev)) {
      console.log('apparently an input event')
      return false
    }
    if (ev.isComposing || ev.keyCode === 229) {
      return false
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
    }
    {
      const fld = this.gui.addFolder('Maps').close()
      const loc = {
        location: regionNames[this.PROPS.gameState.region]
      }
      fld.add(loc, 'location', regionNames).onChange(v => {
        const i = regionNames.findIndex(x => x === v)
        this.changeRegionByNumber(i)
      })
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
      fld.add(this, 'testVanStuff')
      fld.add(this, 'loadTokyo')
      {
        const sb = SoundBoard.getInstance()
        const o = { soundName: 'none', percussionName: 'none' }
        fld.add(o, 'soundName', [...sb.getNames()]).name('Sound Board').onChange(v => { sb.play(v) })
        fld.add(o, 'percussionName', [...sb.getPercussionSpriteNames()]).name('Percussion').onChange(v => { sb.playPercussionSprite(v) })
      }
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
        const fld = this.gui.addFolder('Settings').close()
        fld.onFinishChange(() => { saveTheseSettings('eldenBong', this.settings) })
        fld.add(this.settings.tools, 'magick')
        fld.add(this.settings.tools, 'sliceCommand')
        fld.add(this.settings, 'autoLoadMap')
        fld.add(this.settings, 'autoRunMiniGame')
        fld.add(this.settings, 'autoOpenGuiFolder')
        const sub = fld.addFolder('onScreen').onFinishChange(() => {
          this.updateOnScreenGubbins()
        })
        sub.add(this.settings.scene.onScreen, 'showTitleText')
        sub.add(this.settings.scene.onScreen, 'showControllerSvg')
        sub.add(this.settings.scene.onScreen, 'showCameraPosition')
        sub.add(this.settings.scene.onScreen, 'showFirstRegionName')
        fld.add(this, 'resetSettings').name('⚠️ Restore Default Settings! ⚠️')
      }
      {
        this.gui.addFolder('Mini-Games').close()
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
    AboutBox.show()
  }

  whenReady () {
    this.updateOnScreenGubbins()
    // this.moanSwooper.runTestBomb()
    if (this.settings.autoLoadMap) {
      this.loadMapJson(this.settings.autoLoadMap)
    }
    if (this.settings?.gameState && this.settings?.scene?.onScreen?.showFirstRegionName) {
      this.restoreGameState(this.settings.gameState)
    }

    this.miniGames = new MiniGames(this)
    if (this.settings.autoRunMiniGame) {
      this.miniGames.autoRunMiniGame = this.settings.autoRunMiniGame
    }
    if (this.settings.autoOpenGuiFolder) {
      this.miniGames.autoOpenGuiFolder = this.settings.autoOpenGuiFolder
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
    const info = await pickFile()
    if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length || !info.filePaths[0]) return
    const fp = info.filePaths[0]
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

  async urlDropHandler (urls, ev) {
    console.log('url drop: ', urls)
    const urlText = ev?.originalEvent?.dataTransfer?.getData?.('text')
    console.dir(urlText)
    // TODO: add API to add and remove URL handlers by domain
    // TODO: the first case is the VideoCache case - if it's a YouTube URL we want to offer to download it with yt-dlp and then load it in the karaoke player or something
    const addr = new URL(urlText)
    console.log('handler needed for ' + addr.hostname)
    // TODO interactive - ask user if they want to extract audio
    // ask for folder?
    // default downloads dir?
  }

  async fileDropHandler (files) {
    console.log('file drop: ', files)
    // TODO the job here is to hook into the file importer system with interactive or non-interactive modes.
    // initially we could register handlers for file types/extensions
    // when interactive we can ask the user what they want to do with each file
    // when non-interactive we can just do the default thing for that file type
    // inspect the file option
    // We can assume interactive and ask the user about any ambiguous cases
    const handlers = {
      '.e57': this.loadE57File.bind(this),
    }
    const errors = []
    for (const f of files) {
      const fp = window.handy.getPathForFile(f)
      console.log('eat me: ', f)
      console.log('path: ', fp)
      const pp = path.parse(fp)
      const ext = pp.ext.toLowerCase()
      if (ext === '.zip') {
        // TODO mechanism to examine file contents and guess what it's for
        // also register file handler
        // the EventDispatcher from THREE is OK but can't tell you if an event was claimed or not
        // when there are multiple handlers for a file it would be nice to interactively ask the user what they want to do with it
        this.dispatchEvent({ type: 'zipFileDropped', filePath: fp })
        continue
      }
      const h = handlers[ext]
      if (h) {
        await h(fp)
      } else {
        errors.push(`no handler for file type ${pp.ext}`)
      }
    }
    if (errors.length) {
      Dlg.errorDialog(errors.join('\n'))
    }
  }

  async loadE57File (fp) {
    const info = await window.handy.readE57(fp)
    console.dir(info)
  }

  async testConfirmDialog () {
    const res = await Dlg.awaitableConfirmDialog('this is the message', 'TITLE!')
    console.dir(res)
  }

  youDiedWithSound () {
    SoundBoard.getInstance().play('defenderHumanoidFall')
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
    // if (topic === 'sliceBigMap') {
    //   console.log('main: ', topic, msg)
    //   // TODO find progress bar and update it
    //   if (this.slicerDialog) {
    //     // get the content and replace it
    //     let p = msg.replace('stdout: ', '')
    //     p = p.replace(topic, '')
    //     this.slicerDialog.setContent(`progress: ${p}`, true)
    //   }
    //   return
    // }
    if (topic === 'skyBoxList') {
      this.setSkyBoxList(msg)
      if (this.settings.scene.background?.skyBox) {
        this.setSkyBox(this.settings.scene.background.skyBox)
      }
      return
    }
    this.dispatchEvent({ type: topic, msg })
  }

  async setSkyBox (v) {
    const scene = this.screen.scene
    if (scene.background?.isTexture) {
      scene.background.dispose()
    }
    if (v === '...none') {
      scene.background = new THREE.Color(this.PROPS.scene.background.colour)
      return
    }
    const urls = await window.handy.getSkyBoxMineUrlList(v)
    new THREE.CubeTextureLoader().load(urls, (textureCube) => {
      scene.background = textureCube
      // set the default sky-box rotation here...
      scene.backgroundRotation?.set(Math.PI / 2, 0, 0)
      this.redraw()
    })
  }

  setSkyBoxList (va) {
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

  async testIdentify () {
    const p = await pickFile()
    if (p.canceled || !Array.isArray(p.filePaths) || !p.filePaths.length || !p.filePaths[0]) return
    const fp = p.filePaths[0]
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

  testDialog () { Dlg.errorDialog("that wasn't great!") }

  async testDialogAsync () {
    await Dlg.awaitableDialog('this is the first dialog', 'dialog1')
    await Dlg.awaitableDialog('this is the second dialog', 'dialog2')
  }

  addStats (c) {
    const stats = new Stats()
    c.container.appendChild(stats.dom)
    stats.dom.style.cssText = 'position:absolute;top:40px;left:10px;'
    c.addMixer('stats', (_delta) => {
      stats.update()
      return false
    })
  }

  addCamInfo (c) {
    const camInfo = document.getElementById('camInfo')
    const dp = 2
    setInterval(() => {
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

  singleClick (ev, mousePos) {
    this.raycaster.setFromCamera(mousePos, this.screen.camera)
    // TODO modes of operation
    // TODO this.moanSwooper.intersect(this.raycaster, ev)
    if (this.miniGames?.stealIntersectForGame(ev, mousePos, this.raycaster)) {
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
    if (this.miniGames?.offerDoubleClick(ev, mousePos, this.raycaster)) {
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
}
