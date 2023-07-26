import './index.css'
import * as THREE from 'three'
import { CanvasThree } from './CanvasThree'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import * as util from './util'

console.log('👋 This message is being logged by "renderer.js", included via webpack')

const appDiv = document.getElementById('app')

const v = window.versions
const t = `This app is using Chrome (v${v.chrome()}), Node.js (v${v.node()}), and Electron (v${v.electron()})`
console.log(t)

const doPing = async () => {
  const response = await window.versions.ping()
  console.log(response) // prints out 'pong'
}

doPing()

const c = new CanvasThree(appDiv)
const PROPS = {
  rotating: true,
  addMapTiles: () => {
    loadMap(c.scene)
  }
}

createScene(c)
{
  const stats = new Stats()
  c.container.appendChild(stats.dom)
  stats.domElement.style.cssText = 'position:absolute;top:40px;left:10px;'
  c.addMixer('stats', (_delta) => {
    stats.update()
    return false
  })
  const gui = new GUI({ width: 310 })
  const folder1 = gui.addFolder('Base Actions')
  const folder2 = gui.addFolder('Additive Action Weights')
  const folder3 = gui.addFolder('General Speed')
  gui.add(PROPS, 'addMapTiles')
  gui.add(PROPS, 'rotating')
}

const camInfo = document.getElementById('camInfo')
const dp = 2
const timer = setInterval(() => {
  if (c.camInfo.count) {
    const p = c.camInfo.position
    const t = c.camInfo.target
    const s = `position: ${p.x.toFixed(dp)}, ${p.y.toFixed(dp)}, ${p.z.toFixed(dp)} target: ${t.x.toFixed(dp)}, ${t.y.toFixed(dp)}, ${t.z.toFixed(dp)} `
    c.camInfo.count = 0
    camInfo.textContent = s
    // console.log(s)
  }
}, 100)
c.updateCamInfo()

function createScene (canvas) {
  const scene = canvas.scene
  const geometry = new THREE.BoxGeometry(1.2, 1.2, 0.5)
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)
  canvas.addMixer('demo', (_delta) => {
    if (!PROPS.rotating) return false
    // cube.rotation.x += 0.01;
    cube.rotation.z += 0.01
    return true
  })

  addGrid(scene)

  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)
}

function addGrid (scene) {
  const width = 100
  const gridPos = new THREE.Vector3(0, 0, 0)
  const gridVisible = true

  const grid = new THREE.GridHelper(width, width)
  grid.geometry.rotateX(Math.PI / 2)

  grid.position.copy(gridPos)
  grid.name = 'grid'
  grid.visible = gridVisible
  scene.add(grid)
}

function tileFile (x, y) {
  const tilesX = 38
  const tilesY = 36
  const idx = ((tilesY - y - 1) * tilesX) + x
  const d = util.leftFillNum(idx, 4)
  return `map-0-overworld-tile256-${d}.png`
}

async function loadMap (scene) {
  const dir = await window.bong.getMapTiles()
  if (!dir) return
  if (!Array.isArray(dir) || !dir.length) return
  const tilesX = 38
  const tilesY = 36
  const logicalTileCount = tilesX * tilesY
  console.log(`logicalTileCount: ${logicalTileCount}`)
  if (dir.length !== logicalTileCount) {
    console.log(`map logicalTileCount not OKAY: ${dir.length}`)
  }
  const g = scene.getObjectByName('map')
  if (g) {
    console.log('map already loaded')
    return
  }
  const loader = new THREE.TextureLoader()
  const grp = new THREE.Group()
  grp.name = 'map'
  scene.add(grp)
  const size = 1
  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      const f = tileFile(x, y)
      const geometry = new THREE.BoxGeometry(size, size, 0.1)
      const material = new THREE.MeshBasicMaterial()
      loader.load(`mine://maps/${f}`, (t) => {
        material.map = t
        material.needsUpdate = true
      }, undefined, (err) => {
        console.warn('oops loading ' + f + ': ', err.message)
      })
      const cube = new THREE.Mesh(geometry, material)
      cube.position.set(x * size, y * size, -2)
      grp.add(cube)
    }
  }
}
