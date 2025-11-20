import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import * as TWEEN from 'three/addons/libs/tween.module.js'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { MiniGameBase } from '../MiniGameBase'
import { MiniGames } from '../MiniGames'
import { Colours } from '../Colours'
import { rackToString, createRack, stringToRack, getRowString, getColumnString } from './rack'
import { Bong } from '../bong'
import { SoundBoard } from '../SoundBoard'
import { delayMs } from '../util'

import tileImageMonkey from './matcha-card-monkey.png'
import tileImageDog from './matcha-card-dog.png'
import tileImagePig from './matcha-card-pig.png'
import tileImageChicken from './matcha-card-chicken.png'
import tileImageRabbit from './matcha-card-rabbit.png'
import tileImageRat from './matcha-card-rat.png'

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
 * Found that tween.js is easier to use for simple animations so using that for now.
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
    this.score = 0
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
        backdrop: Colours.get('bruise'),
        highlight: Colours.get('cyan'),
        lineWin: Colours.get('custard')
      },
    }
    this.animationQueue = []
    this.data2D = null
    this.testing = true
    this.loadSettings()
    this.flashMaterial = new THREE.MeshLambertMaterial({ color: this.params.colours.lineWin, transparent: true, opacity: 0.1 })
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
    if (this.parent instanceof MiniGames && this.parent.parent instanceof Bong) {
      const bong = this.parent.parent
      const settings = bong.settings.matchaGame || {}
      // apply settings to me...
      if (settings?.testing !== undefined) {
        this.testing = settings.testing
      }
    }
  }

  runTest () {
    this.score = 0
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
   * Detect all scoring "lines" in the 2D rack data (all regex matches)
   * The handler function can do whatever it wants with the info including
   * changing the data! This is less concerning that it sounds because
   * each row or column can be handled with consideration of its neighbours.
   *
   * @param {function} matchHandler optional function to be called for each match found
   * with args (rowOrCol, rcIndex, pos, line)
   * @returns {Array} array of match objects with properties:
   *   - rowOrCol: 'row' or 'col'
   *   - rcIndex: row or column index
   *   - pos: starting position of the match
   *   - line: the matched line string
   *
   * Naturally, if the data is changed by the handler, then this will be
   * potentially flawed. See usage to gain some understanding.
   */
  detectScores (matchHandler = null) {
    const p = this.params
    const t = this.data2D
    const results = []
    // look at the rows first...
    for (let y = 0; y < p.h; y++) {
      const s = getRowString(y, p.w, t)
      const ma = s.matchAll(this.rx)
      for (const m of ma) {
        results.push({ rowOrCol: 'row', rcIndex: y, pos: m.index, line: m[0] })
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
        results.push({ rowOrCol: 'col', rcIndex: x, pos: m.index, line: m[0] })
        if (typeof matchHandler === 'function') {
          matchHandler('col', x, m.index, m[0])
        }
      }
    }
    return results
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
      new THREE.MeshLambertMaterial({ color: p.colours.backdrop, side: THREE.DoubleSide })
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
    // create 3D array of tile objects from prototype meshes...
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        const tile = p.tileInfo[Number(t[y][x])].mesh.clone()
        tile.position.set(x, y, 0)
        tile.layers.enable(CLICKABLE_LAYER) // make clickable
        rack.add(tile)
      }
    }
    this.clickable = [rack]
    this.noClicking = false
    // create a highlight object for first chosen tile
    {
      const geo = new THREE.BoxGeometry(p.tileSize + p.tileSpacing, p.tileSize + p.tileSpacing, p.tileThickness * 1.2)
      const mat = new THREE.MeshBasicMaterial({ color: Colours.get('cyan'), wireframe: false, transparent: true, opacity: 0.8 })
      const h = new THREE.Mesh(geo, mat)
      h.visible = false
      h.layers.disable(CLICKABLE_LAYER) // make un-clickable
      rack.add(h)
      this.highlightObj = h
    }
    this.activate()
    this.redraw()
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
    if (this.noClicking) { return false }
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

  clickableClicked (obj) {
    this.activate()
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
    // disable clicking during the swap and score animations
    this.noClicking = true
    this.clearLineHighlights()
    // does this change make a score?
    // swap the tiles in the 2D data...
    this.swapData2D(p1.y, p1.x, p2.y, p2.x)
    const scores = this.detectScores()
    if (!scores.length) {
      this.swapData2D(p2.y, p2.x, p1.y, p1.x)
    }
    SoundBoard.getInstance().play('defenderLanderDestroyed')
    // let's try to use tween lib properly
    // https://tweenjs.github.io/tween.js/docs/user_guide.html
    const obj1 = otherTile
    const obj2 = obj
    const dur = 1000
    const midPoint = p2.clone().sub(p1).multiplyScalar(0.5).add(p1)
    const [midOver, midUnder] = [midPoint.clone(), midPoint.clone()]
    midOver.z += 0.45
    midUnder.z += 0.25
    const e = TWEEN.Easing.Bounce.Out
    const t1 = new TWEEN.Tween(obj1.position).to({ x: [p1.x, midOver.x, p2.x], y: [p1.y, midOver.y, p2.y], z: [p1.z, midOver.z, p2.z] }, dur).easing(e).start()
    const t2 = new TWEEN.Tween(obj2.position).to({ x: [p2.x, midUnder.x, p1.x], y: [p2.y, midUnder.y, p1.y], z: [p2.z, midUnder.z, p1.z] }, dur).easing(e).delay(90).start()
    if (scores.length) {
      t2.onComplete(() => {
        setTimeout(() => { this.runScoreAnimations(scores, midPoint) })
      })
    } else {
      // No score? Bounce back and play a notification sound...
      // cSpell:ignore yoyo
      t1.yoyo(true).repeat(1)
      t2.yoyo(true).repeat(1)
      t2.onComplete(() => {
        this.noClicking = false
        setTimeout(() => { SoundBoard.getInstance().play('defenderBaiterBusted') })
      })
    }
    // Submit animation function to the queue
    // NB: TWEEN can't use the delta...
    this.animationQueue.push((delta) => {
      t1.update()
      t2.update()
      return (t1.isPlaying() || t2.isPlaying())
    })
  }

  /**
   * Called upon detecting scoring tiles - clear winning lines and collapse new
   * tiles into columns with space
   *
   * @param {Array} scores array of match objects with properties:
   *  - rowOrCol: 'row' or 'col'
   *  - rcIndex: row or column index
   *  - pos: starting position of the match
   *  - line: the matched line string
   * @returns {Promise<void>}
   */
  async runScoreAnimations (scores, midPoint = null) {
    console.log('runScoreAnimations')
    console.assert(scores.length, 'should have scored here!')
    // highlight the scoring blocks and remove them all (with animations!)
    // Do drop of all tiles into the available space
    // choose the animation for block disappearance

    // remove all children of rack that are highlights
    // shouldn't be necessary outside of debugging...
    this.clearLineHighlights()
    // Now highlight all scoring lines...
    // const scores = this.detectScores(this.highlightLine.bind(this))
    for (const score of scores) {
      this.highlightLine(score.rowOrCol, score.rcIndex, score.pos, score.line)
    }
    SoundBoard.getInstance().play('defenderHumanoidSave')
    this.addScores(scores)
    // for each score highlight, animate disappearance of tiles
    await this.waitForAnimations()
    this.clearLineHighlights()
    let delay = 10
    const easing = TWEEN.Easing.Cubic.In
    for (const line of scores) {
      // individual tile removal animations...
      const t = this.data2D
      const isRow = (line.rowOrCol === 'row')
      const len = line.line.length
      for (let i = 0; i < len; i++) {
        const row = isRow ? line.rcIndex : line.pos + i
        const col = isRow ? line.pos + i : line.rcIndex
        t[row][col] = '-' // mark as empty
        // find the tile object at this position
        const tileObj = this.rack.children.find(o => o.position.x === col && o.position.y === row)
        console.assert(tileObj, 'unable to find tile object to remove at scored position')
        if (!tileObj) { continue }
        // animate disappearance
        const dur = 600
        const t1 = new TWEEN.Tween(tileObj.scale).to({ x: 0.01, y: 0.01, z: 0.01 }, dur).easing(easing).delay(delay).start()
        t1.onComplete(() => {
          this.rack.remove(tileObj)
        })
        this.animationQueue.push(() => {
          t1.update()
          return t1.isPlaying()
        })
        delay += 100
      }
    }
    this.redraw()
    await this.waitForAnimations()
    // Animate falling of tiles to fill gaps...
    // just look at all tiles? Maybe just the affected columns?
    const p = this.params
    const t = this.data2D
    const columnData = []
    // get column text and look for the new blank '-' entries
    for (let x = 0; x < p.w; x++) {
      const tilesToDrop = []
      columnData.push(tilesToDrop)
      const s = getColumnString(x, p.h, t)
      let drop = 0
      // starting at the bottom of the column...
      for (let y = 0; y < p.h; y++) {
        if (s[y] === '-') {
          drop++
        } else {
          // this tile needs to drop maybe
          if (drop) {
            const tileObj = this.rack.children.find(o => o.position.x === x && o.position.y === y)
            console.assert(tileObj, 'unable to find tile object to remove at scored position')
            if (!tileObj) { continue }
            const newY = y - drop
            // TODO shaky x animation before fall
            const tw = new TWEEN.Tween(tileObj.position).to({ y: newY }, 300)
            const afterWhich = () => { this.swapData2D(y, x, newY, x) }
            tilesToDrop.push({ tw, afterWhich })
          }
        }
      }
    }

    // get column indices and order by modular distance from centre OR from the midpoint of the last swap
    const colIndices = [...Array(p.w).keys()]
    const centre = midPoint ? midPoint.x : (p.w - 1) / 2
    colIndices.sort((a, b) => {
      return Math.abs(a - centre) - Math.abs(b - centre)
    })
    // now queue up the drop animations in the desired order
    delay = 0
    for (const x of colIndices) {
      const tilesToDrop = columnData[x]
      for (const act of tilesToDrop) {
        act.tw.delay(delay).onComplete(act.afterWhich.bind(this)).start()
        this.animationQueue.push(() => {
          act.tw.update()
          return act.tw.isPlaying()
        })
        delay += 150
      }
    }
    await this.waitForAnimations()

    // TODO then generate new tiles at top to fill gaps
    // TODO then detectScores again and repeat if necessary
    // finally...
    this.noClicking = false
    this.redraw()
  }

  async waitForAnimations () {
    console.log('waiting for animations to finish...')
    console.time('waitForAnimations')
    while (this.animationQueue.length) {
      await delayMs(100)
    }
    console.timeEnd('waitForAnimations')
    console.log('animations finished')
  }

  /**
   * TODO decide on scoring:
   * 3x = 100
   * 4x = 200
   * 5x = 400 (theoretical max surely unless random drops are weird)
   * combo multipliers for additional lines in one move?
   *
   */
  addScores (scores) {
    this.score += scores.length
    console.log(`current score: ${this.score}`)
  }

  clearLineHighlights () {
    let c = null
    while ((c = this.rack.getObjectByName('lineHighlight'))) {
      console.log('removing leftover lineHighlight ', c.userData)
      this.rack.remove(c)
    }
    this.redraw()
  }

  highlightLine (rowOrCol, rcIndex, pos, line) {
    const p = this.params
    // let's start with highlighting a line
    const isRow = (rowOrCol === 'row')
    const w = isRow ? line.length : 1
    const h = isRow ? 1 : line.length
    const geo = new THREE.BoxGeometry(w, h, p.tileThickness * 1.2)
    const mat = this.flashMaterial.clone()
    const m = new THREE.Mesh(geo, mat)
    m.name = 'lineHighlight'
    m.userData.lineInfo = { rowOrCol, rcIndex, pos, line }
    // position box centre
    const mid = ((line.length - 1) / 2)
    const x = isRow ? pos + mid : rcIndex
    const y = isRow ? rcIndex : pos + mid
    m.position.set(x, y, 0)
    m.visible = true
    m.layers.disable(CLICKABLE_LAYER) // make clickable
    this.rack.add(m)

    // TODO little animation of each single tile exploding
    const t1 = new TWEEN.Tween(mat).to({ opacity: 0.9 }, 300).start()
    this.animationQueue.push((delta) => {
      // NB: TWEEN can't use the delta...
      t1.update()
      return t1.isPlaying()
    })
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
