import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { MiniGameBase } from '../MiniGameBase'
import { Colours } from '../Colours'
import tileImageMonkey from './matcha-card-monkey.png'
import tileImageDog from './matcha-card-dog.png'
import tileImagePig from './matcha-card-pig.png'
import tileImageChicken from './matcha-card-chicken.png'
import tileImageRabbit from './matcha-card-rabbit.png'
import tileImageRat from './matcha-card-rat.png'

/**
 * Matcha mini-game - a tile-matching game I saw on an Air China flight
 * - the only user input is to select a tile
 * - selecting a tile highlights it (or de-highlights if already highlighted)
 * - selecting an adjacent tile swaps them
 * - if the swap creates a line of 3 or more matching tiles, they disappear
 * - tiles above fall down to fill the gaps, and new tiles appear at the top
 * - if no line is created, the swap is reversed
 *
 * The tiles sit on a "rack" which allows placement in local coordinates or column and row
 * - the rack sits in front of a backdrop
 * - the highlight is a semi-transparent box that sits slightly above the tile
 * - raycasting for clicks is done against the rack
 * - because raycasting hits invisible objects we can use layers
 * - layer 1 will be used for clickable objects
 * - when making an object invisible and non-clickable just remove it from layer 1
 *
 * @extends MiniGameBase
 */
export class Matcha extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Matcha')
    this.clickable = []
    this.highlightObj = null
    this.gameState = 'attract' // 'playing', 'paused', 'gameOver'
    // TODO I want to make the tiles from emoji but I can't be sure that the
    // fonts will be available on the user's system
    // I'll start with little PNG images
    const tileInfo = [
      { text: '🐵', name: 'monkey', img: tileImageMonkey, mesh: null },
      { text: '🐶', name: 'dog', img: tileImageDog, mesh: null },
      { text: '🐷', name: 'pig', img: tileImagePig, mesh: null },
      { text: '🐔', name: 'chicken', img: tileImageChicken, mesh: null },
      { text: '🐰', name: 'rabbit', img: tileImageRabbit, mesh: null },
      { text: '🐭', name: 'rat', img: tileImageRat, mesh: null },
    ]
    this.params = {
      w: 8,
      h: 8,
      tileSize: 0.86,
      tileSpacing: 0.1,
      tileThickness: 0.1,
      highlightZ: 0.12,
      tileInfo,
    }
    // TODO - these look like we should create them on the fly since w'd need so many different rotated instances!
    this.tileSwap = new THREE.VectorKeyframeTrack('.position', [0, 1, 2], [0, 0, 0, 0.5, 0, 0.25, 1, 0, 0])
    this.tileSwapClip = new THREE.AnimationClip('tileSwap', 2, [this.tileSwap])
    // TODO - but which of these are lightweight and reusable? Just do something and if it's not horrible performance-wise, leave it?

    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.screen.addMixer('Matcha', (delta) => { return this.animate(delta) })
    })
  }

  createTileProtoMeshes () {
    const p = this.params
    const loader = new THREE.TextureLoader()
    const m = new THREE.MeshLambertMaterial({ color: Colours.get('green') })
    const geometry = new THREE.BoxGeometry(p.tileSize, p.tileSize, p.tileThickness)
    for (const t of p.tileInfo) {
      const mat = new THREE.MeshLambertMaterial({ map: loader.load(t.img) })
      const mesh = new THREE.Mesh(geometry, [m, m, m, m, mat, m])
      mesh.userData.tileType = t.name
      t.mesh = mesh
    }
  }

  runTest () {
    console.log('Running Matcha test...')
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.createTileProtoMeshes()
    const p = this.params
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(p.w, p.h),
      new THREE.MeshBasicMaterial({ color: Colours.get('purple'), side: THREE.DoubleSide })
    )
    backdrop.position.set(0, 0, -0.1)
    this.group.add(backdrop)
    // create "rack" for tiles...
    const rack = new THREE.Group()
    rack.name = 'rack'
    rack.position.set(-3.5, -3.5, (p.tileThickness / 2) + 0.001)
    backdrop.add(rack)
    this.rack = rack

    // create initial rack full of tiles...
    const n = p.tileInfo.length
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        const rnd = Math.floor(Math.random() * n)
        const tile = p.tileInfo[rnd].mesh.clone()
        tile.position.set(x, y, 0)
        tile.layers.enable(1) // make clickable
        rack.add(tile)
      }
    }
    this.clickable = [rack]
    // create a highlight object
    {
      const geo = new THREE.BoxGeometry(p.tileSize + p.tileSpacing, p.tileSize + p.tileSpacing, p.tileThickness * 1.2)
      const mat = new THREE.MeshBasicMaterial({ color: Colours.get('cyan'), wireframe: false, transparent: true, opacity: 0.8 })
      const h = new THREE.Mesh(geo, mat)
      h.visible = false
      h.layers.disable(1) // make clickable
      rack.add(h)
      this.highlightObj = h
    }
    this.activate()
    this.redraw()
  }

  /**
   * @returns true if I accept the intersect offer
   */
  offerDoubleClick (ev, mousePos, raycaster) {
    if (!this.active || ev.button !== 0) { return false }
    const savedLayers = raycaster.layers.mask
    raycaster.layers.set(1)
    const hits = raycaster.intersectObjects(this.clickable, true)
    raycaster.layers.set(savedLayers)
    if (!hits.length) {
      return false
    }
    this.clickableClicked(hits[0].object)
    return true
  }

  /**
   * take focus - activate me, deactivate others, etc
   */
  clickableClicked (obj) {
    this.activate()
    // TODO -
    // lock camera
    // on escape, pause game, unlock camera
    // start receiving single clicks
    this.selectTile(obj)
    this.redraw()
  }

  selectTile (obj) {
    if (obj === this.highlightObj) {
      this.highlightObj.visible = false
      this.highlightObj.layers.disable(1)
      return
    }
    // save old position
    const [px, py] = [this.highlightObj.position.x, this.highlightObj.position.y]
    // move the highlight
    this.highlightObj.position.copy(obj.position)
    if (!this.highlightObj.visible) {
      this.highlightObj.visible = true
      this.highlightObj.layers.enable(1)
      return
    }
    // is this adjacent?
    const [nx, ny] = [this.highlightObj.position.x, this.highlightObj.position.y]
    // if (nx === px && (ny === py + 1 || ny === py - 1)) {
    //   console.log('adjacent up-down')
    // }
    // if (ny === py && (nx === px + 1 || nx === px - 1)) {
    //   console.log('adjacent left-right')
    // }
    // const adjacent = ((nx === px && (ny === py + 1 || ny === py - 1)) || (ny === py && (nx === px + 1 || nx === px - 1)))
    // if (!adjacent) { return }
    const [ox, oy] = [Math.abs(nx, px), Math.abs(ny, py)]
    const [adjHor, adjVrt] = [(ox === 1 && oy === 0), (oy === 1 && ox === 0)]
    // NB: both will not be true
    console.log(`adjHor = ${adjHor}, adjVrt = ${adjVrt}`)
    // something like...
    // create animation things on the fly?
    // this.startTileSwapAnimation(a, b).then(checkSwapConsequences)
    //
    // could check consequences first - could write code for that later once we
    // have a good animation system
  }

  /**
   * For animation:
   * - the 'gsap' animation library is proving annoying in other mini-games and
   *   not acting intuitively so I want to just use three.js built-in animation
   *   features. In the process I might discover what I'm doing wrong in 'gsap'.
   * - hand-crafted too: https://threejs.org/examples/?q=keys#misc_animation_keys
   *   https://github.com/mrdoob/three.js/blob/master/examples/misc_animation_keys.html
   *
   * TODO - an animation sequence to swap two tiles can come first
   * have user settings for animation durations
   * 
   * 
   * 
   * 
   * @returns {boolean} whether a redraw is required
   */
  animate (delta) {
    if (!this.active) { return false }
    // anything on the timeline?
    // could animate multiple things at once but some things need to be sequential
    // - tiles swapping, tiles falling, new tiles appearing
    // - sounds too
    return false
  }
}
