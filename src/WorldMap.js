import * as THREE from 'three'
import * as util from './util'

class WorldMap extends THREE.Group {
  constructor (name) {
    super()
    this.name = name
    this.sideTexture = null
    this.backTexture = null
    this.tilesX = 0
    this.tilesY = 0
    this.tileSize = 1.0
    this.thickness = 0.1
  }
}

class MapMan {
  // hold a bunch of maps!
  // control swapping maps, etc.
  // load maps
  async loadMap (scene) {
    await loadMap2(scene)
  }
}

function tileFile (x, y) {
  const tilesX = 38
  const tilesY = 36
  const idx = ((tilesY - y - 1) * tilesX) + x
  const d = util.leftFillNum(idx, 4)
  return `map-0-overworld-tile256-${d}.png`
}

async function loadMap2 (scene) {
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
  const thickness = 0.1
  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      const f = tileFile(x, y)
      const geometry = new THREE.BoxGeometry(size, size, thickness)
      const material = new THREE.MeshBasicMaterial({ map: loader.load(`mine://maps/${f}`) })
      const tile = new THREE.Mesh(geometry, material)
      tile.position.set(x * size, y * size, 0)
      grp.add(tile)
    }
  }
  grp.position.z = 0 - (thickness / 2.0) - 0.01
}

export { WorldMap, MapMan }
