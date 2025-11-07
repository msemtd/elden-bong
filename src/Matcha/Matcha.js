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
    const p = this.params = {
      w: 8,
      h: 8,
      tileSize: 0.86,
      tileSpacing: 0.1,
      tileThickness: 0.1,
      highlightZ: 0.12,
      tileInfo,
    }
    this.animationQueue = []
    this.textData = this.createTextRack(p.w, p.h, p.tileInfo.length)
    // regex to match sequences of 3 or more consecutive matching digits...
    this.rx = /(\d)\1{2,}/g
    // regex testing...
    ;['---33-----', '123455555678', '000111333'].forEach(s => {
      console.log(`string '${s}' matches ${s.match(this.rx)}`)
    })

    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.screen.addMixer('Matcha', (delta) => { return this.animate(delta) })
    })
  }

  /**
   * pure function to create 2D array of random text digits
   * @param {number} w width
   * @param {number} h height
   * @param {number} n number of different digits (0 to n-1)
   * @returns {string[][]} 2D array of text digits
   */
  createTextRack (w, h, n) {
    const r = Array.from(Array(h), () => new Array(w).fill('-'))
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const rnd = Math.floor(Math.random() * n)
        r[y][x] = `${rnd}`
      }
    }
    return r
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
    const p = this.params
    const t = this.textData
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.createTileProtoMeshes()
    this.textData = this.createTextRack(p.w, p.h, p.tileInfo.length)
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
    // create 3D rack of tile objects from prototype meshes...
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        const tile = p.tileInfo[Number(t[y][x])].mesh.clone()
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
    const h = this.highlightObj
    // if highlight selected, hide it and quit
    if (obj === h) {
      h.visible = false
      h.layers.disable(1)
      return
    }
    // save old position
    const p1 = h.position.clone()
    // move the highlight to new obj position
    h.position.copy(obj.position)
    // if highlight not shown, show it and quit
    if (!h.visible) {
      h.visible = true
      h.layers.enable(1)
      return
    }
    // is new position adjacent?
    const p2 = h.position.clone()
    if (p2.distanceToSquared(p1) !== 1.0) {
      return
    }
    console.log(`adjacent ${p1.x},${p1.y} <==> ${p2.x},${p2.y}`)
    const otherTile = this.rack.children.find(o => o !== h && o.position.equals(p1))
    if (!otherTile) {
      console.error('something not right with rack contents - debug this')
      return
    }
    h.visible = false
    h.layers.disable(1)
    this.swapTiles(obj, p2, otherTile, p1)
  }

  swapTiles (obj, p2, otherTile, p1, animated = true) {
    // non-animated version - boring
    if (!animated) {
      otherTile.position.copy(p2)
      obj.position.copy(p1)
      return
    }

    // TODO completely untested animation version!
    // create animation things on the fly?
    // this seems rather excessive - I'm probably doing this wrong
    const mid = p2.clone().sub(p1).multiplyScalar(0.5).add(p1)
    const m1 = mid.clone()
    const m2 = mid.clone()
    m1.z += 0.45
    m2.z += 0.25
    const kf1 = new THREE.VectorKeyframeTrack('.position', [0, 0.7, 1.4], [p1.x, p1.y, p1.z, m1.x, m1.y, m1.z, p2.x, p2.y, p2.z])
    const kf2 = new THREE.VectorKeyframeTrack('.position', [0, 0.7, 1.4], [p2.x, p2.y, p2.z, m2.x, m2.y, m2.z, p1.x, p1.y, p1.z])
    const clip1 = new THREE.AnimationClip('Action', -1, [kf1])
    const clip2 = new THREE.AnimationClip('Action', -1, [kf2])
    const mixer1 = new THREE.AnimationMixer(otherTile)
    const mixer2 = new THREE.AnimationMixer(obj)
    const action1 = mixer1.clipAction(clip1)
    const action2 = mixer2.clipAction(clip2)
    action1.loop = action2.loop = THREE.LoopOnce
    action1.clampWhenFinished = action2.clampWhenFinished = true
    action1.play()
    action2.play()
    this.animationQueue.push(action1, action2)
  }

  /**
   * For animation:
   * - the 'gsap' animation library is proving annoying in other mini-games and
   *   not acting intuitively so I want to just use three.js built-in animation
   *   features. In the process I might discover what I'm doing wrong in 'gsap'.
   *
   * https://threejs.org/manual/#en/animation-system
   * simplest example: https://threejs.org/examples/?q=keys#misc_animation_keys
   * example code: https://github.com/mrdoob/three.js/blob/master/examples/misc_animation_keys.html
   *
   * TODO - an animation sequence to swap two tiles can come first
   * have user settings for animation durations
   * Class relationships for the system
   * AnimationAction drives
   * AnimationMixer controlling
   * AnimationClip has
   * KeyframeTrack
   *
   * @returns {boolean} whether a redraw is required
   */
  animate (delta) {
    if (!this.active) { return false }
    // anything on the timeline?
    // could animate multiple things at once but some things need to be sequential
    // - tiles swapping, tiles falling, new tiles appearing
    // - sounds too
    // queue of things?
    for (const action of this.animationQueue) {
      action.getMixer().update(delta)
    }
    this.animationQueue = this.animationQueue.filter(f => f.isRunning())
    return (this.animationQueue.length > 0)
  }
}
