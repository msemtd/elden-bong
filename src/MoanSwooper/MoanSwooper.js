import * as THREE from 'three'
import { depthFirstReverseTraverse, generalObj3dClean } from '../threeUtil'
import tileImage from './grass_tile_256.png'
import { Text } from 'troika-three-text'
import { fyShuffle } from './fyShuffle'
import { getAdj, gridFromString, gridToString, idxToXy, makeGrid, setGridNumbers, xyToIdx } from './gridUtils'
import { isString, isObject, isInteger } from './wahWah'

/**
 * How does an implementation of minesweeper decide how to distribute the bombs for each difficulty level?
 * Easy, medium, hard, and custom modes.
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

const testField1 = `
.@........
......@...
..........
.@........
..@.....@.
....@.....
.........@
......@@@.
`

export const modes = {
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

function todo (s) {
  console.warn(`TODO: ${s}`)
}

class MoanSwooper extends THREE.EventDispatcher {
  constructor () {
    super()
    this.mode = modes.easy
    this.grid = makeGrid(this.mode)
    this.flags = this.grid.slice().fill('.')
    this.state = 'NEW_GAME'
    // in new state there's no point in setting the numbers yet - wait until first opening move
    // setGridNumbers(grid, mode)
    this.active = true
    // TODO: have a visual indicator of game state
    this.masterMineObj = this.makeBomb()
    this.masterFlagObj = this.makeFlag()
  }

  runTest () {
    const mode = modes.easy
    const grid = gridFromString(testField1, mode)
    // this.grid = makeGrid(this.mode)
    // let s = gridToString(this.grid, this.mode)
    // setGridNumbers(this.grid, this.mode)
    let s = gridToString(grid, mode)
    console.log(s)
    setGridNumbers(grid, mode)
    s = gridToString(grid, mode)
    console.log(s)
    // this.resetThreeGroup()
  }

  redraw () {
    this.dispatchEvent({ type: 'redraw' })
  }

  runTestBomb () {
    const eb = this.group.getObjectByName('bomb')
    if (eb) {
      eb.removeFromParent()
    } else {
      const o = this.makeBomb()
      o.name = 'bomb'
      o.position.copy(this.group.worldToLocal(new THREE.Vector3(0, 0, 0)))
      this.group.add(o)
    }
    const existingFlag = this.group.getObjectByName('flag')
    if (existingFlag) {
      existingFlag.removeFromParent()
    } else {
      const o = this.makeFlag()
      o.name = 'flag'
      o.position.copy(this.group.worldToLocal(new THREE.Vector3(1, 0, 0)))
      this.group.add(o)
    }
    this.addTextObj('Moan Swooper', 3, -1, 0, 0x9966FF)
    // this.addTextObj('0', 0, 0, 0.11, 0xff2222)
    // this.addTextObj('1', 1, 1, 0.11, 0xff2222)
    // this.addTextObj('2', 2, 2, 0.11, 0xff2222)
    // this.addTextObj('3', 3, 3, 0.11, 0xff2222)
    this.redraw()
  }

  addTextObj (s, x = 0, y = 0, z = 0, c = 0x9966FF) {
    console.assert(isString(s))
    const obj = new Text()
    this.group.add(obj)
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

  addNum (n, x, y) {
    console.assert(Number.isInteger(n))
    const obj = this.addTextObj(`${n}`, x, y, 0.11, 0xff2222)
    obj.name = `num_at_${x}_${y}`
    obj.userData = { n }
  }

  setState (state) {
    this.state = state
    this.dispatchEvent({ type: 'moanState', value: this.state })
  }

  intersect (rayCaster, ev) {
    // first see what event looks like
    const btn = ev ? ev.button : null
    const obs = [...this.group.children].filter(x => x.name?.startsWith('tile_'))
    const hits = rayCaster.intersectObjects(obs, false)
    if (!hits.length) { return }
    console.dir(hits)
    const h = hits[0]
    const obj = h.object
    console.log(`button ${btn} on ${obj.name}`)
    const p = obj.position
    const idx = xyToIdx(p.x, p.y, this.mode.xSize)
    if (btn === 0) {
      this.dig(idx, p.x, p.y, obj)
    } else if (btn === 2) {
      this.flag(idx, p.x, p.y, obj)
    }
  }

  dig (idx, x, y, obj) {
    if (this.state === 'NEW_GAME') {
      console.log('DIG: first move!')
      this.grid[idx] = '@'
      // TODO: rotate field until no boom
      while (this.grid[idx] !== '.') {
        // find a random space and swap or something simpler?
        console.warn('NEW GAME SHUFFLE')
        fyShuffle(this.grid)
        setGridNumbers(this.grid, this.mode)
      }
      todo('TIMER START')
      const s = gridToString(this.grid, this.mode)
      console.log(s)
      // drop through and continue playing state...
      this.setState('PLAYING')
    }
    if (this.state === 'PLAYING') {
      // first, if this is a flagged square then nothing happens
      if (this.flags[idx] === 'F') {
        console.log('DIG: hit flag, do nothing!')
        return
      }
      if (this.grid[idx] === '@') {
        console.log('DIG: hit mine!')
        this.setState('BANG_GAME_OVER')
        this.active = false
        return
      }
      this.zeroOpen(idx, x, y, obj)
    }
  }

  zeroOpen (idx, x, y, obj) {
    console.assert(isInteger(idx))
    console.assert(isInteger(x))
    console.assert(isInteger(y))
    console.assert(isObject(obj))
    // how does this work? I just want to know the logic. It's called a zero-open
    // https://www.reddit.com/r/Minesweeper/comments/v481jm/i_want_to_know_how_the_tiles_open_up_when_clicked/
    // delete this tile and any other empty ones adjacent?
    // Show the numbers
    // for now make tile invisible - it could change colour, descend slightly and become un-clickable (by changing group or name or whatever)
    // obj.visible = false
    obj.name = `deadTile_${x}_${y}`
    obj.position.z -= 0.05
    obj.material = this.deadTileMaterial
    const adj = getAdj(x, y, this.mode.xSize, this.mode.ySize)
    for (const a of adj) {
      this.drill(a[0], a[1])
    }
    this.redraw()
  }

  drill (x, y) {
    const idx = xyToIdx(x, y, this.mode.xSize)
    const val = this.grid[idx]
    if (val === '@') { return }
    if (this.flags[idx] === 'F') { return }
    if (val === '.') {
      // get tile obj at xy and zero-open here
      const obj = this.group.getObjectByName(`tile_${x}_${y}`)
      if (obj) {
        // recurse!
        this.zeroOpen(idx, x, y, obj)
      }
      return
    }
    // TODO surely this can only be a number here...
    const p = Number.parseInt(val)
    if (Number.isNaN(p)) {
      console.assert(!Number.isNaN(p))
      return
    }
    // also, it could already be uncovered but have a number
    const numName = `num_at_${x}_${y}`
    if (this.group.getObjectByName(numName)) {
      console.log('already a number ')
      return
    }
    this.addNum(p, x, y)
  }

  flag (idx, x, y, obj) {
    console.log('FLAG!')
    if (this.flags[idx] === '.') {
      this.flags[idx] = 'F'
      const obj = this.masterFlagObj.clone()
      obj.name = `flag_${idx}_${x}_${y}}`
      obj.position.set(x, y, 0)
      this.group.add(obj)
    } else if (this.flags[idx] === 'F') {
      this.flags[idx] = '.'
      const n = `flag_${idx}_${x}_${y}}`
      const o = this.group.getObjectByName(n)
      o.removeFromParent()
    } else {
      console.warn('bad state in flag')
    }
  }

  resetThreeGroup () {
    // TODO remove any existing group contents
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)

    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.1)
    const edges = new THREE.EdgesGeometry(geometry)
    const matOpts = {
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    }
    const mat1 = new THREE.MeshLambertMaterial({ ...matOpts, color: 'tan' })
    this.deadTileMaterial = new THREE.MeshLambertMaterial({ ...matOpts, color: 'brown' })
    const matLines = new THREE.LineBasicMaterial({ color: 'purple' })
    // TODO retain materials for management
    for (let idx = 0; idx < this.grid.length; idx++) {
      const [x, y] = idxToXy(idx, this.mode.xSize)
      const mesh = new THREE.Mesh(geometry, mat1)
      const line = new THREE.LineSegments(edges, matLines)
      mesh.position.set(x, y, 0)
      mesh.add(line)
      mesh.name = `tile_${x}_${y}`
      this.group.add(mesh)
    }
    // add a green-baize backdrop
    {
      const w = this.mode.xSize + 2
      const h = this.mode.ySize + 2
      const g = new THREE.BoxGeometry(w, h, 0.2)
      const m = new THREE.MeshLambertMaterial({ color: 'green' })
      const o = new THREE.Mesh(g, m)
      o.position.set((w / 2) - 1.5, (h / 2) - 1.5, -0.2)
      this.group.add(o)
    }
    //
    const cb = (img) => {
      const ctx = document.createElement('canvas').getContext('2d')
      ctx.canvas.width = 256
      ctx.canvas.height = 256
      // ctx.fillStyle = '#FFF'
      // ctx.fillRect(0, 0, 256, 256)
      ctx.drawImage(img, 0, 0)
      const texture = new THREE.CanvasTexture(ctx.canvas)
      const material = new THREE.MeshBasicMaterial({ map: texture })
      const cube = new THREE.Mesh(new THREE.BoxGeometry(), material)
      this.canvasCube = cube
      cube.position.set(-1.25, -1.25, 0.7)
      this.group.add(cube)
    }
    const loader = new THREE.ImageLoader()
    loader.load(tileImage, cb, undefined, (err) => { console.error('failed ', err) })

    const ta = new Array(9)
    for (let i = 0; i < ta.length; i++) {
      // make a canvas texture with text of a certain font in centre
    }
    // this.tileFaceTextures = ta
  }

  makeFlag () {
    const grp = new THREE.Group()
    const matFlag = new THREE.MeshLambertMaterial({ color: 'red' })
    const matPole = new THREE.MeshLambertMaterial({ color: 'white' })
    {
      const g = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 7)
      const m = new THREE.Mesh(g, matPole)
      m.position.set(-0.25, 0, 0)
      grp.add(m)
      const b = new THREE.BoxGeometry()
      const m2 = new THREE.Mesh(b, matFlag)
      m2.scale.set(0.520, 0.462, 0.141)
      m2.position.set(0.075, 0.241, 0)
      grp.add(m2)
    }
    return grp
  }

  makeBomb () {
    // start with a simple implementation (for fun) and maybe improve later (again, for fun!)
    const bomb = new THREE.Group()
    const matOpts = {
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    }
    const matBox = new THREE.MeshLambertMaterial({ ...matOpts, color: 'tan' })
    const matLines = new THREE.LineBasicMaterial({ color: 'purple' })
    {
      const name = 'ball'
      const g = new THREE.IcosahedronGeometry(1, 1)
      const edges = new THREE.EdgesGeometry(g)
      const mesh = new THREE.Mesh(g, matBox)
      const line = new THREE.LineSegments(edges, matLines)
      mesh.name = name
      mesh.add(line)
      bomb.add(mesh)
      mesh.visible = true
    }
    {
      const grp = new THREE.Group()
      const name = 'cyl'
      const g = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 5)
      const edges = new THREE.EdgesGeometry(g)
      const mesh = new THREE.Mesh(g, matBox)
      const line = new THREE.LineSegments(edges, matLines)
      mesh.name = name
      mesh.add(line)
      grp.add(mesh)
      {
        const c2 = mesh.clone()
        c2.rotateX(Math.PI / 2)
        grp.add(c2)
      }
      {
        const c2 = mesh.clone()
        c2.rotateZ(Math.PI / 2)
        grp.add(c2)
      }
      bomb.add(grp)
      {
        const g2 = grp.clone()
        g2.rotateX(Math.PI / 4)
        g2.rotateY(Math.PI / 4)
        bomb.add(g2)
      }
      {
        const g2 = grp.clone()
        g2.rotateX(Math.PI / -4)
        g2.rotateY(Math.PI / -4)
        bomb.add(g2)
      }
    }
    return bomb
  }
}

export { MoanSwooper }
