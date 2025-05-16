import { MiniGameBase } from '../MiniGameBase.js'
import * as THREE from 'three'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import * as sudoku from './imported'
import { isInteger, isString } from '../wahWah.js'
import { Text } from 'troika-three-text'
import { idxToXy, xyToIdx } from '../MoanSwooper/gridUtils.js'
import { Colours } from '../Colours.js'

/*
  https://en.wikipedia.org/wiki/Sudoku
  three js sudoku example
  import and export games
  put hints
  undo-redo branching tree
  rudimentary interactive solving help
  Use the right terminology: https://en.wikipedia.org/wiki/Glossary_of_Sudoku
  - try to use "cell" rather than "square"!
  - row, column, box
  - "single"
  - hint or small number is a "pencil mark"
  - using techniques from Cracking The Cryptic https://www.youtube.com/watch?v=9aPWpWEQg9Q
  solving room? - just first-person view looking at a pad of paper with a pencil and eraser

  look at various sudoku libs - try to understand how they work
  https://www.npmjs.com/search?q=keywords:sudoku

  TODO: Fork the sudoku library to add a pluggable seeded random number generator
  https://github.com/dachev/sudoku
  ...based on...
  http://davidbau.com/archives/2006/09/04/sudoku_generator.html
  The digits in the puzzle are zero based!
  That's fine if we only care about generating puzzles with the library (just add one!)
  Further work to do if we want to work with the puzzle data and the other library capabilities.

  TODO:
  - F key for full set of initial hints
    - same as A key on all empty squares then R key
  - R key to remove solved row/column/square values from the hints
  - Detect complete solved puzzle
  - Highlight mistakes
  - Promote single small hints to a big number on display
    - if hint count in square is one then promote
    - if hint count > 1 then demote
*/

const keysNumeric = '0123456789'.split('')
const keysArrow = {
  ArrowUp: -9,
  ArrowDown: 9,
  ArrowLeft: -1,
  ArrowRight: 1,
}

export class Sudoku extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Sudoku')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      // this.gui.open()
      // setTimeout(() => {
      //   this.runTest()
      // }, 600)
    })
    const colours = new Colours()

    this.colours = {
      board: colours.gimme('gainsboro'),
      boardEdges: colours.gimme('dark navy'),
      square: colours.gimme('light pastel green'),
      squaresSelected: colours.gimme('pumpkin orange'),
      barMajor: colours.gimme('aubergine'),
      barMinor: colours.gimme('dusty teal'),
      numberSmall: colours.gimme('butter yellow'),
      numberFixed: colours.gimme('blue with a hint of purple'),
    }
    this.puzzle = null
    this.squares = null
    this.squareMaterial = null
    this.squareMaterial2 = null
    this.fontSizeSmall = 0.2
    this.fontSizeBig = 0.8
    this.digitZ = 0.07
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
          square.userData.sqIdx = i
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

  setPuzzle (puzzle) {
    this.puzzle = puzzle
    for (let i = 0; i < puzzle.length; i++) {
      const n = puzzle[i]
      if (n === null) { continue }
      console.assert(isInteger(n), 'sudoku number should be an integer')
      const sq = this.squares.children[i]
      console.assert(sq instanceof THREE.Mesh, 'squares should be meshes')
      this.addTextObj(sq, `${n + 1}`, 0, 0, this.digitZ, this.colours.numberFixed, this.fontSizeBig)
    }
  }

  removeAllSmallDigits (sq) {
    console.assert(sq instanceof THREE.Mesh, 'squares should be meshes')
    // clear the square - not necessary to recover textures because they're shared
    // TODO should do geometries I guess but the text object caches them
    sq.clear()
    this.redraw()
    return true
  }

  addAllSmallDigits (sq) {
    console.assert(sq instanceof THREE.Mesh, 'squares should be meshes')
    for (let n = 1; n <= 9; n++) {
      // get small digit position relative to centre of parent square
      this.addSmallDigit(n, sq)
    }
  }

  smallDigitPos (n) {
    let [px, py] = idxToXy(n - 1, 3)
    py = 2 - py // flip y
    // offset
    px -= 1
    py -= 1
    // scale
    px /= 3
    py /= 3
    return [px, py]
  }

  addSmallDigit (n, sq) {
    const [px, py] = this.smallDigitPos(n)
    const obj = this.addTextObj(sq, `${n}`, px, py, this.digitZ, this.colours.numberSmall, this.fontSizeSmall)
    obj.userData.hint = n
    obj.userData.small = true
    sq.add(obj)
  }

  runTest () {
    // let's have a simple text representation of a sudoku puzzle
    // 0 or dash for empty squares, 1-9 for fixed numbers
    // whitespace is ignored
    // there must be 81 positions in total
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

    this.remakeBoard()
    this.activate()

    // const puzzle = this.parseBoard2(brd, true)
    const puzzle = sudoku.makePuzzle()
    this.setPuzzle(puzzle)

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

  // simpler format for parsing - no whitespace, no rows, just 81 digits
  // 0 or dash for empty squares, 1-9 for fixed numbers
  // We have the option to output a second puzzle style where values are zero to 8 and null for empty squares
  parseBoard2 (brd, puzzleStyle2 = false) {
    const rows = brd.split('\n').map(x => x.trim()).filter(x => x.length)
    const puzzle = rows.join('').split('').filter((c) => c !== ' ')
    if (puzzle.length !== 81) {
      throw Error('Sudoku board should have 81 squares')
    }
    for (let i = 0; i < puzzle.length; i++) {
      if (puzzle[i] === '-') {
        puzzle[i] = '0'
      }
      const parsed = Number.parseInt(puzzle[i], 10)
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 9) {
        throw Error('Sudoku values must be decimal digits: error at index ' + i)
      }
      puzzle[i] = parsed
    }
    if (!puzzleStyle2) {
      return puzzle
    }
    const puzzle2 = puzzle.map((x) => x === 0 ? null : x - 1)
    return puzzle2
  }

  addTextObj (grp, s, x = 0, y = 0, z = 0, c = 0x9966FF, fontSize = this.fontSizeBig) {
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
    this.playingMode = square
    // TODO: this is likely to be incorrect unless tracked properly
    this.screen.cameraControls.enabled = false
    // highlight square...
    square.parent.children.forEach((s) => { s.material = this.squareMaterial })
    square.material = this.squareMaterial2
    // TODO: might want to highlight the row/column/box too!
    this.redraw()
    // TODO enable keyboard input for numbers 1-9, cursors, enter, backspace, delete, hint, undo, redo, etc.
  }

  exitPlayingMode () {
    // TODO: this is likely to be incorrect unless tracked properly
    this.screen.cameraControls.enabled = true
    // deselect any selected square
    this.squares.children.forEach((s) => { s.material = this.squareMaterial })
    this.redraw()
    this.playingMode = false
  }

  onKeyDown (ev) {
    if (!this.active || !this.playingMode) {
      return false
    }
    console.log('sudoku ev.key: <' + ev.key + '>')
    if (ev.key === 'Escape') {
      this.exitPlayingMode()
      return true
    }
    if (ev.key in keysArrow) {
      const sq = this.playingMode
      console.assert(sq instanceof THREE.Mesh, 'squares should be meshes')
      // get adjacent square
      console.assert(typeof sq.userData.sqIdx === 'number', 'squares should have sqIdx userData number')
      const idx = (sq.userData.sqIdx + keysArrow[ev.key] + 81) % 81
      const sqNew = this.squares.children[idx]
      sq.material = this.squareMaterial
      sqNew.material = this.squareMaterial2
      this.playingMode = sqNew
      this.redraw()
      return true
    }
    if (keysNumeric.includes(ev.key)) {
      return this.onNumericKey(keysNumeric.indexOf(ev.key))
    }
    if (ev.key === 'a' || ev.key === 'A') {
      // add all small digits to the current square
      const sq = this.playingMode
      console.assert(sq instanceof THREE.Mesh, 'squares should be meshes')
      console.assert(typeof sq.userData.sqIdx === 'number', 'squares should have sqIdx userData number')
      this.removeAllSmallDigits(sq)
      this.addAllSmallDigits(sq)
      this.redraw()
      return true
    }
    if (ev.key === 'b' || ev.key === 'B') {
      // Big!
      const sq = this.playingMode
      this.promoteOrDemoteHint(sq)
      this.redraw()
      return true
    }

    // unhandled key
    return false
  }

  onNumericKey (val) {
    console.log('onNumericKey ' + val)
    // unless a fixed number in the puzzle, toggle the small digit
    // when only one digit is present, make it big
    // we will do the checks later
    const sq = this.playingMode
    console.assert(typeof sq.userData.sqIdx === 'number', 'squares should have sqIdx userData number')
    const idx = sq.userData.sqIdx
    if (this.puzzle[idx] !== null) {
      console.warn('Cannot change fixed number')
      return true
    }
    // how do we manage the small digits and guesses?
    // we could do everything in userData but that is no good for non-3D gameplay
    // the squares should be components that represent game state
    // we could derive game state from userData initially and decide how to make changes to represent it

    if (val === 0) {
      return this.removeAllSmallDigits(sq)
    }
    const objDig = sq.children.filter((c) => c instanceof Text && c.userData.hint === val)
    console.dir(objDig)
    if (objDig.length) {
      // remove the small digit
      const obj = objDig[0]
      depthFirstReverseTraverse(sq, obj, generalObj3dClean)
    } else {
      // add the small digit
      this.addSmallDigit(val, sq)
    }
    this.redraw()
    return true
  }

  promoteOrDemoteHint (sq) {
    const a = sq.children.filter((c) => c instanceof Text)
    const goBig = (a.length === 1)
    for (let i = 0; i < a.length; i++) {
      const t = a[i]
      t.fontSize = goBig ? this.fontSizeBig : this.fontSizeSmall
      const [px, py] = goBig ? [0, 0] : this.smallDigitPos(t.userData.hint)
      t.position.set(px, py, this.digitZ)
      t.userData.small = !goBig
    }
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
