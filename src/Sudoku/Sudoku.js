import { MiniGameBase } from '../MiniGameBase.js'
import * as THREE from 'three'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Screen } from '../Screen'
import CameraControls from 'camera-controls'
import * as sudoku from 'sudoku'

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

    const puzzle = sudoku.makepuzzle()
    console.dir(puzzle)

    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    // let's make a board
    const grp = this.group
    const g = new THREE.BoxGeometry(10, 10, 1, 9, 9, 1)
    const e = new THREE.EdgesGeometry(g)
    const m = new THREE.MeshLambertMaterial({
      color: 'gainsboro',
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    })
    const em = new THREE.LineBasicMaterial({ color: 'black' })
    const o = new THREE.Mesh(g, m)
    const objectEdges = new THREE.LineSegments(e, em)
    o.add(objectEdges)
    o.position.set(4, 4, -0.6)
    grp.add(o)
    // board parts...
    const squareGeometry = new THREE.BoxGeometry(1, 1, 0.05)
    const squareMaterial = new THREE.MeshLambertMaterial({ color: 'pink' })
    const barGeometry = new THREE.BoxGeometry(0.05, 0.05, 9)
    const barMaterial = new THREE.MeshLambertMaterial({ color: 'brown' })
    for (let c = 0; c <= 9; c++) {
      const vBar = new THREE.Mesh(barGeometry, barMaterial)
      vBar.position.set(c - 0.5, 4, 0.03)
      vBar.rotateX(Math.PI / 2)
      grp.add(vBar)
      for (let r = 0; r <= 9; r++) {
        if (r < 9 && c < 9) {
          const square = new THREE.Mesh(squareGeometry, squareMaterial)
          square.name = `square_${r}_${c}`
          square.position.set(c, r, 0.01)
          grp.add(square)
        }
        if (c === 0) {
          const hBar = new THREE.Mesh(barGeometry, barMaterial)
          hBar.position.set(4, r - 0.5, 0.03)
          hBar.rotateY(Math.PI / 2)
          grp.add(hBar)
        }
      }
    }

    this.activate()
  }

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
}
