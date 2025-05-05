import { MiniGameBase } from '../MiniGameBase.js'
import * as THREE from 'three'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Screen } from '../Screen'
import CameraControls from 'camera-controls'
import * as sudoku from 'sudoku'
import { isString } from '../wahWah.js'
import { Text } from 'troika-three-text'
import { idxToXy } from '../MoanSwooper/gridUtils.js'

/*
  https://en.wikipedia.org/wiki/Sudoku
  three js sudoku example
  import and export games
  put hints
  undo-redo branching tree
  rudimentary interactive solving help

  solving room? - just first-person view looking at a pad of paper with a pencil and eraser

*/

export class Sudoku extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Sudoku')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.open()
      setTimeout(() => {
        this.runTest()
      }, 600)
    })
  }

  runTest () {
    // TODO: learn as much as possible from...
    // http://davidbau.com/archives/2006/09/04/sudoku_generator.html
    const brd = `
    9-- --- 687
    72- 58- ---
    --- --- ---
    --- --- 89-
    67- -5- -13
    -58 --- ---
    --- --- ---
    --- -97 -62
    387 --- --4
    `
    const dat = this.parseBoard(brd)
    console.dir(dat)

    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.activate()
    // let's make a board
    const grp = new THREE.Group()
    grp.name = 'board'
    this.group.add(grp)
    grp.position.set(2, 2, 2)
    grp.rotateX(Math.PI / 6)

    const boardGeom = new THREE.BoxGeometry(10, 10, 0.4)
    const e = new THREE.EdgesGeometry(boardGeom)
    const m = new THREE.MeshLambertMaterial({
      color: 'gainsboro',
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    })
    const em = new THREE.LineBasicMaterial({ color: 'black' })
    const o = new THREE.Mesh(boardGeom, m)
    const objectEdges = new THREE.LineSegments(e, em)
    o.add(objectEdges)
    o.position.set(4, 4, -0.2)
    grp.add(o)
    // board parts...
    const squareGeometry = new THREE.BoxGeometry(1, 1, 0.05)
    const squareMaterial = new THREE.MeshLambertMaterial({ color: 'pink' })
    const barGeometry = new THREE.BoxGeometry(0.06, 0.06, 9)
    const barMaterial = new THREE.MeshLambertMaterial({ color: 'brown' })
    const barMaterial2 = new THREE.MeshLambertMaterial({ color: 'yellow' })
    // group for the squares and their children
    const squares = new THREE.Group()
    squares.name = 'squares'
    grp.add(squares)
    for (let c = 0; c <= 9; c++) {
      const bMat = c % 3 ? barMaterial : barMaterial2
      const vBar = new THREE.Mesh(barGeometry, bMat)
      vBar.position.set(c - 0.5, 4, c % 3 ? 0.03 : 0.04)
      vBar.rotateX(Math.PI / 2)
      grp.add(vBar)
      for (let r = 0; r <= 9; r++) {
        if (r < 9 && c < 9) {
          const square = new THREE.Mesh(squareGeometry, squareMaterial)
          square.name = `square_${r}_${c}`
          square.position.set(c, 8 - r, 0.01)
          squares.add(square)
        }
        if (c === 0) {
          const bMat = r % 3 ? barMaterial : barMaterial2
          const hBar = new THREE.Mesh(barGeometry, bMat)
          hBar.position.set(4, r - 0.5, r % 3 ? 0.03 : 0.04)
          hBar.rotateY(Math.PI / 2)
          grp.add(hBar)
        }
      }
    }

    // add puzzle text items
    {
      const puzzle = sudoku.makepuzzle()
      console.dir(puzzle)
      const grp = this.group.getObjectByName('board')
      const clrFixed = 0xff2222
      const z = 0.07
      for (let i = 0; i < puzzle.length; i++) {
        const n = puzzle[i]
        if (n === null) { continue }
        const [x, y] = idxToXy(i, 9)
        // flip Y for coordinates
        const obj = this.addTextObj(grp, `${n}`, x, (8 - y), z, clrFixed)
        obj.name = 'test text' // numObjName(x, y)
        obj.userData = { n }
      }
    }

    // let's look at our good work...
    (async () => {
      this.redraw()
      const o = this.group.getObjectByName('board')
      await this.screen.cameraControls.fitToSphere(o, true)
      await this.screen.cameraControls.rotatePolarTo(Math.PI / 4, true)
      // await this.screen.cameraControls.dollyTo(0.5, true)
      // await this.screen.cameraControls.rotateAzimuthTo(Math.PI / 4 * 3, true)
    })()
  }

  // This format is quite strict!
  // We could just paste all rows together, dropping whitespace, and asser that
  // there are 81 valid chars
  parseBoard (brd) {
    const rows = brd.split('\n').map(x => x.trim()).filter(x => x.length)
    console.assert(rows.length === 9, 'Sudoku board should have 9 rows')
    const board = []
    for (let i = 0; i < 9; i++) {
      const row = rows[i].trim().split(' ').join('').split('').map((c) => {
        if (c === '-') return 0
        return parseInt(c, 10)
      })
      board.push(row)
      console.assert(row.length === 9, 'Sudoku row should have 9 columns')
    }
    console.log(board)
    return board
  }

  addTextObj (grp, s, x = 0, y = 0, z = 0, c = 0x9966FF) {
    console.assert(isString(s))
    const obj = new Text()
    grp.add(obj)
    // Set properties to configure:
    obj.text = s
    obj.fontSize = 0.8
    obj.position.set(x, y, z)
    obj.color = c
    obj.anchorX = 'center'
    obj.anchorY = 'middle'
    // Update the rendering:
    obj.sync(() => { this.redraw() })
    return obj
  }

  /**
   * @returns true if I stole the intersect
   */
  stealIntersectForGame (ev, mousePos, raycaster) {
    if (!this.active) { return false }
    // only for left or right click...
    if (ev.button !== 0 && ev.button !== 2) { return false }
    // TODO: if I hit something and use it then stop the event from getting to the camera-controls!
    const clickable = []
    // make squares clickable to enter playing mode

    // TODO: add a capture mouse mode
    // upon click on face of board,
    // go into sudoku game playing mode,
    // disabling mouse (and keys) input for camera controls
    // until escape is hit,
    // put a notice on the screen telling user we are in this mode
    // probably need a cursor
    // probably need user instructions on screen too

    return false
  }

  offerDoubleClick (ev, mousePos, raycaster) {
    if (!this.active) { return false }
    if (ev.button !== 0) { return false }
    const squares = this.group.getObjectByName('squares')
    const hits = raycaster.intersectObject(squares)
    if (hits.length) {
      console.dir(hits)
      const h = hits[0]
      console.dir(h)
      if (h.object?.name) {
        console.log(h.object?.name)
        // Dlg.popup(h.object.name)
      }
    }

    return false
  }
}
