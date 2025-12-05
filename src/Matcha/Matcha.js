import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import * as TWEEN from 'three/addons/libs/tween.module.js'
import seedrandom from 'seedrandom'
import path from 'path-browserify'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { MiniGameBase } from '../MiniGameBase'
import { Colours } from '../Colours'
import { rackToString, createRack, stringToRack, getRowString, getColumnString } from './rack'
import { Bong } from '../bong'
import { SoundBoard } from '../SoundBoard'
import { dateTimeStamp, delayMs } from '../util'
import { isInteger } from '../wahWah'
import { Dlg } from '../dlg'
import { ScoreBox } from '../ScoreBox'
import { pickFile, outputFile } from '../HandyApi'

import tileImageMonkey from './matcha-card-monkey.png'
import tileImageDog from './matcha-card-dog.png'
import tileImagePig from './matcha-card-pig.png'
import tileImageChicken from './matcha-card-chicken.png'
import tileImageRabbit from './matcha-card-rabbit.png'
import tileImageRat from './matcha-card-rat.png'
import { Banzuke } from '../SumoDoyoh/Banzuke'
import { SumoDoyoh } from '../SumoDoyoh/SumoDoyoh'

// cspell:ignore yoyo pizzabox chik Banzuke

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
 * - while animating swaps and scores, clicking is disabled
 *
 * A non-graphical data is convenient to hold the initial or current state of the rack
 * - this is a 2D array of text digits representing tile types
 *   TODO: we would only talk in terms of rows and columns (rather than x and y which would only be required in the 3D gfx world)
 *   TODO: with width and height as the limits
 * - functions to create, convert, and access the data are in rack.js
 * - we want to look at the data in rows and columns for scoring and to detect
 *   scoring lines we can use a regex on a text representation of the rows/columns
 * TODO: the 2D data is more concerned with the overall state
 * whereas the 3D gfx world is more concerned with identity of objects and
 * allowing them to move around nicely.
 *
 * For animation:
 * - the 'gsap' animation library is proving annoying in other mini-games and
 *   not acting intuitively so I tried to use three.js built-in animation
 *   features (https://threejs.org/manual/#en/animation-system)
 * - in the end I found that tween.js is easier to use and is working well
 *
 * DONE: good score display
 * TODO: timer, pause button, restart, smart bomb etc.
 * DONE: more sound effects
 * TODO: PROGRESS: detection of available moves and indication of "no more moves possible" state
 * TODO: load and save game state
 * DONE: load sumo wrestler bobble heads for tiles
 * DONE: game moves history for replay
 * TODO: replay history and check that it gets the same result
 *
 * TODO: make a web-browser version of the game - see how well webpack tree-shakes it down
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
    this.rxScore = /(\d)\1{2,}/gd
    this.rxNextMove1 = /(\d)\1{1,}/gd
    this.rxNextMove2 = /(\d).\1{1,}/gd
    this.clickable = []
    this.highlightObj = null
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
      useBanzukeBobbleHeads: true,
      colourTileOnly: true,
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
        lineWin: Colours.get('custard'),
        tileSides: Colours.get('green'),
      },
      sounds: {
        swap: 'big-maraca-os-1',
        bounceBack: 'pizzabox-hit',
        pop: 'mouth-bop',
        dropNew: 'mouth-chik',
        drop: 'finger-snap-3-xy',
      },
      // cspell:ignore Ura Ichiyamamoto Wakatakakage Kotozakura Hoshoryu Tamawashi
      favouriteRikishi: ['Ura', 'Ichiyamamoto', 'Wakatakakage', 'Kotozakura', 'Hoshoryu', 'Tamawashi'],
      mawashiColours: ['pink', 'greenish teal', 'lightblue', 'minty green', 'dusky purple', 'gunmetal'],
    }
    this.animationQueue = []
    this.data2D = null
    this.loadSettings()
    this.flashMaterial = new THREE.MeshLambertMaterial({ color: this.params.colours.lineWin, transparent: true, opacity: 0.1 })
    this.moveHistory = []
    // load settings from parent
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.add(this, 'chooseGame')
      this.gui.add(this, 'checkTiles')
      this.gui.add(this, 'refreshRackTiles')
      this.gui.add(this.params, 'useBanzukeBobbleHeads')
      this.gui.add(this.params, 'colourTileOnly')
      this.gui.add(this, 'saveGameHistory')
      this.gui.add(this, 'findMove')
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
    const bong = Bong.getInstance()
    const settings = bong?.settings?.matchaGame || {}
    console.log('loading Matcha settings:', settings)
    // TODO load and apply settings
  }

  runTest () {
    this.startGame(1)
  }

  /**
   * Start a new game.
   *
   * @param {number} shuffleNumber zero is a random game, 1 is known test data,
   * 2 and onwards use a specific seed
   */
  async startGame (shuffleNumber = 0) {
    this.setupRng(shuffleNumber)
    this.score = 0
    this.rackSetup(shuffleNumber === 1)
    this.detectScores(() => {
      console.warn('detected a score in initial state!')
    })
    this.moveHistory = [{ shuffleNumber, rack: JSON.parse(JSON.stringify(this.data2D)) }]
    await this.freshGfx()
  }

  async chooseGame () {
    const response = await Dlg.questionBox('pick a game seed (or 0 for random)', '0')
    if (response === '') {
      console.log('cancel?')
      return
    }
    console.log(response)
    // ensure integer >= 0
    const n = Number(response)
    if (!isInteger(n) || n < 0) {
      // Dlg.errorDialog('please enter a valid positive integer or zero')
      console.warn('please enter a valid positive integer or zero')
      return
    }
    this.startGame(n)
  }

  setupRng (shuffleNumber) {
    console.assert(isInteger(shuffleNumber))
    shuffleNumber ||= Math.floor(Math.random() * (Math.pow(2, 32) - 1))
    this.shuffleNumber = shuffleNumber
    const seedStr = 'Matcha_' + shuffleNumber.toString().padStart(10, '0')
    this.rng = seedrandom(seedStr)
    return shuffleNumber
  }

  randomTileId (p) {
    return Math.floor(this.rng() * p.tileInfo.length)
  }

  rackSetup (testing = false) {
    const p = this.params
    if (testing) {
      // Load a known rack for testing...
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
      // TODO detection of done states
      // no more moves possible.
      // if any scores then return false
      // for each tile
      // if any pairs then look at each end and the pairs around it
      // then find the x-x states and the pairs either side of the middle
      this.testData = {}
      this.testData.doneData2D1 = [
        ['2', '1', '3', '5', '2', '4', '5', '0'],
        ['3', '2', '1', '0', '3', '1', '3', '0'],
        ['0', '5', '4', '1', '2', '0', '4', '5'],
        ['4', '3', '0', '3', '1', '3', '2', '4'],
        ['2', '4', '2', '3', '5', '4', '2', '5'],
        ['1', '5', '2', '1', '2', '0', '1', '0'],
        ['0', '5', '3', '0', '5', '0', '3', '0'],
        ['1', '1', '3', '0', '2', '5', '3', '4']
      ]
      this.testData.doneData2D2 = [
        ['3', '1', '5', '2', '3', '4', '1', '5'],
        ['0', '4', '2', '1', '5', '2', '3', '5'],
        ['0', '3', '0', '3', '2', '5', '0', '2'],
        ['3', '5', '5', '1', '3', '4', '1', '4'],
        ['4', '0', '1', '4', '0', '4', '3', '3'],
        ['5', '3', '0', '2', '5', '1', '2', '4'],
        ['0', '4', '4', '5', '2', '0', '5', '5'],
        ['5', '2', '5', '3', '0', '1', '5', '5']
      ]
      // first complete game with the score-box 126900
      this.testData.doneData2D3 = [
        ['5', '2', '1', '5', '5', '1', '2', '0'],
        ['4', '0', '3', '1', '0', '3', '1', '3'],
        ['3', '4', '5', '4', '1', '0', '2', '0'],
        ['1', '0', '3', '0', '5', '3', '5', '4'],
        ['0', '4', '5', '2', '2', '4', '5', '1'],
        ['2', '3', '0', '3', '0', '1', '3', '2'],
        ['2', '3', '0', '1', '2', '4', '4', '3'],
        ['1', '5', '5', '2', '0', '0', '1', '1'],
      ]
      // saved game score at
      // this.score = 145600
      this.testData.ongoingGame = [
        ['2', '0', '4', '0', '5', '4', '3', '0'],
        ['5', '1', '0', '5', '3', '4', '5', '4'],
        ['1', '4', '4', '1', '5', '3', '5', '5'],
        ['5', '0', '3', '4', '1', '5', '3', '3'],
        ['0', '1', '5', '2', '5', '3', '0', '0'],
        ['4', '2', '2', '0', '1', '2', '3', '5'],
        ['4', '1', '2', '1', '3', '0', '4', '1'],
        ['2', '0', '5', '2', '0', '1', '4', '4'],
      ]
    } else {
      this.data2D = createRack(p.w, p.h, p.tileInfo.length, this.rng)
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
    for (let row = 0; row < p.h; row++) {
      const s = getRowString(row, p.w, t)
      const ma = s.matchAll(this.rxScore)
      for (const m of ma) {
        results.push({ rowOrCol: 'row', rcIndex: row, pos: m.index, line: m[0] })
        if (typeof matchHandler === 'function') {
          matchHandler('row', row, m.index, m[0])
        }
      }
    }
    // look at the columns next...
    for (let col = 0; col < p.w; col++) {
      const s = getColumnString(col, p.h, t)
      const ma = s.matchAll(this.rxScore)
      for (const m of ma) {
        results.push({ rowOrCol: 'col', rcIndex: col, pos: m.index, line: m[0] })
        if (typeof matchHandler === 'function') {
          matchHandler('col', col, m.index, m[0])
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
    // const len = line.length
    const tileId = Number(line[0])
    // assert range of tileId
    console.assert(tileId >= 0 && tileId < nTiles, 'tileId out of range')
    // const tileType = p.tileInfo[tileId].name
    // console.log(`match of ${len} ${tileType} tiles on ${rowOrCol} ${rcIndex} starting at position ${pos} = '${line}'`)
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
        // console.log(` - patching tile at row ${row}, column ${col + i}`)
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
        // console.log(` - patching tile at row ${row}, column ${col + i} to ${foundGoodReplacement}`)
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
        // console.log(` - patching tile at row ${row + i}, column ${col}`)
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
        // console.log(` - patching tile at row ${row + i}, column ${col} to ${foundGoodReplacement}`)
        t[row + i][col] = `${foundGoodReplacement}`
      }
    }
  }

  async freshGfx () {
    const p = this.params
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    await this.createTileProtoMeshes()
    const t = this.data2D
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(p.w, p.h),
      new THREE.MeshLambertMaterial({ color: p.colours.backdrop, side: THREE.DoubleSide })
    )
    backdrop.name = 'backdrop'
    backdrop.position.set(0, 0, -0.1)
    if (p.useBanzukeBobbleHeads) {
      backdrop.material.transparent = true
      backdrop.material.opacity = 0.15
      backdrop.material.needsUpdate = true
    }
    this.group.add(backdrop)
    // create "rack" for tiles...
    const rack = this.rack = new THREE.Group()
    rack.name = 'rack'
    rack.position.set(-3.5, -3.5, (p.tileThickness / 2) + 0.001)
    backdrop.add(rack)
    // create a second rack for placing highlights...
    const rack2 = this.rack2 = rack.clone()
    rack2.name = 'rack2'
    backdrop.add(rack2)
    // create 3D array of tile objects from prototype meshes...
    this.refreshRackTiles()
    // create a highlight object for first chosen tile
    {
      const geo = new THREE.BoxGeometry(p.tileSize + p.tileSpacing, p.tileSize + p.tileSpacing, p.tileThickness * 1.2)
      const mat = new THREE.MeshBasicMaterial({ color: p.colours.highlight, transparent: true, opacity: 0.8 })
      const h = new THREE.Mesh(geo, mat)
      h.visible = false
      h.layers.disable(CLICKABLE_LAYER) // make un-clickable
      rack2.add(h)
      this.highlightObj = h
    }
    const sb = this.scoreBox = new ScoreBox()
    sb.position.set(3, -4.7, 0)
    this.group.add(sb)
    this.activate()
    this.clickable = [rack, rack2]
    this.noClicking = false
    this.redraw()
  }

  async createTilesFromBanzuke () {
    const bong = Bong.getInstance()
    if (!bong) {
      throw Error('unable to get Bong instance for Banzuke access')
    }
    const sumoDoyoh = bong.miniGames?.games?.sumoDoyoh
    if ((sumoDoyoh instanceof SumoDoyoh && sumoDoyoh.banzuke instanceof Banzuke) === false) {
      throw Error('SumoDoyoh Banzuke instance not available in Bong miniGames')
    }
    const p = this.params
    if (!(p.favouriteRikishi && Array.isArray(p.favouriteRikishi) && p.favouriteRikishi.length >= p.tileInfo.length)) {
      throw Error('rikishi list not valid for use')
    }
    // cspell:ignore Doyoh
    await sumoDoyoh.loadBanzukeData()
    console.log(`found ${sumoDoyoh.banzuke.rikishi.length} banzuke entries`)
    // scan for preferred rikishi
    const cd = await sumoDoyoh.banzuke.getCacheDirFullPath(true)
    const textOffset = new THREE.Vector3(-0.8, 0.7, 0)
    const u = Math.PI / 2
    const textRot = new THREE.Euler(u, -u, u)
    for (let i = 0; i < p.tileInfo.length; i++) {
      const rikishiName = p.favouriteRikishi[i]
      const tile = this.params.tileInfo[i]
      const rikishi = sumoDoyoh.banzuke.getRikishiObjByName(rikishiName)
      if (!rikishi) {
        throw Error(`preferred rikishi ${rikishiName} not found in banzuke data`)
      }
      console.log(`found rikishi ${rikishi.shikona} for tile ${i}`)
      if (tile.mesh) {
        console.log(` - removing existing prototype mesh for tile ${tile.name}`)
      }
      const mawashiColour = Colours.get(p.mawashiColours[i])
      // add a coloured tile base
      const baseGeo = new THREE.BoxGeometry(p.tileSize, p.tileSize, p.tileThickness)
      const baseMat = new THREE.MeshLambertMaterial({ color: mawashiColour })
      const base = new THREE.Mesh(baseGeo, baseMat)
      if (p.colourTileOnly === false) {
        const v = new THREE.Vector3(0, 0, 0.2)
        const fp = path.join(cd, rikishi.cacheFileThumbnail())
        const head = await sumoDoyoh.addHead(fp, v, base)
        head.scale.divideScalar(2.5)
        head.rotation.x = 0
        const text = sumoDoyoh.addText(rikishiName, v.clone().add(textOffset), textRot)
        text.color = mawashiColour
        text.scale.multiplyScalar(0.7)
        // TODO outline text doesn't work and needs a patch in troika
        // text.outlineWidth = 0.03
        head.add(text)
      }
      tile.mesh = base
    }
  }

  refreshRackTiles () {
    const p = this.params
    const t = this.data2D
    this.rack?.clear()
    for (let row = 0; row < p.h; row++) {
      for (let col = 0; col < p.w; col++) {
        const tileId = Number(t[row][col])
        const tile = this.spawnTile(tileId)
        tile.position.set(col, row, 0)
      }
    }
  }

  async createTileProtoMeshes () {
    const p = this.params
    if (p.useBanzukeBobbleHeads) {
      try {
        await this.createTilesFromBanzuke(false)
        return
      } catch (error) {
        console.error('error creating Banzuke bobble head tiles:', error)
      }
      console.log('falling back to standard tile images')
    }
    const loader = new THREE.TextureLoader()
    const m = new THREE.MeshLambertMaterial({ color: p.colours.tileSides })
    const geometry = new THREE.BoxGeometry(p.tileSize, p.tileSize, p.tileThickness)
    for (const t of p.tileInfo) {
      const mat = new THREE.MeshLambertMaterial({ map: loader.load(t.img, () => this.redraw()) })
      const mesh = new THREE.Mesh(geometry, [m, m, m, m, mat, m])
      mesh.userData.tileType = t.name
      t.mesh = mesh
    }
  }

  spawnTile (val = 0) {
    const p = this.params
    const tile = p.tileInfo[val].mesh.clone()
    tile.layers.enable(CLICKABLE_LAYER) // make clickable
    this.rack.add(tile)
    return tile
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
    // console.log(`adjacent ${p1.x},${p1.y} <==> ${p2.x},${p2.y}`)
    const otherTile = this.rack.children.find(o => o.position.equals(p1))
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

  swapTiles (obj, p2, otherTile, p1) {
    // disable clicking during the swap and score animations
    this.noClicking = true
    this.clearLineHighlights()
    // does this change make a score?
    const scoresBefore = this.detectScores()
    this.swapData2D(p1.y, p1.x, p2.y, p2.x)
    const scores = this.detectScores()
    const bounceBack = (scores.length === scoresBefore.length)
    if (bounceBack) {
      console.log('bounce back swap - no score made')
      this.swapData2D(p2.y, p2.x, p1.y, p1.x)
    } else {
      this.moveHistory.push({ swapRc1Rc: [p1.y, p1.x, p2.y, p2.x] })
    }
    this.sound(this.params.sounds.swap)
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
    if (bounceBack) {
      t1.yoyo(true).repeat(1).onComplete(() => {
        this.sound(this.params.sounds.bounceBack)
      })
      t2.yoyo(true).repeat(1)
    }
    t2.onComplete(() => {
      setTimeout(() => { this.runScoreAnimations(scores, midPoint) })
    })
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
  async runScoreAnimations (scores, midPoint = null, multiplier = 1) {
    // console.log('runScoreAnimations')
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
    if (scores.length) {
      this.sound(this.params.sounds.pop)
    }
    this.addScores(scores, multiplier)
    // for each score highlight, animate disappearance of tiles
    await this.waitForAnimations()
    this.clearLineHighlights()
    let delay = 10
    let easing = TWEEN.Easing.Cubic.In
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
    easing = TWEEN.Easing.Cubic.In
    // scan each column looking for the new blank '-' entries...
    for (let col = 0; col < p.w; col++) {
      const tilesToDrop = []
      columnData.push(tilesToDrop)
      const s = getColumnString(col, p.h, t)
      let drop = 0
      // row by row, starting at the "bottom" of the column, decide how far tiles need to drop...
      for (let row = 0; row < p.h; row++) {
        if (s[row] === '-') {
          drop++
        } else {
          // this is a tile that maybe needs to drop...
          if (drop) {
            const tileObj = this.rack.children.find(o => o.position.x === col && o.position.y === row)
            console.assert(tileObj, 'unable to find tile object to remove at scored position')
            if (!tileObj) { continue }
            const newY = row - drop
            const tw = new TWEEN.Tween(tileObj.position).to({ y: newY }, 300).easing(easing)
            const afterWhich = () => { this.swapData2D(row, col, newY, col) }
            tilesToDrop.push({ tw, afterWhich })
          }
        }
      }
    }
    // We are going to operate on each affected column but rather than do it in
    // a boring left-to-right order, we can order based on proximity to the
    // action the user took!
    // Get column indices and order by modular distance from centre OR from the
    // midpoint of the last swap if available...
    const colIndices = [...Array(p.w).keys()]
    const centre = midPoint ? midPoint.x : (p.w - 1) / 2
    colIndices.sort((a, b) => {
      return Math.abs(a - centre) - Math.abs(b - centre)
    })
    // console.log('column order', colIndices)
    // now queue up the drop animations in the desired order
    delay = 0
    for (const x of colIndices) {
      const tilesToDrop = columnData[x]
      for (const act of tilesToDrop) {
        act.tw.delay(delay).onComplete(() => {
          act.afterWhich()
          this.sound(this.params.sounds.drop)
        }).start()
        this.animationQueue.push(() => {
          act.tw.update()
          return act.tw.isPlaying()
        })
        delay += 150
      }
    }
    await this.waitForAnimations()
    // Generate new tiles at top to fill gaps...
    const cs = []
    for (let col = 0; col < p.w; col++) {
      cs.push(getColumnString(col, p.h, t))
    }
    // console.log(`columns after drop:\n${cs.join('\n')}`)
    delay = 0
    for (const idx of colIndices) {
      const s = cs[idx]
      for (let row = 0; row < p.h; row++) {
        if (s[row] === '-') {
          // need a new tile here - pick a random tile type
          const tileId = this.randomTileId(p)
          t[row][idx] = `${tileId}`
          const tile = this.spawnTile(tileId)
          tile.position.set(idx, p.h, 0.1) // start above the rack
          const tw1 = new TWEEN.Tween(tile.position).to({ y: row, z: 0 }, 600).easing(easing).delay(delay).start().onComplete(() => {
            this.sound(this.params.sounds.dropNew)
          })
          this.animationQueue.push(() => {
            tw1.update()
            return tw1.isPlaying()
          })
          delay += 200
        }
      }
    }
    await this.waitForAnimations()
    // detectScores again and repeat if necessary
    const newScores = this.detectScores()
    if (!newScores.length) {
      // console.log('no more scores detected - finishing')
      this.noClicking = false
      this.redraw()
      return
    }
    // console.log('combo detected!')
    multiplier++
    setTimeout(() => { this.runScoreAnimations(newScores, midPoint, multiplier) })
  }

  // TODO make sure that the 3D tiles match the 2D data
  checkTiles () {
    const p = this.params
    const t = this.data2D
    console.assert(this.rack.children.length === 64, `unexpected rack children length ${this.rack.children.length}`)
    for (let row = 0; row < p.h; row++) {
      for (let col = 0; col < p.w; col++) {
        const val = t[row][col]
        console.log(val)
        const tileObj = this.rack.children.find(o => o.position.x === col && o.position.y === row)
        console.assert(tileObj, `failed to find tile object in position ${row} ${col}`)
      }
    }
  }

  async waitForAnimations () {
    // console.log('waiting for animations to finish...')
    // console.time('waitForAnimations')
    while (this.animationQueue.length) {
      await delayMs(100)
    }
    // console.timeEnd('waitForAnimations')
    // console.log('animations finished')
  }

  /**
   * Scoring:
   * 3x = 100
   * 4x = 200
   * 5x = 300 (theoretical max surely unless RNG drops are very lucky)
   * any more than 5 should trigger a message saying "what are the odds?"
   * combo x2,x3 etc. for additional lines in the first move.
   * After score is added and the new tiles drop the multiplier increases for further scores
   * https://web.archive.org/web/20100612032438/http://popcap.com/faq/bejeweled/1033/pc/readme.html
   */
  addScores (scores, multiplier = 1) {
    let combo = 1
    for (const score of scores) {
      const points = (score.line.length - 2) * 100 * combo
      this.score += points * multiplier
      this.scoreBox.setScore(this.score)
      // Dlg.popup(`score: ${this.score} (x${multiplier})`)
      combo++
    }
    this.redraw()
  }

  clearLineHighlights () {
    let c = null
    while ((c = this.rack2.getObjectByName('lineHighlight'))) {
      this.rack2.remove(c)
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
    this.rack2.add(m)
    // Animate opacity to look like a flash
    const t1 = new TWEEN.Tween(mat).to({ opacity: 0.9 }, 300).start()
    this.animationQueue.push(() => {
      t1.update()
      return t1.isPlaying()
    })
    this.redraw()
  }

  sound (name) {
    SoundBoard.getInstance().playPercussionSprite(name)
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
      // NB: TWEEN can't use this delta that comes from Screen class...
      if (func(delta)) {
        keep.push(func)
      }
    }
    this.animationQueue = keep
    // return that we need to redraw...
    return true
  }

  async saveGameHistory () {
    // file chooser for save - use timestamp in default name
    const dts = dateTimeStamp()
    console.log(dts)
    const res = await pickFile({ saveAs: `matcha_hist_${dts}.json` })
    console.log(res)
    if (res.canceled === true) {
      return
    }
    if (res?.canceled !== false) {
      console.warn('something not right', res)
      return
    }
    const f = res.filePath
    const data = {
      dts,
      score: this.score,
      moveHistory: this.moveHistory,
      finalState: this.data2D,
    }
    await outputFile(f, JSON.stringify(data), { encoding: 'utf8' })
  }

  /**
   * Look for the following patterns that are the potential next moves...
   *
   * U-shape:
   *   #.#
   *   .#.
   * J-shape:
   *   #..
   *   .##
   * I-shape:
   *   ##.#
   *
   * (these patterns can be in any orientation or reflection)
   *
   * When looking for the U-shape we match the #.# pattern and look if a tile
   * of the right value is adjacent to the middle.
   *
   * When looking for the J-shape and I-shape we match the ## pattern and look
   * at three tiles adjacent to each end.
   *
   * Use the terms source and target for the tile of correct value to be moved and the
   * position to move to respectively.
   * @async
   * @returns {Promise<object[]>} list of possible moves found
   * @argument  {boolean} quickExit TODO: quick exit upon first move found
   */
  async findMove (quickExit = false) {
    // Since this is called from the UI we need to wait for any ongoing
    // animations to finish first. The rest could well be synchronous.
    await this.waitForAnimations()
    if (this.noClicking) {
      throw Error('still busy')
    }
    // An assumption here is that the 2D state is valid and non-scoring
    console.time('findMove')
    const moves = []
    const t = this.data2D
    const p = this.params
    // We are going to need to look at multiple rows or columns at once so we
    // might as well get them all as strings
    // TODO: not really true for quick exit mode!
    // TODO: as such, no need to have all rows or columns available as strings up front
    // TODO: the 2D data should be enough to work from directly
    const cols = Array(p.w).fill('').map((v, i) => getColumnString(i, p.h, t))
    const rows = Array(p.h).fill('').map((v, i) => getRowString(i, p.w, t))
    // We need to search both rows and columns and they can be generalised as
    // dimensions...
    // TODO: use j and k as primary and secondary dimension terms
    // TODO: row scan first for speed since more likely to find a move without constructing column strings
    // when working in columns vs rows, the order of the coords when looking up neighbours is swapped - so transposed
    const dimensions = [cols, rows]
    for (let dim = 0; dim < dimensions.length; dim++) {
      // In either dimension we are just looking at an array of strings...
      const scanType = dim ? 'rows' : 'cols'
      // The number of columns is the width and the number of rows is the height...
      // TODO: we are talking about dimension length and range
      const n = dim ? p.h : p.w
      for (let i = 0; i < n; i++) {
        const s = dimensions[dim][i]
        // Let's look for any U-shape by looking for #.#...
        const ma = s.matchAll(this.rxNextMove2)
        for (const m of ma) {
          // m[0] is the entire matched string
          // m[1] is the captured tile value
          const tile = m[1]
          // Look either side of the middle tile for a next move...
          // i.e. at m.index plus one
          const j = m.index + 1
          // Look either side, i.e. the row/col one less and one more...
          for (let rc = i - 1; rc <= i + 1; rc += 2) {
            // Unless that's off the edge...
            if (rc < 0 || rc >= n) { continue }
            const os = dimensions[dim][rc]
            if (os[j] === m[1]) {
              // TODO this is ugly - whether or not to transpose coords - not very readable
              // TODO: refer to source and target tiles for clarity - the source is the tile with the scoring value
              // TODO: use row and column terms for clarity
              const [x1, y1] = dim ? [j, rc] : [rc, j]
              const [x2, y2] = dim ? [j, i] : [i, j]
              console.log(`found a U-shape move of ${tile} during ${scanType} scan at ${x1} ${y1} -> ${x2} ${y2}`)
              moves.push({ shape: 'U', scanType, tile, from: [x1, y1], to: [x2, y2] })
            }
          }
        }
        const ma2 = s.matchAll(this.rxNextMove1)
        for (const m of ma2) {
          // Look at three tiles adjacent to either end of the matched .##.
          const tile = m[1]
          // each end is a potentially scoring spot...
          // I-shape seems easier somehow
          if (m.index - 2 >= 0 && s[m.index - 2] === tile) {
            const [x1, y1] = dim ? [m.index - 2, i] : [i, m.index - 2] // rows
            const [x2, y2] = dim ? [m.index - 1, i] : [i, m.index - 1] // cols
            moves.push({ shape: 'I', scanType, tile, from: [x1, y1], to: [x2, y2] })
            console.log(`found an I-shape move of ${tile} during ${scanType} scan at ${x1} ${y1} -> ${x2} ${y2}`)
          }
          if (m.index + 2 >= 0 && s[m.index + 2] === tile) {
          }
        }
      }
    }
    console.timeEnd('findMove')
    return moves
  }
}
