import './index.css'
import * as THREE from 'three'
import { CanvasThree } from './CanvasThree'

console.log('👋 This message is being logged by "renderer.js", included via webpack')

const appDiv = document.getElementById('app')

const PROPS = {
  rotating: true
}

const c = new CanvasThree(appDiv)
createScene(c)

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
