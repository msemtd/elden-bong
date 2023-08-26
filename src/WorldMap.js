import * as THREE from 'three'
import { tileFile, getPad } from './util'

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

  addCoolIcons (myCoolIcons, mapIconSets) {
    const box = new THREE.Box2()
    for (const [key, icon] of Object.entries(myCoolIcons)) {
      console.log(`${key}: ${icon.iconType}`)
      const geometry = new THREE.PlaneGeometry(2, 2)
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.name = icon.id
      mesh.userData = icon
      const mx = icon.position?.match(/^(\d+)px, (\d+)px$/)
      if (!mx) {
        console.log(`no match for ${icon.position}`)
      } else {
        const [x, y, z] = [mx[1], mx[2], 0]
        mesh.position.set(x, y, z)
      }
      mapIconSets.getObjectByName(icon.mapId).add(mesh)
    }
    console.dir(box)
  }

  iconsFromText (lines) {
    const data = {
      hasThat: 0,
      img: 0,
      matches: 0,
      mapIds: {},
      iconTypes: {},
    }
    const incProp = (obj, propName) => {
      if (obj[propName] === undefined) {
        obj[propName] = 1
      } else {
        obj[propName]++
      }
    }
    const myCoolIcons = {}
    for (let i = 0; i < lines.length; i++) {
      const s2 = lines[i]
      // const s2 = 'whatever'
      if (s2.startsWith('<img src=')) {
        // <img src="/file/Elden-Ring/map-d8dc59f2-67df-452e-a9ea-d2c00ddc3a2b/maps-icons/shield.png" class="leaflet-marker-icon leaflet-zoom-animated leaflet-interactive" title="Inverted Hawk Heater Shield" alt="5720-Inverted Hawk Heater Shield" tabindex="0" style="margin-left: 0px; margin-top: 0px; width: 40px; height: 40px; transform: translate3d(524px, 738px, 0px); z-index: 738;">
        data.img++
        const bits = s2.match(/^<img src="\/file\/Elden-Ring\/map-([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})\/maps-icons\/([A-Za-z0-9]+\.[A-Za-z0-9]+)" class=".*" title="(.*)" alt="(.*)" tabindex=.* transform: translate3d\(([A-Za-z0-9]+, [A-Za-z0-9]+), [A-Za-z0-9]+\);/)
        if (!bits) {
          incProp(data, 'imgButNoMatch')
        } else {
          data.matches++
          incProp(data.mapIds, bits[1])
          incProp(data.iconTypes, bits[2])
          const [_fullLine, mapId, iconType, title, id, position] = [...bits]
          myCoolIcons[id] = { id, mapId, iconType, title, position }
        }
      }
      if (s2.includes('/file/Elden-Ring/map-')) {
        data.hasThat++
      }
    }
    data.myCoolIcons = myCoolIcons
    return data
  }

  loadMapData (data, urlPath, scene, redraw) {
    const { tilesX, tilesY, tiles, tileSize, name, bigOriginalFile } = data
    const m = bigOriginalFile?.match(/\..*$/)?.[0]
    const ext = m || '.png'
    const pad = getPad(tilesX, tilesY)
    const logicalTileCount = tilesX * tilesY
    console.log(`logicalTileCount: ${logicalTileCount}`)
    if (tiles.length !== logicalTileCount) {
      throw Error(`map logicalTileCount not OKAY: ${tiles.length}`)
    }
    let mg = scene.getObjectByName('maps')
    if (!mg) {
      mg = new THREE.Group()
      mg.name = 'maps'
      scene.add(mg)
    }
    const g = mg.getObjectByName(name)
    if (g) {
      throw Error(`map '${name}' already loaded`)
    }
    const loader = new THREE.TextureLoader()
    const grp = new THREE.Group()
    grp.name = name
    mg.add(grp)
    const size = 1
    const thickness = 0.1
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const f = tileFile(name, tileSize, x, y, pad, ext)
        const geometry = new THREE.BoxGeometry(size, size, thickness)
        const material = new THREE.MeshBasicMaterial({
          map: loader.load(`${urlPath}/${f}`, redraw)
        })
        const tile = new THREE.Mesh(geometry, material)
        tile.position.set(x * size, y * size, 0)
        grp.add(tile)
      }
    }
    grp.position.z = 0 - (thickness / 2.0) - 0.01
  }
}

export { WorldMap, MapMan }
