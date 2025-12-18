import { MiniGameBase } from '../MiniGameBase'
import { Colours } from '../Colours'
import * as THREE from 'three'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Banzuke, Rikishi } from './Banzuke'
import { Dlg } from '../dlg'
import { shellOpenPath, shellOpenExternal } from '../HandyApi'
import { filePathToMine } from '../util'
import path from 'path-browserify'
import { Text } from 'troika-three-text'
import van from 'vanjs-core/debug'
import { FloatingWindow } from 'vanjs-ui'
import { SumoBody } from './SumoBody'
import $ from 'jquery'

const { p, div, button, label, progress, table, tbody, thead, td, th, tr } = van.tags

const Table = ({ head, data, tabProps }) => table(
  tabProps || { border: '1px solid black', width: '100%' },
  head ? thead({ align: 'left' }, tr(head.map(h => th(h)))) : [],
  tbody(data.map(row => tr(
    row.map(col => td(col))
  )))
)

// cSpell:ignore vanjs doyoh dohyō basho banzuke Ryogoku Kokugikan EDION Kokusai rikishi mawashi shikona

/*
 * SumoDoyoh - a 3D model of a sumo dohyō (ring)
 * The dohyō is a circular clay platform used in sumo wrestling.
 * It is 4.55 meters in diameter and 66 cm high, with a square base.
 * The ring is surrounded by rice-straw bales (tawara) that are partially buried in the clay.
 *
 * plan: option of each basho venue building layout including all the usual basho locations
 *
 * January Basho: Ryogoku Kokugikan, Tokyo (https://www.sumo.or.jp/Kokugikan/seat_view/)
 * March Basho: EDION Arena Osaka (Osaka Prefectural Gymnasium)
 * May Basho: Ryogoku Kokugikan, Tokyo
 * July Basho: IG Arena, Nagoya
 * September Basho: Ryogoku Kokugikan, Tokyo
 * November Basho: Fukuoka Kokusai Center
 *
 * Seating plans and cushion trajectory
 */

const doyohHeight = 0.66 // height of the clay platform
const ringRadius = 4.55 / 2 // radius of the tawara ring
const tawaraThickRadius = 0.05 // exposed tawara bale height (or radius)

const underDoyohPlatformHeight = 0.5 // height of the under dohyō platform

export class SumoDoyoh extends MiniGameBase {
  constructor (parent) {
    super(parent, 'SumoDoyoh')
    this.banzuke = new Banzuke()
    this.bobbleHeadGeometry = new THREE.IcosahedronGeometry(1, 2)
    this.sumoBodyProto = null
    this.clickableGuys = []
    // this.screen.addMixer('SumoDoyoh', (delta) => { return this.animate(delta) })
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.add(this, 'openBanzukeDataDir')
      this.gui.add(this, 'loadBanzukeData')
      this.gui.add(this, 'allBobbleHeads')
      this.gui.add(this, 'banzukeDialog').name('Banzuke Dialog')
      this.gui.add(this, 'isThereNewBanzuke').name('New Banzuke?')
      this.gui.add(this, 'urlOfficialMatchVideos').name('Official Match Videos')
    })
  }

  urlOfficialMatchVideos () {
    const url = 'https://www.youtube.com/@sumo-video/videos'
    shellOpenExternal(url)
  }

  /**
   * @returns {boolean} whether a redraw is required
   */
  animate (delta) {
    if (!this.active) { return false }
    // anything on the timeline?
    if (!this.timeLine) { return false }
    return this.timeLine.isActive()
  }

  /**
   * @returns true if I accept the intersect offer
   */
  offerDoubleClick (ev, mousePos, raycaster) {
    if (!this.active || ev.button !== 0) { return false }
    const hits = raycaster.intersectObjects(this.clickableGuys, true)
    if (!hits.length) {
      return false
    }
    this.guyClicked(hits[0].object)
    return true
  }

  guyClicked (object) {
    // given a clickable part of a guy find the parent group with rikishi UserData
    let o = object
    while (o) {
      if (o.userData?.rikishi instanceof Rikishi) {
        break
      }
      o = o.parent
    }
    console.assert(o, 'failed to find parent object for this guy part')
    if (!o) { return }
    const r = o.userData.rikishi
    this.popRikishiDialog(r, o)
  }

  popRikishiDialog (rikishi, obj) {
    // TODO practice your art: pop up a VanJS dialog with fun data
    console.log(rikishi)
  }

  async isThereNewBanzuke () {
    // Check if there is a new banzuke available
    try {
      // is full cache of banzuke loaded?
      const gotFull = await this.banzuke.isFullCacheAvailable()
      if (!gotFull) {
        throw Error('Full banzuke cache is not available, please refresh banzuke data')
      }
      await this.banzuke.load()
      const info = await this.banzuke.checkDivisionChange(1)
      Dlg.popup(info ? `There is a new banzuke: ${info}` : 'No new banzuke at this time')
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }

  async runTest () {
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.activate()
    this.makeDoyoh()
    // this.makeUnderDoyoh()
    this.group.position.setZ(doyohHeight)
    await this.loadBanzukeData()
    const ura = await this.makeRikishi('Ura', 'bubble gum pink')
    const waka = await this.makeRikishi('Wakatakakage', 'blue')
    const yams = await this.makeRikishi('Ichiyamamoto', 'emerald green')
    ura.position.y += 0.2
    waka.position.x += 2
    waka.position.y -= 0.5
    waka.rotateZ(Math.PI / -6)
    yams.position.x -= 1.8
    yams.position.y -= 0.4
    yams.rotateZ(Math.PI / 6)
    this.group.add(ura)
    this.group.add(yams)
    this.group.add(waka)
    // stick ura in a box and see how tall he is in world space
    ura.position.z += 1
    const box = new THREE.BoxHelper(ura, 0xffff00)
    this.screen.scene.add(box)
    const b3 = new THREE.Box3()
    b3.setFromObject(ura)
    const v1 = new THREE.Vector3()
    b3.getSize(v1)
    const r = ura.userData.rikishi
    const msg = `${r.shikona} is ${r.height} vs ${v1.z}`
    console.log(msg)
    this.clickableGuys = [ura, waka, yams]
    this.redraw()
  }

  makeUnderDoyoh () {
    // look at the under-dohyō platform about 0.5m high
    // this is where the cushions are thrown from
    // https://www.sumo.or.jp/Kokugikan/seat_view/
    // https://livehis.com/house/house_kokugikan.html
    // should probably create this in blender and import it
    const underDoyoh = new THREE.Group()
    this.group.add(underDoyoh)
    underDoyoh.name = 'underDoyoh'

    // const b = new THREE.BoxHelper(this.group.getObjectByName('doyoh'), 0x00ffff)
    // this.group.add(b)

    const g = new THREE.BoxGeometry(40, 40, 0.5, 80, 80, 1)
    underDoyoh.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })))
    underDoyoh.position.setZ((0 - doyohHeight) - underDoyohPlatformHeight / 2 - 0.005)
  }

  // cspell:ignore tawara tokudawara
  makeDoyoh () {
    const doyoh = new THREE.Group()
    doyoh.name = 'doyoh'
    this.group.add(doyoh)
    const clayMaterial = new THREE.MeshLambertMaterial({
      color: Colours.get('clay brown'),
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    })
    const sandMaterial = clayMaterial.clone()
    sandMaterial.color.set(Colours.get('sand brown'))
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 'black' })

    // A typical dohyō is a circle made of partially buried rice-straw bales 4.55 meters in diameter
    {
      const g = new THREE.CylinderGeometry(ringRadius, ringRadius, 0.05, 32)
      const mesh = new THREE.Mesh(g, sandMaterial)
      mesh.rotateX(Math.PI / 2)
      doyoh.add(mesh)
    }
    // it is mounted on a square platform of clay 66 cm high and 6.7m wide on each side.
    {
    // Using THREE.js cylinder to make a square with sloping sides.
    // The cylinder radius, r is required to make us a square 6.7m wide.
    // If the "radius" of the square is x then r = x * Sin(45°) = x / √2
      const g = new THREE.CylinderGeometry(6.7 / 2 * Math.SQRT2, 8 / 2 * Math.SQRT2, doyohHeight, 4, 3)
      const mesh = new THREE.Mesh(g, clayMaterial)
      const e = new THREE.EdgesGeometry(g)
      const edges = new THREE.LineSegments(e, edgeMaterial)
      mesh.add(edges)
      mesh.position.setZ(0 - doyohHeight / 2)
      mesh.rotateX(Math.PI / 2)
      mesh.rotateY(Math.PI / 4)
      doyoh.add(mesh)
    }
    // The rice-straw bales (tawara (俵)) which form the ring are one third standard
    // size and are partially buried in the clay of the dohyō.
    // Four of the tawara are placed slightly outside the line of the circle at the
    // four cardinal directions, these are called privileged bales (tokudawara).

    // Experimenting with fancy tawara extrusions but torus sections are easier
    // to make (see below)
    if (this.tryFancyTawara) {
      const shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.arc(1, 1, 1, 0, Math.PI)
      const g = new THREE.ExtrudeGeometry(shape, {
        steps: 3,
        depth: 5,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelOffset: 0,
        bevelSegments: 2
      })
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
      const mesh = new THREE.Mesh(g, material)
      // const e = new THREE.EdgesGeometry(g)
      // const edges = new THREE.LineSegments(e, edgeMaterial)
      // mesh.add(edges)
      mesh.rotateX(Math.PI / 2)
      doyoh.add(mesh)
    }
    // try a simple torus geometry for the tawara and tokudawara
    {
      const tokudawaraSegment = Math.PI / 8
      const tawara = new THREE.TorusGeometry(ringRadius, tawaraThickRadius, 8, 16, (Math.PI / 2) - tokudawaraSegment)
      const tokudawara = new THREE.TorusGeometry(ringRadius + (tawaraThickRadius * 3), tawaraThickRadius, 8, 4, tokudawaraSegment)
      const tawaraBorder = new THREE.CylinderGeometry(tawaraThickRadius, tawaraThickRadius, 5, 8, 8, false)
      const tawaraCorner = new THREE.CylinderGeometry(tawaraThickRadius, tawaraThickRadius, 0.8, 8, 2, false)
      const material = new THREE.MeshBasicMaterial({ color: Colours.get('sand yellow'), wireframe: true })
      const tawaraBorderOffset = 3.1
      const tawaraCornerOffset = 2.9
      const tawaraCornerPos = [[-1, -1], [-1, 1], [1, 1], [1, -1]]
      for (let i = 0; i < 4; i++) {
        const mesh = new THREE.Mesh(tawara, material)
        mesh.rotateZ((i * Math.PI / 2) + (tokudawaraSegment / 2))
        doyoh.add(mesh)
        const mesh2 = new THREE.Mesh(tokudawara, material)
        mesh2.rotateZ((i * Math.PI / 2) - (tokudawaraSegment / 2))
        doyoh.add(mesh2)
        // border tawara
        {
          const m = new THREE.Mesh(tawaraBorder, material)
          const mul = Math.floor(i / 2) ? 1 : -1
          const x = (i % 2) ? 0 : mul * tawaraBorderOffset
          const y = (i % 2) ? mul * tawaraBorderOffset : 0
          m.position.setX(x)
          m.position.setY(y)
          m.rotateZ(i * Math.PI / 2)
          doyoh.add(m)
        }
        // corner tawara parts
        {
          const m = new THREE.Mesh(tawaraCorner, material)
          const x = tawaraCornerPos[i][0] * tawaraCornerOffset
          const y = tawaraCornerPos[i][1] * tawaraCornerOffset
          m.position.setX(x)
          m.position.setY(y)
          m.rotateZ((i * Math.PI / 2) + Math.PI / 4)
          doyoh.add(m)
        }
      }
    }
  }

  async openBanzukeDataDir () {
    try {
      const d = await this.banzuke.getCacheDirFullPath()
      await shellOpenPath(d)
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }

  async loadBanzukeData () {
    try {
      await this.banzuke.load()
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }

  addText (text, p, rot) {
    const t = new Text()
    t.text = text
    t.anchorX = 'center'
    t.anchorY = 'middle'
    t.fontSize = 0.4
    t.position.copy(p)
    if (rot) {
      t.rotation.copy(rot)
    }
    t.sync(() => { this.redraw() })
    return t
  }

  async addHead (fp, p, g) {
    const geo = this.bobbleHeadGeometry
    const u = filePathToMine(fp)
    const loader = new THREE.TextureLoader()
    const texture = await loader.loadAsync(u)
    const mat = new THREE.MeshLambertMaterial({ map: texture })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.set(Math.PI / 2, Math.PI / 2, 0)
    mesh.position.copy(p)
    g.add(mesh)
    this.redraw()
    return mesh
  }

  async allBobbleHeads () {
    try {
      this.activate()
      const eg = this.group.getObjectByName('allBobbleHeads')
      if (eg) {
        depthFirstReverseTraverse(this.group, eg, generalObj3dClean)
      }
      const g = new THREE.Group()
      g.name = 'allBobbleHeads'
      this.group.add(g)
      g.position.setZ(1)
      const cd = await this.banzuke.getCacheDirFullPath(true)
      const p = new THREE.Vector3()
      const textOffset = new THREE.Vector3(0, 0, -1.5)
      const textRot = new THREE.Euler(Math.PI / 2, 0, 0)
      const space = 2.5
      let w = this.banzuke.rikishi.length
      w = Math.sqrt(w)
      for (const row of this.banzuke.rikishi) {
        const r = new Rikishi(...row)
        const fp = path.join(cd, r.cacheFileThumbnail())
        await this.addHead(fp, p, g)
        g.add(this.addText(r.shikona, p.clone().add(textOffset), textRot))
        p.x += space
        if (p.x > w * space) {
          p.x = 0
          p.z += space + 0.5
        }
      }
      this.redraw()
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }

  async getNewSumoBody (mawashiColour = 'grey', skinColour = 'purple') {
    // only need to load the model once...
    if (!this.sumoBodyProto) {
      const j = new SumoBody().bodyJson()
      const loader = new THREE.ObjectLoader()
      const data = await loader.parseAsync(j.scene)
      const bod = data.children[0]
      bod.rotateX(Math.PI / 2)
      this.sumoBodyProto = bod
    }
    // we will be returning a clone with unique colours...
    const b = this.sumoBodyProto.clone()
    // replace the skin and mawashi materials...
    {
      const color = new THREE.Color(Colours.get(skinColour))
      const mat = new THREE.MeshLambertMaterial({ color })
      const aa = ['body', 'arm-1', 'arm-2', 'leg-1', 'leg-2'].map(n => b.getObjectByName(n))
      aa.forEach(o => { o.material = mat })
    }
    {
      const color = new THREE.Color(Colours.get(mawashiColour))
      const mat = new THREE.MeshLambertMaterial({ color })
      const aa = ['mawashi_1', 'mawashi_2'].map(n => b.getObjectByName(n))
      aa.forEach(o => { o.material = mat })
    }
    return b
  }

  async makeRikishi (name = 'Ura', mawashiColour = 'bubble gum pink', skinColour = 'pinkish tan') {
    try {
      const r = this.banzuke.getRikishiObjByName(name)
      if (!r) throw Error(`unknown rikishi '${name}'`)
      r.mawashiColour = mawashiColour
      r.skinColour = skinColour
      const g = new THREE.Group()
      g.name = name
      g.userData.rikishi = r
      const bod = await this.getNewSumoBody(mawashiColour, skinColour)
      g.add(bod)
      const cd = await this.banzuke.getCacheDirFullPath(true)
      const fp = path.join(cd, r.cacheFileThumbnail())
      const headPos = new THREE.Vector3(0, 0, 2.4)
      const textOffset = new THREE.Vector3(0, 0, 1.3)
      const textRot = new THREE.Euler(Math.PI / 2, 0, 0)
      await this.addHead(fp, headPos, g)
      g.add(this.addText(r.shikona, headPos.clone().add(textOffset), textRot))
      g.position.set(0, 2, 0.87)
      g.scale.divideScalar(3.8)
      this.redraw()
      return g
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }

  async banzukeDialog () {
    // only one pop-up...
    if (document.getElementById('banzukeDialog')) {
      console.log('Banzuke dialog is already open')
      return
    }
    const dt = this.banzuke.divisions
    const head = ['jp', 'en', 'info', 'count', 'pct', 'btn']
    const data = dt.map(row => [row.jpName, row.name, row.enName, 0, 0, button({ onclick: () => { this.showDivisionDialog(row.name) } }, 'show')])
    const closed = van.state(false)
    const progressPct = van.state(0)
    const progressStage = van.state('<none yet>')
    const refreshButtonDisabled = van.state(false)
    const progressCallback = (pct, stage) => {
      progressPct.val = pct
      progressStage.val = stage
    }
    const doTheThing = async () => {
      try {
        refreshButtonDisabled.val = true
        await this.banzuke.load(progressCallback)
        // TODO update the table summary
      } catch (error) {
        Dlg.errorDialog(error)
      }
      refreshButtonDisabled.val = false
    }
    const tabProps = { id: 'banzukeTopLevelTable', border: '1px solid black', width: '100%' }
    van.add(document.body, FloatingWindow(
      { title: '📼 Banzuke Data', closed, width: 600, height: 500 },
      div({ id: 'banzukeDialog', style: 'display: flex; flex-direction: column; justify-content: center;' },
        p('Show banzuke data from the Japan Sumo Association website'),
        button({ disabled: refreshButtonDisabled, onclick: doTheThing }, 'refresh 📠'),
        label({}, 'stage: ', progressStage),
        label({}, 'import: ', progress({ value: progressPct, max: 100 })),
        Table({ head, data, tabProps })
      )
    ))
  }

  async showDivisionDialog (divisionName) {
    console.log('Show division dialog for:', divisionName)
    const dt = this.banzuke.divisions
    const d = dt.find(row => row.name === divisionName)
    if (!d) {
      console.warn('Division not found:', divisionName)
      return
    }
    console.log('Division found:', d)
    // Show the division data
    const data = this.banzuke.getRikishiForDivision(d.sumoOrJpPage)
    console.table(data)
    // hide the dialog content?
    const cont = $('#banzukeDialog')
    const dlgDiv = $('div.vanui-window > div.vanui-window-children').has(cont)
    cont.hide()
    van.add(dlgDiv[0], div(
      { id: 'banzukeDivisionDialog' },
      p(`Division: ${d.jpName} (${d.enName}) - ${data.length} rikishi`),
      button({
        onclick: () => {
          $('#banzukeDivisionDialog').remove()
          cont.show()
        }
      }, 'Close')

    ))
  }
}
