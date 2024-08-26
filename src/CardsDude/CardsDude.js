import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry'
import cardThing from './card-attempt-01.glb'
import tableThing from './table.glb'
import { Screen } from '../Screen'

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
  // use the terminology from xmsol
  bigSpider: {
    solType: 'spider',
    rules:
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
        `
  }
}

const cardDims = `
| Type of Playing Card | Size (width x Height) | Required Bleed | Recommended Margin | Rounded Corner Size |
|----------------------|-----------------------|----------------|--------------------|---------------------|
| Standard (Poker)     | 2.5in x 3.5in         | 2mm            | 5mm                | 3.5mm               |
| Bridge (Slim)        | 2.25in x 3.5in        | 2mm            | 5mm                | 3.5mm               |
| Tarot                | 2.75in x 4.75in       | 2mm            | 5mm                | 6mm                 |
| Large                | 3.5in x 5.75in        | 2mm            | 5mm                | 6mm                 |
| MTG (Magic Gathering)| 2.5in x 3.5in         | 2mm            | 5mm                | 3.5mm               |
`
/**
 * markdown table to 2D array - a bit of fun text processing
 */
function tabToList (tab) {
  const lines = tab.split('\n').map(x => x.trim()).filter(x => x.length).map(x => x.split('|'))
  // Trim edges if appropriate to do so - check the header (the first line)...
  const regularHeader = lines.length && lines[0].length >= 2 && lines[0][0] === '' && lines[0][lines[0].length - 1] === ''
  if (regularHeader) {
    // Some fun with Array.reduce...
    // Check that all lines are the same length (i.e. same length as the first line)...
    const allSameLength = lines.reduce((acc, line) => acc && line.length === lines[0].length, true)
    console.log(`all same length: ${allSameLength}`)
    // Check that all lines have the first and last elements empty
    const allHaveEmptyFirstAndLast = lines.reduce((acc, line) => acc && line.length && line[0] === '' && line[line.length - 1] === '', true)
    console.log(`allHaveEmptyFirstAndLast: ${allHaveEmptyFirstAndLast}`)
    if (allSameLength && allHaveEmptyFirstAndLast) {
      for (const line of lines) {
        // empty front and back columns
        line.shift()
        line.pop()
        // can finally trim the field contents
        for (let fi = 0; fi < line.length; fi++) {
          line[fi] = line[fi].trim()
        }
      }
    }
    // remove the line after the header if it is all dashes...
    if (lines.length >= 2 && Array.isArray(lines[1])) {
      const ruler = lines[1].join('')
      if (ruler.match(/^[-]+$/)) { lines.splice(1, 1) }
    }
  }
  return lines
}

class CardsDude extends THREE.EventDispatcher {
  constructor (parent, game = games.bigSpider) {
    super()
    this.gui = null
    this.group = new THREE.Group()
    this.group.name = 'CardsDude'
    console.assert(parent instanceof THREE.EventDispatcher)
    console.dir(game)
    const ca = tabToList(cardDims)
    console.dir(ca)
    // make a card, get screen and add
    this.group = new THREE.Group()
    // this.group.add(new THREE.Mesh(new RoundedBoxGeometry(1, 2, 0.01, 5, 0.5), new THREE.MeshLambertMaterial()))
    const loader = new GLTFLoader()
    const progressCb = (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% loaded') }
    const errCb = (error) => { console.error('An error happened', error) }
    // Table model (belongs in parent I suppose)
    loader.load(tableThing, (data) => {
      const table = data.scene.children[0]
      table.rotateX(Math.PI / 2)
      table.translateY(-1)
      table.scale.divideScalar(1.7)
      this.group.add(table)
      this.table = table
      this.redraw()
    }, progressCb, errCb)
    // Card model
    loader.load(cardThing, (data) => {
      const card = data.scene.children[0]
      console.assert(card && card.name === 'Card')
      card.rotateX(Math.PI / 2)
      // this.group.add(card)
      this.card = card
      this.redraw()
    }, progressCb, errCb)

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
    })
  }

  testCardsDude () {
    console.log('testCardsDude')
    // clone card and deal some out
    // place tablecloth as play-space
    if (this.group.getObjectByName('mat')) {
      // TODO clean up
    } else {
      const v3 = new THREE.Vector3()
      { // make the mat
        const g = new RoundedBoxGeometry(1, 1, 0.1, 5, 0.1)
        const m = new THREE.MeshLambertMaterial({ color: 0x0a660a })
        const o = new THREE.Mesh(g, m)
        o.name = 'mat'
        this.group.add(o)
        o.position.set(-0.2, -0.84, 0.83)
        o.scale.set(1.95, 1.25, 0.5)
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
        v3.copy(o.position)
      }
      // since the scale of the mat is arbitrary and I'm too thick to sort it
      // all out, I'll set the location of the playing space...
      const g = new THREE.Group()
      g.name = 'playSpace'
      g.position.copy(v3)
      this.group.add(g)
      this.playSpace = g
      // Shrink the group to make the card size look right and move it
      // just above the surface of the mat...
      g.scale.multiplyScalar(0.3)
      g.position.z += 0.025
      // TODO proper deal - this is just a test!
      // we want to clone the master card but replace the front face materials
      const nc = this.card.clone(true)
      nc.position.set(0, 0, 0)
      g.add(nc)
      const box = new THREE.Box3()
      box.setFromCenterAndSize(new THREE.Vector3(1, 1, 1), new THREE.Vector3(2, 1, 3))
      const helper = new THREE.Box3Helper(box, 0xffff00)
      g.add(helper)
      this.redraw()
    }
  }

  activate () {
    this.group.visible = true
    this.screen.addMixer('testCardsDude', (_delta) => {
      this.card.rotation.z += 0.01
      return true
    })
    this.redraw()
  }

  deactivate () {
    // this.group.visible = false
    this.screen.removeMixer('testCardsDude')
    this.redraw()
  }
}

export { CardsDude }
