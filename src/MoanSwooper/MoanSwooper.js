import * as THREE from 'three'

/**
 * Grid of tiles in 2D space
 * variable size
 * click a tile with right or left
 *
 * How does an implementation of minesweeper decide how to distribute the bombs for each difficulty level?
 * Easy, medium, hard sizes.
 * Can I find some code somewhere?
 * Should I clean-room it?
 * That's a nice idea - could be fun!
 * Only what I can deduce!
 * I know how to play it so...
 *
 * implementation in JS
 * grid with content
 * distribution of bombs based on a seed - simple first
 * game loop mechanics
 * timer - easy enough
 * bomb counter
 * game end conditions - win or lose
 * debug mode
 * hooking into Elden Bong
 *
 */

const modes = {
  easy: {
    xSize: 10,
    ySize: 8,
    bombs: 10,
  },
  medium: {
    xSize: 18,
    ySize: 14,
    bombs: 40,
  },
  hard: {
    xSize: 24,
    ySize: 20,
    bombs: 99,
  },
}

function fyShuffle (a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const k = a[i]
    a[i] = a[j]
    a[j] = k
  }
}

function makeGrid (mode = modes.easy) {
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

function xyToIdx (x, y, xSize) {
  return y * xSize + x
}

function idxToXy (idx, xSize) {
  return [idx % xSize, Math.floor(idx / xSize)]
}

function gridToString (ga, mode) {
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

function getAdj (x, y, xSize, ySize) {
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

class MoanSwooper {
  constructor () {
    this.mode = modes.easy
    this.grid = makeGrid(this.mode)
    this.active = true
  }

  runTest () {
    console.log('Helloooooooooooo')
    this.grid = makeGrid(this.mode)
    const s = gridToString(this.grid, this.mode)
    console.log(s)
    // this.guiProvider.drawGrid(this)
  }

  intersect (raycaster) {
    const clickables = [...this.group.children]
    const hits = raycaster.intersectObjects(clickables, false)
    if (hits.length) {
      console.dir(hits)
      const h = hits[0]
      if (h.object?.name) {
        console.log(h.object.name)
        const p = h.object.position
        const adj = getAdj(p.x, p.y, this.mode.xSize, this.mode.ySize)
        console.dir(adj)
      }
    }
  }

  setupThreeGroup (g) {
    this.group = g
    // TODO remake group contents
    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.1)
    const edges = new THREE.EdgesGeometry(geometry)
    const mat1 = new THREE.MeshBasicMaterial({ color: 0x9504f6 })
    const mat2 = new THREE.MeshBasicMaterial({ color: 0xf604a9 })
    const matLines = new THREE.LineBasicMaterial({ color: 0xce9909 })
    // TODO retain materials for management
    for (let idx = 0; idx < this.grid.length; idx++) {
      const val = this.grid[idx]
      const [x, y] = idxToXy(idx, this.mode.xSize)
      const mesh = new THREE.Mesh(geometry, val === '@' ? mat2 : mat1)
      const line = new THREE.LineSegments(edges, matLines)
      mesh.position.set(x, y, 0)
      mesh.add(line)
      mesh.name = `tile_${x}_${y}`
      this.group.add(mesh)
    }
  }
}

export { MoanSwooper }
