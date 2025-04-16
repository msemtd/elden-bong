import { MiniGameBase } from '../MiniGameBase.js'
import * as THREE from 'three'
import { generalObj3dClean } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Screen } from '../Screen'
import CameraControls from 'camera-controls'

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
