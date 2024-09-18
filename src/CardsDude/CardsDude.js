import * as THREE from 'three'
import { gsap } from 'gsap'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry'
import seedrandom from 'seedrandom'
import cardThing from './card.glb'
import tableThing from './table.glb'
import { Screen } from '../Screen'
import * as cardUtils from './cardUtils'
import CameraControls from 'camera-controls'
import { isString, isObject, isInteger } from '../wahWah'
import { depthFirstReverseTraverse, generalObj3dClean } from '../threeUtil'

// take items from end of array and move to start
const rotateArray = (arr, i) => {
  arr.unshift(...arr.splice(i))
}

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

  rankValue () {
    return cardUtils.rankValues[this.rank]
  }
}

class CardStack extends Array {
  // Just an array but typed
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

  startNew (shuffleNumber = 5) {
    console.assert(isInteger(shuffleNumber))
    shuffleNumber ||= Math.floor(Math.random() * (Math.pow(2, 32) - 1))
    this.shuffleNumber = shuffleNumber
    const seedStr = 'CardsDude_' + shuffleNumber.toString().padStart(10, '0')
    const rng = seedrandom(seedStr)
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

    cardUtils.shuffle(this.stock, rng)
    this.dispatchEvent({ type: 'update', act: 'created stock' })
    // deal n cards to cols
    const n = gi.tableau.count
    this.dealFromStock(n)
    this.addHistory(`shuffled ${gi.decks} decks and dealt a new game of ${gi.name}`)
    this.dispatchEvent({ type: 'update', act: 'safety redraw' })
  }

  dealFromStock (n) {
    const cc = this.tableau.length
    for (let i = 0; i < n; i++) {
      const card = this.stock.pop()
      // TODO: row needs to be based on current content
      const col = i % cc
      this.tableau[col].push(card)
      const row = this.tableau[col].length
      this.dispatchEvent({ type: 'update', act: 'deal from stock', card, row, col })
    }
    this.flipTopCards()
  }

  useStock () {
    this.dealFromStock(this.tableau.length)
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

  tableauFind (cardId) {
    const tab = this.tableau
    for (let col = 0; col < tab.length; col++) {
      const stack = tab[col]
      const row = stack.findIndex(c => c.id === cardId)
      if (row !== -1) return [stack[row], row, col]
    }
    return [null]
  }

  /**
   * Check the sequence of card values in this stack, starting at row, differs by diff each card
   * @param {Array<Card>} stack array of Card
   * @param {Number} row start of the sequence
   * @param {Number} diff difference in rank value - default to -1 for a descending sequence
   */
  checkSequence (stack, row, diff = -1) {
    // This could probably be done as a one-liner with {Array.reduce} but I'm
    // not smart enough at this time of night!
    let v1 = stack[row].rankValue()
    console.assert(isInteger(v1))
    for (let i = row + 1; i < stack.length; i++) {
      const v2 = stack[i].rankValue()
      console.assert(isInteger(v2))
      if (v2 !== v1 + diff) return false
      v1 = v2
    }
    return true
  }

  autoMove (cardId) {
    // find the card being moved - must be face-up in the tableau...
    const [card, row, col] = this.tableauFind(cardId)
    console.assert(card && card?.faceUp)
    if (!card || !card.faceUp) return
    // can this stack even be moved?
    // look if this stack is valid starting at row
    if (!this.checkSequence(this.tableau[col], row)) {
      console.log('autoMove: this sequence cannot be moved')
      this.dispatchEvent({ type: 'update', act: 'autoMove failed', card, row, col })
      return
    }
    // now search for somewhere to place it
    console.log(`autoMove ${cardId} is ${card.rank}${card.suit} at col ${col} row ${row}...`)
    const rv = card.rankValue()
    // OK, make a list of columns to check...
    const cols = [...Array(this.tableau.length).keys()]
    // starting after the given column and wrapping around...
    rotateArray(cols, col + 1)
    // find if there's a target to receive our stack...
    const isValidTargetForVal = (i, rv) => {
      const tc = this.tableau[i].slice(-1)[0]
      return (tc?.rankValue() === rv + 1)
    }
    const targetCols = cols.filter(i => isValidTargetForVal(i, rv))
    const betterTargetCols = targetCols.filter(i => {
      const tc = this.tableau[i].slice(-1)[0]
      return (tc?.suit === card.suit)
    })
    const emptyCols = cols.filter(i => (this.tableau[i].length === 0))
    console.log('target cols', targetCols)
    console.log('better target cols', betterTargetCols)
    console.log('emptyCols cols', emptyCols)
    const best = betterTargetCols.length ? betterTargetCols[0] : targetCols.length ? targetCols[0] : emptyCols.length ? emptyCols[0] : null
    if (best === null) {
      return
    }
    const subStack = this.tableau[col].splice(row)
    this.tableau[best].push(...subStack)
    this.dispatchEvent({ type: 'update', act: 'move stack', card, row, col, targetCol: best })
    this.flipTopCards()
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
      verticalSpacingFaceDown: 0.08,
      horizontalSpacing: 0.64,
      tableauStartX: -3.9,
      tableauStartY: 1.75,
      stockPileX: -5.1,
      stockPileY: 2.2,
      stockPileZ: -0.15,
      antiFightZ: 0.002,
      faceUpFudgeZ: 0.015, // TODO: measure this properly
    }
    this.timeLine = gsap.timeline({ autoRemoveChildren: true, onComplete: this.onEndTimeLine.bind(this) })
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
      // TODO auto-start - can't do this at present because models are not yet created!
      // this.testCardsDude()
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
    {
      // card face images - only need one set...
      const cm = {}
      const ca = cardUtils.getDecks(1)
      for (let i = 0; i < ca.length; i++) {
        const v = ca[i]
        const canvas = this.canvasDrawCardFace(v)
        cm[v] = canvas
      }
      this.faceCanvases = cm
    }
  }

  canvasDrawCardFace (card) {
    const defaultCardShape = {
      width: 0.62,
      length: 0.88,
      thickness: 0.01,
    }
    const a = card.split('')
    const suit = a.pop()
    const rank = a.join('')
    const clr = cardUtils.suitColours[suit]
    const p = defaultCardShape
    const canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = canvas.width / p.width * p.length
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'LightYellow'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = '75px serif'
    ctx.fillStyle = clr
    ctx.textBaseline = 'top'
    ctx.textAlign = 'center'
    ctx.fillText(rank, 40, 30)
    ctx.fillText(suit, 40, 100)
    ctx.strokeStyle = 'gray'
    ctx.lineWidth = 4
    ctx.roundRect(0, 0, canvas.width, canvas.height, 27)
    ctx.stroke()

    return canvas
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

  onEndTimeLine () {
    console.log('onEndTimeLine')
    this.redraw?.()
  }

  /**
   * @returns true if I stole the intersect
   */
  stealIntersectForGame (ev, mousePos, raycaster) {
    if (!this.active) { return false }
    // only for left or right click...
    if (ev.button !== 0 && ev.button !== 2) { return false }
    // TODO if I hit something and use it then stop the event from getting to the camera-controls!
    const clickable = [] // active cards: top card of stock or face up on tableau and not blocked!
    const addStackTopCardObj = (stack, list) => {
      if (!stack.length) { return }
      const c = stack[stack.length - 1]
      const obj = this.playSpace.getObjectByName(this.cardObjName(c))
      if (obj) { list.push(obj) }
    }
    addStackTopCardObj(this.gameState.stock, clickable)
    const addStackAllFaceUpCardObj = (stack, list) => {
      for (const c of stack) {
        if (!c.faceUp) continue
        const obj = this.playSpace.getObjectByName(this.cardObjName(c))
        if (obj) { list.push(obj) }
      }
    }
    for (const stack of this.gameState.tableau) {
      addStackAllFaceUpCardObj(stack, clickable)
    }
    // TODO use a tiny radius!
    const hits = raycaster.intersectObjects(clickable)
    if (hits.length) {
      // TODO if I hit something and use it then stop the event from getting to the camera-controls!
      console.log('hit cards ' + hits.length)
      const m = hits[0].object
      if (m.isMesh && m.name === 'CardFront') {
        // hit the face of a card - should be the usual case
        console.log('card face of ' + m.parent.name)
        const o = clickable.find(x => x === m.parent)
        console.assert(o)
        if (ev.button === 2) {
          // right clicked - auto move if valid target exists
          this.gameState.autoMove(this.cardObjNameToId(m.parent.name))
        } else if (ev.button === 0) {
          // Start to drag sub stack...
          // Don't worry about validity of the drag until drop happens!
          // This allows the user to freely move cards temporarily to look at obscured cards
          const savedCameraControlsEnabled = this.screen.cameraControls.enabled
          this.screen.cameraControls.enabled = false
          const canvas = this.screen.renderer.domElement
          console.assert(ev.currentTarget === canvas)
          const dragStartPos2D = mousePos.clone()
          const dragEndPos2D = mousePos.clone()
          // TODO use a temporary group object?
          // get valid targets for this card? Nah, just see what happens!
          raycaster.setFromCamera(mousePos, this.screen.camera)
          const tempDragGroup = new THREE.Group()
          tempDragGroup.name = 'tempDragGroup'
          // this.playSpace.add(tempDragGroup)

          const mouseMoveListener = (ev) => {
            const rect = ev.target.getBoundingClientRect()
            dragEndPos2D.x = (ev.clientX - rect.left) / rect.width * 2 - 1
            dragEndPos2D.y = -(ev.clientY - rect.top) / rect.height * 2 + 1
            // TODO move dragging group to plane intersection just above playing group
          }
          const dropListener = (ev) => {
            // TODO should we update the mouse position here?
            // Is it guaranteed to have been done prior to this call?
            // We can test it!
            {
              const rect = ev.target.getBoundingClientRect()
              const x = (ev.clientX - rect.left) / rect.width * 2 - 1
              const y = -(ev.clientY - rect.top) / rect.height * 2 + 1
              if (x !== dragEndPos2D.x || y !== dragEndPos2D.y) {
                console.warn('yeah we need to update the mover on drop')
              }
            }
            console.log('drop', dragEndPos2D)
            this.screen.cameraControls.enabled = savedCameraControlsEnabled
            canvas.removeEventListener('mousemove', mouseMoveListener, false)
            canvas.removeEventListener('mouseup', dropListener, false)
            canvas.removeEventListener('mousedown', dropListener, false)
            // TODO: assess the drop location!
            // ray-cast to a potential target pile
            // if it is a tableau location (including the base of an empty tableau!)
            // then see if it is valid
          }
          canvas.addEventListener('mousemove', mouseMoveListener, false)
          canvas.addEventListener('mouseup', dropListener, false)
          canvas.addEventListener('mousedown', dropListener, false)
        }
      } else if (m.isMesh && m.name === 'CardBack') {
        // hit the back of a card - this should be the stock
        console.log('card back of ' + m.parent.name)
        if (m.parent === clickable[0]) {
          console.log('- stock clicked!')
          setTimeout(() => { this.gameState.useStock() }, 1)
        } else {
          console.log('- not the stock! No drag allowed')
        }
      }

      return true
    }
    return false
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
    } else if (ev.act === 'deal from stock') {
      // console.log(ev.card, ev.row, ev.col)
      const obj = this.playSpace.getObjectByName(this.cardObjName(ev.card))
      const x = this.layout.tableauStartX + (ev.col * this.layout.horizontalSpacing)
      const y = this.layout.tableauStartY - (ev.row * this.layout.verticalSpacingFaceDown)
      const z = ev.row * this.layout.antiFightZ
      // this.timeLine.to(obj.position, { x, y, z, duration: 0.05 })
      obj.position.set(x, y, z)
    } else if (ev.act === 'flip top card') {
      // console.log(`${ev.type} ${ev.act}`, ev.card)
      console.assert(ev.card instanceof Card)
      const obj = this.playSpace.getObjectByName(this.cardObjName(ev.card))
      console.assert(obj instanceof THREE.Object3D)
      // this position needs to be absolute based on row and what's face up
      // const stack = this.gameState.tableau[ev.row]
      const z = (ev.row * this.layout.antiFightZ) + this.layout.faceUpFudgeZ
      this.timeLine.set(obj.position, { z })
      const x = obj.rotation.x + Math.PI
      this.timeLine.to(obj.rotation, { x, duration: 0.1 })
    } else if (ev.act === 'move stack') {
      // this.dispatchEvent({ type: 'update', act: 'move stack', card, row, col, targetCol: best })
      // Because the cards have already been moved in the gameState we can find
      // them in the target column...
      const stack = this.gameState.tableau[ev.targetCol]
      const start = stack.findIndex(x => x === ev.card)
      console.assert(start > -1)
      const x = this.layout.tableauStartX + (ev.targetCol * this.layout.horizontalSpacing)
      let y = this.layout.tableauStartY
      // set y from stack contents
      for (let i = 1; i < start; i++) {
        y -= stack[i].faceUp ? this.layout.verticalSpacingFaceUp : this.layout.verticalSpacingFaceDown
      }
      for (let i = start; i < stack.length; i++) {
        const c = stack[i]
        const obj = this.playSpace.getObjectByName(this.cardObjName(c))
        console.assert(obj)
        const z = (i * this.layout.antiFightZ) + this.layout.faceUpFudgeZ
        this.timeLine.set(obj.position, { x, y, z })
        y -= stack[i].faceUp ? this.layout.verticalSpacingFaceUp : this.layout.verticalSpacingFaceDown
      }
    } else if (ev.act === 'safety redraw') {
      // TODO - does this work?
      // this.timeLine.set().onComplete(() => { this.redraw() })
    } else {
      console.warn(`unhandled action '${ev.act}'`)
    }
    this.redraw()
  }

  create3dCard (card, g) {
    const nc = this.masterCard.clone(true)
    const texture = new THREE.CanvasTexture(this.faceCanvases[card.rank + card.suit])
    const frontMaterial = new THREE.MeshPhongMaterial({ map: texture })
    nc.children[1].material = frontMaterial
    nc.userData = { card }
    nc.name = this.cardObjName(card)
    g.add(nc)
  }

  cardObjName (card) {
    return `card_${card.id}`
  }

  cardObjNameToId (name) {
    if (!name.startsWith('card_')) return Number.NaN
    return Number(name.slice(5))
  }

  testCardsDude () {
    console.log('testCardsDude')
    this.activate()
    this.gameState.startNew()
    this.lookAtCardTable()
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
