import * as THREE from 'three'
import TWEEN from 'three/addons/libs/tween.module.js'
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
  constructor (rank, suit, faceUp = false) {
    console.assert(isString(rank))
    console.assert(isString(suit))
    console.assert(rank.length <= 2)
    console.assert(suit.length === 1)
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
    const nd = this.gameInfo.decks
    const ca = cardUtils.getDecks(nd)
    this.stock.length = 0
    cardUtils.shuffle(ca)
    for (const c of ca) {
      const chars = c.split('')
      const suit = chars.pop()
      const rank = chars.join('')
      this.stock.push(new Card(rank, suit))
    }
    this.dispatchEvent({ type: 'update', act: 'created stock' })
    // deal

    this.addHistory(`shuffled ${nd} decks and dealt a new game of ${this.game.name}`)
  }

  addHistory (value) {
    this.history.push(value)
    this.dispatchEvent({ type: 'addHistory', value })
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
    }
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
    // anything on the TWEEN
    if (!this.tween) { return false }
    this.tween.update(delta)
    return this.tween.isPlaying
  }

  handleGameStateUpdate (ev) {
    console.log(`${ev.type} ${ev.act}`)
    if (ev.act === 'created stock') {
      depthFirstReverseTraverse(null, this.stockPile, generalObj3dClean)
      const g = this.stockPile = new THREE.Group()
      g.name = 'stockPile'
      this.playSpace.add(g)
      // TODO place stock on the table next to the mat perhaps on a box
      // populate with clones
      for (const card of this.gameState.stock) {
        this.create3dCard(card, g)
      }
      // spread stock cards in Z
      for (let i = 0; i < g.children.length; i++) {
        const c = g.children[i]
        c.position.z = i * 0.002
      }
    }
    if (ev.act === 'deal card from stock') {
      console.log('TODO')
    }
    this.redraw()
  }

  create3dCard (card, g) {
    const nc = this.masterCard.clone(true)
    // TODO: create and cache card face texture
    nc.userData = { card }
    nc.name = `card_${card.rank}_${card.suit}`
    g.add(nc)
  }

  testCardsDude () {
    console.log('testCardsDude')
    this.activate()
    this.gameState.startNew()
    console.warn('TODO this is all obsolete!')

    // ------------------------------------------

    if (this.group.getObjectByName('playSpace')) {
      // TODO clean up
      console.warn('already run - add provision for re-run')
      return
    }
    const mat = this.group.getObjectByName('mat')
    {
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
      // -----------------------------------------------------------------------
      // TODO proper deal - this is just a test!
      // get a stack of shuffled cards for the game
      // totally assume bigSpider here!
      // TODO how many rows are dealt out to begin with?

      // dealing to columns - face up or down - need card 3d box geometry really!
      // add a box helper to a card and find the real centre
      // user settings for vertical overlap spacing when face down and face up
      // if the column is a group then we can arrange them accordingly

      const gi = this.gameState.gameInfo
      const cardsUnusedPile = cardUtils.getDecks(gi.decks)
      cardUtils.shuffle(cardsUnusedPile)
      const cc = this.gameState.tableau.length
      for (let i = 0; i < gi.tableau.count; i++) {
        const c = cardsUnusedPile[i] // should probably be pop or shift!
        console.log(c)
        // We want to clone the master card but replace the front face material

        // "Material.card_back1.001", "Material.001" is face , "Material.002" is side #BBE700
        // "CardMesh_2"
        const nc = this.masterCard.clone(true)
        nc.name = `card_${i}_${c}`
        nc.userData = { cardValue: c, shufflePos: i, name: nc.name }
        ps.add(nc)
        // the placing of a card on a column depends on the existing overlaps
        // each column can be a group!
        const row = Math.trunc(i / cc)
        const col = i % cc
        const x = this.layout.tableauStartX + (col * this.layout.horizontalSpacing)
        const y = this.layout.tableauStartY
        const yo = (row * this.layout.verticalSpacingFaceDown)
        const z = row * 0.002
        nc.position.set(x, y - yo, z)
        // turn the first card face up! just to test!
        if (i === 0) { nc.rotateX(Math.PI) }
      }

      // const box = new THREE.Box3()
      // box.setFromCenterAndSize(new THREE.Vector3(1, 1, 1), new THREE.Vector3(2, 1, 3))
      // const helper = new THREE.Box3Helper(box, 0xffff00)
      // helper.rotateZ(Math.PI / 5)
      // ps.add(helper)
      this.redraw()
    }
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
