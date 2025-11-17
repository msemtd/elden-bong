import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import * as TWEEN from 'three/addons/libs/tween.module.js'

import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { MiniGameBase } from '../MiniGameBase'
import { Colours } from '../Colours'
import tileImageMonkey from './matcha-card-monkey.png'
import tileImageDog from './matcha-card-dog.png'
import tileImagePig from './matcha-card-pig.png'
import tileImageChicken from './matcha-card-chicken.png'
import tileImageRabbit from './matcha-card-rabbit.png'
import tileImageRat from './matcha-card-rat.png'
import { rackToString, createRack, stringToRack, getRowString, getColumnString } from './rack'
import { Bong } from '../bong'

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
 * For animation:
 * - the 'gsap' animation library is proving annoying in other mini-games and
 *   not acting intuitively so I want to just use three.js built-in animation
 *   features. In the process I might discover what I'm doing wrong in 'gsap'.
 *
 * https://threejs.org/manual/#en/animation-system
 * simplest example: https://threejs.org/examples/?q=keys#misc_animation_keys
 * example code: https://github.com/mrdoob/three.js/blob/master/examples/misc_animation_keys.html
 * Class relationships for the system
 * AnimationAction drives
 * AnimationMixer controlling
 * AnimationClip has
 * KeyframeTrack
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
      gameTransform: {
        position: {
          x: 0, y: 0, z: 0
        },
        rotation: {
          x: 0, y: 0, z: 0
        },
        scale: 1.0,
      },
      colours: {
        backdrop: Colours.get('camouflage green'),
        highlight: Colours.get('cyan'),
        lineWin: Colours.get('custard')
      },
    }
    this.animationQueue = []
    this.data2D = null
    this.testing = true
    this.loadSettings()
    // load settings from parent
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      {
        const fld = this.gui.addFolder('transform').onChange((v) => {
          this.redraw()
        })
        const t = this.params.gameTransform
        fld.add(t, 'scale', 0.01, 4.0, 0.01).onChange((v) => {
          this.group.scale.setScalar(v)
        })
        fld.add(t.position, 'x', -50, 50, 0.2).onChange((v) => {
          this.group.position.x = v
        })
        fld.add(t.position, 'y', -50, 50, 0.2).onChange((v) => {
          this.group.position.y = v
        })
        fld.add(t.position, 'z', -50, 50, 0.2).onChange((v) => {
          this.group.position.z = v
        })
        fld.add(t.rotation, 'x', 0, 360, 22.5).onChange((v) => {
          this.group.rotation.x = THREE.MathUtils.degToRad(v)
        })
        fld.add(t.rotation, 'y', 0, 360, 22.5).onChange((v) => {
          this.group.rotation.y = THREE.MathUtils.degToRad(v)
        })
        fld.add(t.rotation, 'z', 0, 360, 22.5).onChange((v) => {
          this.group.rotation.z = THREE.MathUtils.degToRad(v)
        })
      }
      this.screen.addMixer('Matcha', (delta) => { return this.animate(delta) })
    })
  }

  loadSettings () {
    if (this.parent instanceof MiniGameBase && this.parent.parent instanceof Bong) {
      const bong = this.parent.parent
      const settings = bong.settings.matchaGame || {}
      // apply settings to me...
    }
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
    this.detectScores(this.rackPatcher.bind(this))
    this.detectScores(() => {
      console.error('still detected a score after patching - rackPatcher failed!')
    })
    const fixedRack = rackToString(this.data2D)
    console.log(`fixedRack: ${fixedRack}`)
    // score matching rows and columns
    // gfx - score highlighting
  }

  /**
   * Callback for detectScores that patches winning lines on rows and columns
   * to be non-winning
   * @returns {void}
   * @param {string} rowOrCol 'row' or 'col'
   * @param {number} rcIndex row or column index
   * @param {number} pos starting position of the match
   * @param {string} line the matched line string
   */
  rackPatcher (rowOrCol, rcIndex, pos, line) {
    const p = this.params
    const nTiles = p.tileInfo.length
    const t = this.data2D
    console.assert(t.length === p.h, 'data2D height mismatch')
    for (const r of t) {
      console.assert(r.length === p.w, 'data2D width mismatch')
    }
    const len = line.length
    const tileId = Number(line[0])
    // assert range of tileId
    console.assert(tileId >= 0 && tileId < nTiles, 'tileId out of range')
    const tileType = p.tileInfo[tileId].name
    console.log(`match of ${len} ${tileType} tiles on ${rowOrCol} ${rcIndex} starting at position ${pos} = '${line}'`)
    if (rowOrCol === 'row') {
      // the horizontal rows pass - rcIndex is y, pos is start x
      const row = rcIndex
      const col = pos
      // what tile to use instead?
      // STRATEGY: break up the scoring line.
      // Start at index 1 of the scoring line (skip 0)
      // and alter every third tile until the last tile - if last tile is reached exactly, replace the previous one instead?
      for (let i = 1; i < line.length; i += 3) {
        // we know that the tile at (row, col + i) is part of the match and thus equal to tileId but let's assert it
        console.assert(line[i] === `${tileId}`, 'line match mismatch inside blit loop')
        console.log(` - patching tile at row ${row}, column ${col + i}`)
        // pick next suitable image - loop through until all is good or we run out of options...
        let foundGoodReplacement = null
        for (let id = (tileId + 1) % nTiles; id !== tileId; id = (id + 1) % nTiles) {
          // would changing this tile to the new id create a new match in its column?
          // look "above"...
          if (row + 1 < p.h && t[row + 1][col + i] === `${id}`) {
            console.log(` - oo-er found matching tile for ${id} "above" at ${row + 1}, ${col + i}`)
            continue
          }
          // look "below"...
          if (row - 1 >= 0 && t[row - 1][col + i] === `${id}`) {
            console.log(` - oo-er found matching tile for ${id} "below" at ${row - 1}, ${col + i}`)
            continue
          }
          foundGoodReplacement = id
          break
        }
        if (foundGoodReplacement === null) {
          console.error('unable to find non-matching replacement tile - theoretically impossible on a 6 tile set?')
          continue
        }
        // actually alter the data2D
        console.log(` - patching tile at row ${row}, column ${col + i} to ${foundGoodReplacement}`)
        t[row][col + i] = `${foundGoodReplacement}`
      }
    } else if (rowOrCol === 'col') {
      const col = rcIndex
      const row = pos
      // does the column case require more mental gymnastics?
      // we still need to look along the vertical scoring line and alter it to be non-scoring
      // the index along the line is the increasing row number
      for (let i = 1; i < line.length; i += 3) {
        console.assert(line[i] === `${tileId}`, 'line match mismatch inside blit loop (col)')
        console.log(` - patching tile at row ${row + i}, column ${col}`)
        // pick next suitable image - loop through until all is good or we run out of options...
        let foundGoodReplacement = null
        for (let id = (tileId + 1) % nTiles; id !== tileId; id = (id + 1) % nTiles) {
          // would changing this tile to the new id create a new match in its row?
          // look to the column on the "right"...
          if (col + 1 < p.w && t[row + i][col + 1] === `${id}`) {
            console.log(` - oo-er found matching tile for ${id} "right" at ${row + i}, ${col + 1}`)
            continue
          }
          // look "left"...
          if (col - 1 >= 0 && t[row + i][col - 1] === `${id}`) {
            console.log(` - oo-er found matching tile for ${id} "left" at ${row + i}, ${col - 1}`)
            continue
          }
          foundGoodReplacement = id
          break
        }
        if (foundGoodReplacement === null) {
          console.error('unable to find non-matching replacement tile - theoretically impossible on a 6 tile set?')
          continue
        }
        // actually alter the data2D
        console.log(` - patching tile at row ${row + i}, column ${col} to ${foundGoodReplacement}`)
        t[row + i][col] = `${foundGoodReplacement}`
      }
    }
  }

  freshGfx () {
    const p = this.params
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.createTileProtoMeshes()
    const t = this.data2D
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(p.w, p.h),
      new THREE.MeshBasicMaterial({ color: p.colours.backdrop, side: THREE.DoubleSide })
    )
    backdrop.name = 'backdrop'
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
      h.layers.disable(CLICKABLE_LAYER) // make unclickable
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
    let score = 0
    // look at the rows first...
    for (let y = 0; y < p.h; y++) {
      const s = getRowString(y, p.w, t)
      const ma = s.matchAll(this.rx)
      for (const m of ma) {
        score++
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
        score++
        if (typeof matchHandler === 'function') {
          matchHandler('col', x, m.index, m[0])
        }
      }
    }
    return score
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

  swapData2D (r1, c1, r2, c2) {
    const t = this.data2D
    const temp = t[r1][c1]
    t[r1][c1] = t[r2][c2]
    t[r2][c2] = temp
  }

  swapTiles (obj, p2, otherTile, p1, useTween = true) {
    // does this change make a score?
    // swap the tiles in the 2D data...
    this.swapData2D(p1.y, p1.x, p2.y, p2.x)
    const score = this.detectScores()
    if (!score) {
      this.swapData2D(p2.y, p2.x, p1.y, p1.x)
    }

    if (useTween) {
      // let's try to use tween lib properly
      const obj1 = otherTile
      const obj2 = obj
      const dur = 1000
      const midPoint = p2.clone().sub(p1).multiplyScalar(0.5).add(p1)
      const [m1, m2] = [midPoint.clone(), midPoint.clone()]
      m1.z += 0.45
      m2.z += 0.25
      const t1 = new TWEEN.Tween(obj1.position).to({ x: [p1.x, m1.x, p2.x], y: [p1.y, m1.y, p2.y], z: [p1.z, m1.z, p2.z] }, dur).start()
      const t2 = new TWEEN.Tween(obj2.position).to({ x: [p2.x, m2.x, p1.x], y: [p2.y, m2.y, p1.y], z: [p2.z, m2.z, p1.z] }, dur).start()
      // again submit an animation function to the queue
      this.animationQueue.push((delta) => {
        t1.update(delta)
        t2.update(delta)
        return (t1.isPlaying() || t2.isPlaying())
      })
    } else {
    // Hand crafted animation things in Three JS
    // this seems rather excessive - I'm probably doing this wrong
      const mid = p2.clone().sub(p1).multiplyScalar(0.5).add(p1)
      const m1 = mid.clone()
      const m2 = mid.clone()
      m1.z += 0.45
      m2.z += 0.25
      const kf1 = new THREE.VectorKeyframeTrack('.position', [0, 0.5, 1.0], [p1.x, p1.y, p1.z, m1.x, m1.y, m1.z, p2.x, p2.y, p2.z])
      const kf2 = new THREE.VectorKeyframeTrack('.position', [0, 0.5, 1.0], [p2.x, p2.y, p2.z, m2.x, m2.y, m2.z, p1.x, p1.y, p1.z])
      const clip1 = new THREE.AnimationClip('Action', -1, [kf1])
      const clip2 = new THREE.AnimationClip('Action', -1, [kf2])
      const mixer1 = new THREE.AnimationMixer(otherTile)
      const mixer2 = new THREE.AnimationMixer(obj)
      const action1 = mixer1.clipAction(clip1)
      const action2 = mixer2.clipAction(clip2)
      // TODO if no score then ping-pong to swap back and maybe do it faster
      const loopStyle = score ? THREE.LoopOnce : THREE.LoopPingPong
      const loopTimes = score ? 1 : 2
      action1.setLoop(loopStyle, loopTimes)
      action2.setLoop(loopStyle, loopTimes)
      action1.clampWhenFinished = action2.clampWhenFinished = true
      action1.play()
      action2.play()
      // this animation will be called from the renderer until it returns false upon which it will be removed from the animation queue
      const swapAnimation = (delta) => {
        action1.getMixer().update(delta)
        action2.getMixer().update(delta)
        const stillRunning = action1.isRunning() || action2.isRunning()
        if (score && !stillRunning) {
          setTimeout(() => { this.runScoreTileFalling() })
        }
        return stillRunning
      }
      this.animationQueue.push(swapAnimation)
    }
  }

  runScoreTileFalling () {
    console.log('runScoreTileFalling')
    // decide on scoring:
    // 3x = 100
    // 4x = 200
    // 5x = 400 (theoretical max surely unless random drops are weird)
    // combo multipliers
    // highlight the scoring blocks and remove them all (with animations!)
    // Do drop of all tiles into the available space
    // choose the animation for block disappearance
    //
    const sc = this.detectScores(this.boom.bind(this))
    console.assert(sc, 'should have scored here!')
  }

  boom (rowOrCol, rcIndex, pos, line) {
    const t = this.data2D
    const p = this.params
    // let's start with highlighting a line
    const isRow = (rowOrCol === 'row')
    const w = isRow ? line.length : 1
    const h = isRow ? 1 : line.length
    const geo = new THREE.BoxGeometry(w + p.tileSpacing, h + p.tileSpacing, p.tileThickness * 1.2)
    const mat = new THREE.MeshBasicMaterial({ color: p.colours.lineWin, wireframe: false, transparent: true, opacity: 0.7 })
    const m = new THREE.Mesh(geo, mat)
    // position box centre
    const mid = ((line.length - 1) / 2)
    const x = isRow ? pos + mid : rcIndex
    const y = isRow ? rcIndex : pos + mid
    m.position.set(x, y, 0)
    m.visible = true
    m.layers.disable(CLICKABLE_LAYER) // make clickable
    this.rack.add(m)

    // TODO little animation of a single tile exploding

    this.redraw()
  }

  /**
   * Called by the Screen animation mixer.
   *
   * @returns {boolean} whether a redraw is required
   */
  animate (delta) {
    // anything in the queue to animate?
    if (!this.active || this.animationQueue.length === 0) { return false }
    const keep = []
    for (const func of this.animationQueue) {
      // functions should return false if they want to fall off the queue
      if (func(delta)) {
        keep.push(func)
      }
    }
    this.animationQueue = keep
    // return that we need to redraw...
    return true
  }
}
