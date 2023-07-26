import './index.css'
import * as THREE from 'three'
import { CanvasThree } from './CanvasThree'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MapMan, WorldMap } from './WorldMap'

console.log('👋 This message is being logged by "renderer.js", included via webpack')

const appDiv = document.getElementById('app')

const v = window.versions
const t = `This app is using Chrome (v${v.chrome()}), Node.js (v${v.node()}), and Electron (v${v.electron()})`
console.log(t)

const c = new CanvasThree(appDiv)
const mapMan = new MapMan()
const PROPS = {
  rotating: true,
  addMapTiles: () => { mapMan.loadMap(c.scene) },
  resetCamera: () => { c.cameraControls.reset() },
  pickFile: async () => {
    // just a test...
    const res = await window.bong.pickFile()
    console.dir(res)
  }
}
createScene(c)
const theGui = makeGui()

function makeGui () {
  const gui = new GUI({ width: 310 })
  const fld = gui.addFolder('Base Actions')
  fld.add(PROPS, 'resetCamera')
  fld.add(PROPS, 'rotating')
  const settings = gui.addFolder('General Setup')
  settings.add(PROPS, 'addMapTiles')
  settings.add(PROPS, 'pickFile')
  // set resource dir or set map dir
  // set tools dir
  // get imageMagick
  // get other tools
  // dirs for icons, sounds, models, etc.
  // cube map backgrounds
  // routes for map
  // general dir picker and file picker in GUI
  // external hyperlinks with shell.openExternal(url)
  // shell.showItemInFolder(fullPath)
  return gui
}

{
  const stats = new Stats()
  c.container.appendChild(stats.dom)
  stats.domElement.style.cssText = 'position:absolute;top:40px;left:10px;'
  c.addMixer('stats', (_delta) => {
    stats.update()
    return false
  })
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

const doPing = async () => {
  const response = await window.versions.ping()
  console.log(response) // prints out 'pong'
}

doPing()
