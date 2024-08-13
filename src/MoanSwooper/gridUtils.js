import { fyShuffle } from './fyShuffle'
import { modes } from './MoanSwooper'

// Grids held in 1D arrays for a moan swooper type game
// Get values with indices or x, y
// NB: x is column, y is row
// NB: when represented as a string in 2D, Y increases downwards

export function makeGrid (mode = modes.easy) {
  // choose a distribution based on a seed
  // return a 2D grid (array of arrays?) 1D array?
  // ArrayBuffer? Nah!
  const len = mode.xSize * mode.ySize
  const a = Array(len).fill('.')
  const b = Array(mode.bombs).fill('@')
  const m = b.concat(a)
  m.length = len
  fyShuffle(m)
  return m
}

export function setGridNumbers (grid, mode) {
  for (let y = 0; y < mode.ySize; y++) {
    for (let x = 0; x < mode.xSize; x++) {
      const gi = xyToIdx(x, y, mode.xSize)
      const tile = grid[gi]
      if (tile === '@') continue
      // not a bomb - look at neighbours
      const na = getAdj(x, y, mode.xSize, mode.ySize)
      let count = 0
      for (const pr of na) {
        const ix = xyToIdx(pr[0], pr[1], mode.xSize)
        if (grid[ix] === '@') {
          count++
        }
      }
      grid[gi] = `${count || '.'}`
    }
  }
}

export function xyToIdx (x, y, xSize) {
  console.assert(Number.isInteger(x))
  console.assert(Number.isInteger(y))
  console.assert(Number.isInteger(xSize))
  console.assert(x >= 0)
  console.assert(y >= 0)
  console.assert(xSize > 0)
  console.assert(x < xSize)
  return y * xSize + x
}

export function idxToXy (idx, xSize) {
  console.assert(Number.isInteger(idx))
  console.assert(Number.isInteger(xSize))
  console.assert(idx >= 0)
  console.assert(xSize > 0)
  return [idx % xSize, Math.floor(idx / xSize)]
}

export function gridToString (ga, mode) {
  console.assert(Array.isArray(ga))
  console.assert(typeof mode === 'object')
  console.assert(Number.isInteger(mode.xSize))
  console.assert(Number.isInteger(mode.ySize))
  console.assert(ga.length === mode.xSize * mode.ySize)
  let s = ''
  for (let y = 0; y < mode.ySize; y++) {
    for (let x = 0; x < mode.xSize; x++) {
      const tile = ga[xyToIdx(x, y, mode.xSize)]
      s += tile
    }
    s += '\n'
  }
  return s
}

export function gridFromString (s, mode) {
  const lines = s.split('\n').map(x => x.trim()).filter(x => x.length)
  if (lines.length !== mode.ySize) {
    throw Error('bad lines count')
  }
  let g = ''
  for (const line of lines) {
    if (line.length !== mode.xSize) {
      throw Error('bad line length')
    }
    g += line
  }
  return g.split('')
}

export function getAdj (x, y, xSize, ySize) {
  const adj = []
  for (let row = y - 1; row <= y + 1; row++) {
    if (row < 0 || row >= ySize) continue
    for (let col = x - 1; col <= x + 1; col++) {
      if (col < 0 || col >= xSize) continue
      if (row === y && col === x) continue
      adj.push([col, row])
    }
  }
  return adj
}
