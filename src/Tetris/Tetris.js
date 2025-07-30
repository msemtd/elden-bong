import { MiniGameBase } from '../MiniGameBase'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js'
import { Screen } from '../Screen'
import CameraControls from 'camera-controls'
import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { Colours } from '../Colours'
import floorDiffuse from './FloorsCheckerboard_S_Diffuse.jpg'
import floorNormal from './FloorsCheckerboard_S_Normal.jpg'

const data = {
  tetrominoes: {
    I: `
  #X##
  `,
    O: `
  ##
  X#
  `,
    T: `
  .#.
  #X#
  `,
    J: `
  #..
  #X#
  `,
    L: `
  ..#
  #X#
  `,
    S: `
  .##
  #X.
  `,
    Z: `
  ##.
  .X#
  `,
  },
  colours: {
    I: 'cyan',
    O: 'yellow',
    T: 'magenta',
    J: 'blue',
    L: 'orange',
    S: 'green',
    Z: 'red',
  },
  fw: 10,
  fh: 22,
}

// Tetris rotations using the "Super Rotation System."
// https://harddrop.com/wiki/SRS

// cSpell:ignore Tetris tetrominoes
export class Tetris extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Tetris')
    this.pieces = this.makePieces()
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
    })
  }

  makePieces () {
    const pieces = {}
    let pp = 0
    const bg = new RoundedBoxGeometry(1, 1, 1, 1)
    const pivotMaterial = new THREE.MeshLambertMaterial({ color: Colours.get('pumpkin orange') })
    const pivotGeometry = new THREE.BoxGeometry(0.2, 0.2, 2)
    for (const [k, bm] of Object.entries(data.tetrominoes)) {
      const piece = new THREE.Group()
      piece.name = k
      const rows = bm.split('\n').map(x => x.trim()).filter(x => x.length).reverse()
      const c = data.colours[k]
      const m = new THREE.MeshLambertMaterial({ color: c, wireframe: false })
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const cols = row.split('')
        for (let j = 0; j < cols.length; j++) {
          const pix = cols[j]
          if (pix === '.') continue
          const tile = new THREE.Mesh(bg, m)
          tile.position.set(j, i, 0)
          if (pix === 'X') {
            const piv = new THREE.Mesh(pivotGeometry, pivotMaterial)
            piv.position.set(j, i, 0)
            piece.add(piv)
          }
          piece.add(tile)
        }
      }
      piece.position.setX(pp * 1.2)
      pieces[k] = piece
      pp++
    }
  }

  runTest () {
    // what to do here? Draw a playing field?
    // define the blocks - get the colours right!
    // define the game
    // the controls
    // all dat stuff!
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    const grp = new THREE.Group()
    grp.name = 'grp'
    this.group.add(grp)

    this.activate()
    this.makeBackground(grp)
    this.makeButtons(grp)
    this.redraw()
    this.positionCamera()
  }

  async positionCamera () {
    this.redraw()
    await this.screen.cameraControls.fitToSphere(this.group, true)
    await this.screen.cameraControls.rotateAzimuthTo(0, true)
    await this.screen.cameraControls.rotatePolarTo(Math.PI / 10, true)
  }

  makeBackground (grp) {
    const [w, h] = [data.fw, data.fh]
    const loader = new THREE.TextureLoader()
    const t1 = loader.load(floorDiffuse, this.redraw)
    const t2 = loader.load(floorNormal, this.redraw)
    t1.wrapS = t2.wrapS = t1.wrapT = t2.wrapT = THREE.RepeatWrapping
    t1.repeat = t2.repeat = new THREE.Vector2(w, h).divideScalar(6)
    const g = new THREE.BoxGeometry(w, h, 1, w, h, 1)
    const m = new THREE.MeshPhongMaterial({ color: 'white', map: t1, normalMap: t2 })
    const o = new THREE.Mesh(g, m)
    o.name = 'background'
    o.position.set(0, 0, -1)
    grp.add(o)
  }

  makeButtons (grp) {
    const g = new THREE.BoxGeometry(3, 2, 1, 3, 2, 1)
    const m = new THREE.MeshPhongMaterial({ color: 'green' })
    const o = new THREE.Mesh(g, m)
    o.position.set(-7, 1, -0.75)
    grp.add(o)
    const t = new Text()
    t.text = 'Start'
    t.anchorX = 'center'
    t.anchorY = 'middle'
    t.fontSize = 1
    t.position.set(0, 0, 0.505)
    t.sync(() => { this.redraw() })
    o.add(t)
  }
}
