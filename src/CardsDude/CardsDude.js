import * as THREE from 'three'
import { gsap } from 'gsap'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry'
import cardThing from './card-attempt-01.glb'
import tableThing from './table.glb'
import { Screen } from '../Screen'
import * as cardUtils from './cardUtils'
import CameraControls from 'camera-controls'
import { isString, isObject, isInteger } from '../wahWah'
import { depthFirstReverseTraverse, generalObj3dClean } from '../threeUtil'

/**
 * Cards Dude mini-game
 *
 * My original game seems to be lost! Recreating it from scratch.
 *
 * Card games database - using the terminology and human readable data from xmsol (https://github.com/plastovicka/xmsol)
 *
 * Card images and models - https://discourse.threejs.org/t/plane-mesh-with-rounded-corners-that-can-have-an-image-texture/46892
 * size and shape of real cards
 * bicycle brand playing cards - https://en.wikipedia.org/wiki/Bicycle_Playing_Cards
 * - poker size (3.5 by 2.5 inches [8.9 cm × 6.4 cm]), bridge size (3.5 by 2.25 inches [8.9 cm × 5.7 cm])
 *
 * - Standard playing card size: 2.5in x 3.5in
 * - Required bleed: 2mm along each edge
 * - Recommended margin: 5mm
 * - Rounded corner size: 3.5mm
 *
 *
 * layout spacing as per user preferences
 * the card table is the group
 * the entire group can be scaled in the parent game
 *
 * Shuffles - we want a simple seeded PRNG to create reusable shuffles from a shuffle number
 * Seeding a PRNG in JS https://github.com/davidbau/seedrandom
 * fisher-yates
 */
const games = {
  // TODO: make a game class - let's formalise this!
  // Use the terminology and rules from xmsol
  // Try to interpret correctly!
  bigSpider: {
    solType: 'spider',
    rules: // from xmsol info dialog
        `
        Big Spider
        Decks: 3

        4x  foundation
        The first card rank:  K
        Sequence rank:  descending continual
        Sequence suit:  same
        Moving group of cards:  all 13 cards

        13x  tableau
        Sequence rank:  descending
        Moving group of cards:  yes
        - Outgoing rules
        Sequence suit:  same

        1x  stock
        Deal: 13
        `,
    // from xmsol source...
    xmsolRule: `
        <game name="Big Spider" decks="3">
        <foundation repeat="4" x="500">k down all cont</foundation>
        <tableau y="250" repeat="13" count="78" hide="-1">group<out>suit</out></tableau>
        <stock deal="13"/>
        </game>
        `,
    // converted to YAML...
    xmsolYaml: `---
game:
  "-name": Big Spider
  "-decks": 3
  foundation:
    "-repeat": 4
    "-x": 500
    "#text": k down all cont
  tableau:
    "-y": 250
    "-repeat": 13
    "-count": 78
    "-hide": -1
    "#text": group
  stock:
    "-deal": 13
`,
    // as actual properties...
    name: 'Big Spider',
    decks: 3,
    foundation: {
      repeat: 4,
      x: 500,
      text: 'k down all cont',
    },
    tableau: {
      y: 250,
      repeat: 13,
      count: 78,
      hide: -1,
      text: 'group',
    },
    stock: {
      deal: 13,
    },
  }
}

class Card {
  constructor (id, rank, suit, faceUp = false) {
    console.assert(isInteger(id))
    console.assert(isString(rank))
    console.assert(isString(suit))
    console.assert(rank.length <= 2)
    console.assert(suit.length === 1)
    this.id = id
    this.rank = rank
    this.suit = suit
    this.faceUp = !!faceUp
  }
}

class CardStack extends Array {
  // Just an array but type
}

/**
 * events raised:
 * - update = you need to animate something
 * - addHistory = this just went on the undo stack
 */
class GameState extends THREE.EventDispatcher {
  constructor (game) {
    super()
    console.assert(isObject(game))
    console.assert(isString(game.name))
    console.assert(isInteger(game.tableau?.repeat))
    console.assert(isInteger(game.tableau?.count))
    this.gameInfo = Object.create(game)
    const tn = game.tableau.repeat
    // NB: constructor doesn't deal right now because we'd like to animate it
    this.stock = new CardStack()
    this.tableau = new Array(tn)
    for (let i = 0; i < this.tableau.length; i++) {
      this.tableau[i] = new CardStack()
    }
    this.history = []
  }

  startNew () {
    // TODO: proper reset of all data!
    this.stock.length = 0
    for (let i = 0; i < this.tableau.length; i++) {
      this.tableau[i].length = 0
    }
    const gi = this.gameInfo
    const ca = cardUtils.getDecks(gi.decks)
    let id = 0
    for (const c of ca) {
      const chars = c.split('')
      const suit = chars.pop()
      const rank = chars.join('')
      this.stock.push(new Card(id, rank, suit))
      id++
    }
    cardUtils.shuffle(this.stock)
    this.dispatchEvent({ type: 'update', act: 'created stock' })
    // deal n cards to cols
    const n = gi.tableau.count
    const cc = this.tableau.length
    for (let i = 0; i < n; i++) {
      const card = this.stock.pop()
      const row = Math.trunc(i / cc)
      const col = i % cc
      this.tableau[col].push(card)
      this.dispatchEvent({ type: 'update', act: 'deal from stock', card, row, col })
    }
    this.flipTopCards()
    this.addHistory(`shuffled ${gi.decks} decks and dealt a new game of ${gi.name}`)
    this.dispatchEvent({ type: 'update', act: 'safety redraw'})
  }

  addHistory (value) {
    this.history.push(value)
    this.dispatchEvent({ type: 'addHistory', value })
  }

  flipTopCards () {
    for (let col = 0; col < this.tableau.length; col++) {
      const stack = this.tableau[col]
      if (!stack.length) continue
      const row = stack.length - 1
      const card = stack[row]
      if (card.faceUp) continue
      card.faceUp = true
      this.dispatchEvent({ type: 'update', act: 'flip top card', card, row, col })
    }
  }
}

class CardsDude extends THREE.EventDispatcher {
  constructor (parent, game = games.bigSpider) {
    super()
    console.assert(parent instanceof THREE.EventDispatcher)
    // active functionality could be common to all mini-games
    this.active = false
    this.gameState = new GameState(game)
    this.gui = null // populate when parent is ready!
    this.group = new THREE.Group()
    this.group.name = 'CardsDude'
    this.layout = {
      verticalSpacingFaceUp: 0.2,
      verticalSpacingFaceDown: 0.1,
      horizontalSpacing: 0.64,
      tableauStartX: -3.9,
      tableauStartY: 1.75,
      stockPileX: -5.1,
      stockPileY: 2.2,
      stockPileZ: -0.15,
      antiFightZ: 0.002,
      faceUpFudgeZ: 0.01, // TODO: measure this properly
    }
    this.timeLine = gsap.timeline({ autoRemoveChildren: true /* , onComplete: this.redraw.bind(this) */ })
    this.loadModels()
    parent.addEventListener('ready', (ev) => {
      console.assert(ev.gui instanceof GUI)
      console.assert(ev.group instanceof THREE.Object3D)
      console.assert(typeof ev.redrawFunc === 'function')
      console.assert(ev.screen instanceof Screen)
      this.redraw = ev.redrawFunc
      this.screen = ev.screen
      ev.group.add(this.group)
      const f = this.gui = ev.gui.addFolder('Cards Dude!')
      f.add(this, 'testCardsDude')
      f.add(this, 'activate')
      f.add(this, 'deactivate')
      f.add(this, 'lookAtCardTable')
      this.gameState.addEventListener('update', this.handleGameStateUpdate.bind(this))
      this.screen.addMixer('CardsDude', (delta) => { return this.animate(delta) })
    })
  }

  loadModels () {
    // make a card, get screen and add
    const loader = new GLTFLoader()
    const progressCb = (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% loaded') }
    const errCb = (error) => { console.error('An error happened', error) }
    // make the playing surface mat
    const makeMat = () => {
      const g = new RoundedBoxGeometry(1, 1, 0.1, 5, 0.1)
      const m = new THREE.MeshLambertMaterial({ color: 0x0a660a })
      const mat = new THREE.Mesh(g, m)
      mat.name = 'mat'
      this.group.add(mat)
      mat.position.set(-0.2, -0.84, 0.83)
      mat.scale.set(2, 1.25, 0.5)
      // put the mat on the table but don't use the table's messed up matrix!
      // let fld = this.gui.addFolder('mat position').onChange(this.redraw)
      // fld.add(o.position, 'x').step(0.01)
      // fld.add(o.position, 'y').step(0.01)
      // fld.add(o.position, 'z').step(0.01)
      // fld = this.gui.addFolder('mat scale').onChange(this.redraw)
      // fld.add(o.scale, 'x').step(0.05)
      // fld.add(o.scale, 'y').step(0.05)
      // fld.add(o.scale, 'z').step(0.05)
      // this.gui.addColor(o.material, 'color').onChange(this.redraw)
      // -----------------------------------------------------------------------
      // since the scale of the mat is arbitrary and I'm too thick to sort it
      // all out, I'll set the location of the playing space...
      // Shrink the group to make the card size look right and move it
      // just above the surface of the mat...
      // TODO automatically fit the game playing space to the top surface of the mat!
      const ps = new THREE.Group()
      ps.name = 'playSpace'
      ps.position.copy(mat.position)
      this.group.add(ps)
      this.playSpace = ps
      ps.scale.multiplyScalar(0.22)
      ps.position.z += 0.026
    }
    // Card model - the "Master-Card"
    loader.load(cardThing, (data) => {
      const masterCard = data.scene.children[0]
      // test our assumption about the model...
      console.assert(masterCard && masterCard.name === 'Card')
      masterCard.rotateX(Math.PI / 2)
      this.masterCard = masterCard
    }, progressCb, errCb)
    // Table model (belongs in parent I suppose)
    loader.load(tableThing, (data) => {
      const table = data.scene.children[0]
      table.rotateX(Math.PI / 2)
      table.translateY(-1)
      table.scale.divideScalar(1.7)
      this.group.add(table)
      this.table = table
      makeMat()
      this.redraw()
    }, progressCb, errCb)
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
   * Here we perform all the graphical changes and animations as driven by the
   * GameState events.
   *
   * It might be interesting if this were async and filled a queue with little tasks!
   */
  handleGameStateUpdate (ev) {
    // console.log(`${ev.type} ${ev.act}`)
    if (ev.act === 'created stock') {
      depthFirstReverseTraverse(null, this.playSpace, generalObj3dClean)
      // TODO place stock on the table next to the mat perhaps on a box
      // populate with clones
      const g = this.playSpace
      for (const card of this.gameState.stock) {
        this.create3dCard(card, g)
      }
      // spread stock cards in Z
      for (let row = 0; row < g.children.length; row++) {
        const c = g.children[row]
        c.position.set(this.layout.stockPileX, this.layout.stockPileY, this.layout.stockPileZ + (row * this.layout.antiFightZ))
      }
    }
    if (ev.act === 'deal from stock') {
      // console.log(ev.card, ev.row, ev.col)
      const obj = this.playSpace.getObjectByName(`card_${ev.card.id}`)
      const x = this.layout.tableauStartX + (ev.col * this.layout.horizontalSpacing)
      const y = this.layout.tableauStartY - (ev.row * this.layout.verticalSpacingFaceDown)
      const z = ev.row * this.layout.antiFightZ
      this.timeLine.to(obj.position, { x, y, z, duration: 0.08 })
      // obj.position.set(x, y, z)
    }
    if (ev.act === 'flip top card') {
      // console.log(`${ev.type} ${ev.act}`, ev.card)
      console.assert(ev.card instanceof Card)
      const obj = this.playSpace.getObjectByName(`card_${ev.card.id}`)
      console.assert(obj instanceof THREE.Object3D)
      // this position needs to be absolute based on row and what's face up
      // const stack = this.gameState.tableau[ev.row]
      const z = (ev.row * this.layout.antiFightZ) + this.layout.faceUpFudgeZ
      this.timeLine.set(obj.position, { z, duration: 0.01 })
      const x = obj.rotation.x + Math.PI
      this.timeLine.to(obj.rotation, { x, duration: 0.1 })
    }
    this.redraw()
  }

  create3dCard (card, g) {
    const nc = this.masterCard.clone(true)
    // TODO: create and cache card face texture
    nc.userData = { card }
    nc.name = `card_${card.id}`
    g.add(nc)
  }

  testCardsDude () {
    console.log('testCardsDude')
    this.activate()
    this.gameState.startNew()
  }

  activate () {
    this.group.visible = true
    this.active = true
    // a little sample showing activity
    // this.screen.addMixer('testCardsDude', (_delta) => {
    //   this.masterCard.rotation.z += 0.01
    //   return true
    // })
    this.redraw()
  }

  deactivate () {
    this.group.visible = false
    this.active = false
    // this.screen.removeMixer('testCardsDude')
    this.redraw()
  }

  lookAtCardTable () {
    console.log('lookAtCardTable')
    const cc = this.screen?.cameraControls
    if (!this.playSpace) return
    console.assert(cc instanceof CameraControls)
    // cc.moveTo( x, y, z, enableTransition )
    cc.setLookAt(-0.21, -2.49, 3.32, 0.16, -0.26, -0.16, true)
    // cc.fitToSphere(this.group, true)
  }
}

export { CardsDude }
