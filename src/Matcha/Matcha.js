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
import { rackToString, createRack, stringToRack, getRowString, getColumnString } from './rack.js'

const CLICKABLE_LAYER = 1

/**
 * Matcha mini-game - a tile-matching game I saw on an Air China flight.
 *
 * The basic rules of the game are:
 * - the only user input is to select a tile
 * - selecting a tile highlights it (or de-highlights if already highlighted)
 * - selecting an adjacent tile swaps them
 * - if the swap creates a line of 3 or more matching tiles, they will disappear
 *   and points are scored
 * - tiles above fall down to fill the gaps, and new tiles appear at the top
 * - this can create further scoring lines and generate "combos"
 * - if the swap does not score anything, the swap is reversed
 *
 * The graphical side of things:
 * - we create "prototype" 3D tile meshes from small PNG images
 * - cloned instances of the tiles are placed on a "rack" in the simplest local
 *   coordinate system of 1 meter spaced column and row
 * - the rack sits in front of a backdrop
 * - the "highlight" is a semi-transparent box that sits slightly above a picked tile
 * - raycasting for clicks is done against the rack
 * - because raycasting hits invisible objects we can use layers
 * - layer 1 (CLICKABLE_LAYER) will be used for clickable objects
 * - when making an object invisible and non-clickable just remove it from layer 1
 *
 * A non-graphical data is convenient to hold the initial or current state of the rack
 * - this is a 2D array of text digits representing tile types
 * - functions to create, convert, and access the data are in rack.js
 * - we want to look at the data in rows and columns for scoring and to detect
 *   scoring lines we can use a regex on a text representation of the rows/columns
 *
 *
 * @class Matcha
 * @extends MiniGameBase
 */
export class Matcha extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Matcha')
    // regex to match sequences of 3 or more consecutive matching digits...
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices
    // getting more from the regex with the 'd' flag
    this.rx = /(\d)\1{2,}/gd
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
    this.animationQueue = []
    this.data2D = null
    this.testing = true
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.screen.addMixer('Matcha', (delta) => { return this.animate(delta) })
    })
  }

  runTest () {
    this.rackSetup()
    this.freshGfx()
    this.detectScores(() => {
      console.warn('detected a score in initial state!')
    })
  }

  rackSetup () {
    const p = this.params
    if (this.testing) {
      // Load a known rack for testing...
      // const s = '5202002312024022501431520453331444031444103022542140045541311342'
      const s = `

        5 2 0 2 0 0 2 3
        1 2 0 2 4 0 2 2
        5 0 1 4 3 1 5 2
        0 4 5 3 3 3 1 4
        4 4 0 3 1 4 4 4
        1 0 3 0 2 2 5 4
        2 1 4 0 0 4 5 5
        4 1 3 1 1 3 4 2

      `
      this.data2D = stringToRack(s, p.w, p.h)
    } else {
      this.data2D = createRack(p.w, p.h, p.tileInfo.length)
    }
    // score matching rows and columns
    // the detection method can be general and do various things:
    // - highlight scores
    // - patch a grid of tiles to be non-winning
    // Be aware that the data2D may be changing as part of the callback but it
    // is being scanned by row first and by column next
    // each callback should only alter the scoring line it has been handed!
    const patchingFunc = (rowOrCol, rcIndex, pos, line) => {
      const p = this.params
      const len = line.length
      const tileId = line[0]
      const tileType = p.tileInfo[Number(tileId)].name
      console.log(`match of ${len} ${tileType} tiles on ${rowOrCol} ${rcIndex} starting at position ${pos} = '${line}'`)
      const t = this.data2D
      if (rowOrCol === 'row') {
        // the horizontal rows pass - rcIndex is y, pos is start x
        const row = rcIndex
        const col = pos
        // find columns to break up a row match...
        // will need to replace every third tile in the match with a new random tile to cover the long match case
        // avoid changing the end tiles to reduce chance of new matches
        // could start at 1 (skips 0) and target every third tile until the last tile - if last tile is reached exactly, replace the previous one instead
        const cut = col + Math.ceil(line.length / 2.0)
        console.assert(t[row][cut] === tileId, 'data2D and match mismatch')
        console.log(` - breaking horizontal match at row ${row}, column ${cut} ???`)
        // what tile to use instead?
      } else if (rowOrCol === 'col') {
        const col = rcIndex
        const row = pos
      }
    }
    this.detectScores(patchingFunc)
    const fixedRack = rackToString(this.data2D)
    console.log(`fixedRack: ${fixedRack}`)
    // score matching rows and columns
    // gfx - score highlighting
  }

  freshGfx () {
    const p = this.params
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.createTileProtoMeshes()
    const t = this.data2D
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
    const rack2 = rack.clone(false)
    rack2.name = 'rack2'
    backdrop.add(rack2)
    this.rack2 = rack2
    // create 3D rack of tile objects from prototype meshes...
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        const tile = p.tileInfo[Number(t[y][x])].mesh.clone()
        tile.position.set(x, y, 0)
        tile.layers.enable(CLICKABLE_LAYER) // make clickable
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
      h.layers.disable(CLICKABLE_LAYER) // make clickable
      rack.add(h)
      this.highlightObj = h
    }
    this.activate()
    this.redraw()
  }

  /**
   * Detect all scoring "lines" in the 2D rack data (all regex matches)
   * The handler function can do whatever it wants with the info including
   * changing the data! This is less concerning that it sounds because
   * each row or column can be handled with consideration of its neighbours.
   *
   * @returns {void}
   * @param {function} matchHandler function called on each match found
   */
  detectScores (matchHandler = null) {
    const p = this.params
    const t = this.data2D
    // look at the rows first...
    for (let y = 0; y < p.h; y++) {
      const s = getRowString(y, p.w, t)
      const ma = s.matchAll(this.rx)
      for (const m of ma) {
        if (typeof matchHandler === 'function') {
          matchHandler('row', y, m.index, m[0])
        }
      }
    }
    // look at the columns next...
    for (let x = 0; x < p.w; x++) {
      const s = getColumnString(x, p.h, t)
      const ma = s.matchAll(this.rx)
      for (const m of ma) {
        if (typeof matchHandler === 'function') {
          matchHandler('col', x, m.index, m[0])
        }
      }
    }
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

  /**
   * @returns true if I accept the intersect offer
   */
  offerDoubleClick (ev, mousePos, raycaster) {
    if (!this.active || ev.button !== 0) { return false }
    const savedLayers = raycaster.layers.mask
    raycaster.layers.set(CLICKABLE_LAYER)
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
      h.layers.disable(CLICKABLE_LAYER)
      return
    }
    // save old position
    const p1 = h.position.clone()
    // move the highlight to new obj position
    h.position.copy(obj.position)
    // if highlight not shown, show it and quit
    if (!h.visible) {
      h.visible = true
      h.layers.enable(CLICKABLE_LAYER)
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
    h.layers.disable(CLICKABLE_LAYER)
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
