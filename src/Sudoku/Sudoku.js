import { MiniGameBase } from '../MiniGameBase.js'
import * as THREE from 'three'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Screen } from '../Screen'
import CameraControls from 'camera-controls'
import * as sudoku from 'sudoku'
import { isInteger, isString } from '../wahWah.js'
import { Text } from 'troika-three-text'
import { idxToXy, xyToIdx } from '../MoanSwooper/gridUtils.js'

/*
  https://en.wikipedia.org/wiki/Sudoku
  three js sudoku example
  import and export games
  put hints
  undo-redo branching tree
  rudimentary interactive solving help

  solving room? - just first-person view looking at a pad of paper with a pencil and eraser

  look at various sudoku libs - try to understand how they work
  https://www.npmjs.com/search?q=keywords:sudoku
  Fork the sudoku library to add a pluggable seeded random number generator
  https://github.com/dachev/sudoku
  ...based on...
  http://davidbau.com/archives/2006/09/04/sudoku_generator.html
  The digits in the puzzle are zero based!
  That's fine if we only care about generating puzzles with the library (just add one!)
  Further work to do if we want to work with the puzzle data and the other library capabilities.
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
    this.colours = {
      board: 'gainsboro',
      boardEdges: 'black',
      square: 'orange',
      squaresSelected: 0x00ff00,
      barMajor: 'purple',
      barMinor: 'green',
      numberSmall: 'blue',
      numberFixed: 'red',
    }
    this.puzzle = null
    this.squares = null
    this.squareMaterial = null
    this.squareMaterial2 = null
  }

  remakeBoard () {
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    const grp = new THREE.Group()
    grp.name = 'board'
    this.group.add(grp)
    grp.position.set(2, 2, 2)
    grp.rotateX(Math.PI / 6)

    const boardGeom = new THREE.BoxGeometry(10, 10, 0.4)
    const e = new THREE.EdgesGeometry(boardGeom)
    const m = new THREE.MeshLambertMaterial({
      color: this.colours.board,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    })
    const em = new THREE.LineBasicMaterial({ color: this.colours.boardEdges })
    const o = new THREE.Mesh(boardGeom, m)
    const objectEdges = new THREE.LineSegments(e, em)
    o.add(objectEdges)
    o.position.set(4, 4, -0.2)
    grp.add(o)
    // board parts...
    const squareGeometry = new THREE.BoxGeometry(1, 1, 0.05)
    const squareMaterial = new THREE.MeshLambertMaterial({ color: this.colours.square })
    const squareMaterial2 = squareMaterial.clone()
    squareMaterial2.color.set(this.colours.squaresSelected)
    const barGeometry = new THREE.BoxGeometry(0.06, 0.06, 9)
    const barMaterial = new THREE.MeshLambertMaterial({ color: this.colours.barMinor })
    const barMaterial2 = new THREE.MeshLambertMaterial({ color: this.colours.barMajor })
    // group for the squares and their children
    const squares = new THREE.Group()
    squares.name = 'squares'
    grp.add(squares)
    for (let y = 0; y <= 9; y++) {
      const bMat = y % 3 ? barMaterial : barMaterial2
      const vBar = new THREE.Mesh(barGeometry, bMat)
      vBar.position.set(y - 0.5, 4, y % 3 ? 0.03 : 0.04)
      vBar.rotateX(Math.PI / 2)
      grp.add(vBar)
      for (let x = 0; x <= 9; x++) {
        if (x < 9 && y < 9) {
          const square = new THREE.Mesh(squareGeometry, squareMaterial)
          const i = xyToIdx(x, y, 9)
          square.name = `square_${i}`
          square.position.set(x, 8 - y, 0.01)
          squares.add(square)
        }
        if (y === 0) {
          const bMat = x % 3 ? barMaterial : barMaterial2
          const hBar = new THREE.Mesh(barGeometry, bMat)
          hBar.position.set(4, x - 0.5, x % 3 ? 0.03 : 0.04)
          hBar.rotateY(Math.PI / 2)
          grp.add(hBar)
        }
      }
    }
    // save some objects for during game play - they get disposed of when the
    // board is cleaned up and setting them here makes sense...
    this.squareMaterial = squareMaterial
    this.squareMaterial2 = squareMaterial2
    this.squares = squares
  }

  addPuzzleText () {
    const puzzle = sudoku.makepuzzle()
    console.dir(puzzle)
    this.puzzle = puzzle
    const clr = this.colours.numberFixed
    const z = 0.07
    for (let i = 0; i < puzzle.length; i++) {
      const n = puzzle[i]
      if (n === null) { continue }
      console.assert(isInteger(n), 'sudoku number should be an integer')
      const sq = this.squares.children[i]
      console.assert(sq instanceof THREE.Mesh, 'squares should be meshes')
      this.addTextObj(sq, `${n + 1}`, 0, 0, z, clr)
    }
    // add small number markers on first non-null square
    for (let i = 0; i < puzzle.length; i++) {
      const n = puzzle[i]
      if (n === null) {
        this.addSmallDigits(i)
        break
      }
    }
  }

  addSmallDigits (idx) {
    const clr = this.colours.numberSmall
    const z = 0.07
    const sq = this.squares.children[idx]
    console.assert(sq instanceof THREE.Mesh, 'squares should be meshes')
    // sq.children.forEach((c) => {
    //   if (c instanceof Text) {
    //     c.removeFromParent()
    //   }
    // })
    for (let i = 1; i <= 9; i++) {
      // TODO delete small digit
      // add small digit
      let [px, py] = idxToXy(i - 1, 3)
      py = 2 - py // flip y
      // offset
      px -= 1
      py -= 1
      // scale
      px /= 3
      py /= 3

      const obj = this.addTextObj(sq, `${i}`, px, py, z, clr, 0.2)
      sq.add(obj)
    }
  }

  runTest () {
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

    this.remakeBoard()
    this.activate()
    this.addPuzzleText()

    // let's look at our good work...
    ;(async () => {
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

  addTextObj (grp, s, x = 0, y = 0, z = 0, c = 0x9966FF, fontSize = 0.8) {
    console.assert(isString(s))
    const obj = new Text()
    // Set properties to configure:
    obj.text = s
    obj.fontSize = fontSize
    obj.color = c
    obj.anchorX = 'center'
    obj.anchorY = 'middle'
    obj.position.set(x, y, z)
    // Update the rendering:
    obj.sync(() => { this.redraw() })
    grp.add(obj)
    return obj
  }

  // ---------------------------------------------------------------------------
  // Game mode stuff
  // ---------------------------------------------------------------------------

  enterPlayingMode (square) {
    console.log('enterPlayingMode sudoku')
    // TODO: this is likely to be incorrect unless tracked properly
    this.screen.cameraControls.enabled = false
    // highlight square...
    square.parent.children.forEach((s) => { s.material = this.squareMaterial })
    square.material = this.squareMaterial2
    // TODO: might want to highlight the row/column/box too!
    this.redraw()
    // TODO enable keyboard input for numbers 1-9, cursors, enter, backspace, delete, hint, undo, redo, etc.
  }

  escape () {
    console.log('escape sudoku')
    // TODO: this is likely to be incorrect unless tracked properly
    this.screen.cameraControls.enabled = true
    // TODO deselect any selected square
  }

  /**
   * @returns true if I accept the intersect offer
   */
  offerDoubleClick (ev, mousePos, raycaster) {
    if (!this.active || ev.button !== 0) { return false }
    const squares = this.group.getObjectByName('squares')
    const hits = raycaster.intersectObjects(squares.children, false)
    if (!hits.length) {
      return false
    }
    this.enterPlayingMode(hits[0].object)
    return true
  }
}
