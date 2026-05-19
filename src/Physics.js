import { RigidBody, World } from '@dimforge/rapier3d'
import path from 'path-browserify'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MiniGameBase } from './MiniGameBase'
import { Bong } from './bong'
import { filePathToMine } from './util'

// cspell: words dimforge heightfield

function loadTexture (path) {
  const texture = new THREE.TextureLoader().load(path)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.x = 10
  texture.repeat.y = 10
  return texture
}

export class Physics extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Physics')
    this.world = null
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.scene = this.group
      this.staticDir = Bong.getInstance().mainDirs.staticDir
      this.gui.add(this, 'runTest')
    })
  }

  async init () {
    import('@dimforge/rapier3d').then(RAPIER => {
      console.log('import done')
      this.world = new RAPIER.World({ x: 0.0, y: 0.0, z: -9.81 })
      this.generateTerrain(20, new RAPIER.Vector3(70.0, 70.0, 3.0), RAPIER)
    })
  }

  async runTest () {
    this.activate()
    await this.init()
  }

  generateTerrain (nSubDivs, scale, RAPIER) {
    const heights = []
    const threeFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(scale.x, scale.y, nSubDivs, nSubDivs),
      new THREE.MeshStandardMaterial({
        map: loadTexture(filePathToMine(path.join(this.staticDir, 'floors', 'Cobblestone_Irregular_Floor_001_baseColor.png'))),
        normalMap: loadTexture(filePathToMine(path.join(this.staticDir, 'floors', 'Cobblestone_Irregular_Floor_001_normal.png'))),
        aoMap: loadTexture(filePathToMine(path.join(this.staticDir, 'floors', 'Cobblestone_Irregular_Floor_001_ambientOcclusion.png'))),
        roughnessMap: loadTexture(filePathToMine(path.join(this.staticDir, 'floors', 'Cobblestone_Irregular_Floor_001_roughness.png'))),
        roughness: 0.6
      })
    )
    // threeFloor.rotateX(-Math.PI / 2)
    threeFloor.receiveShadow = true
    threeFloor.castShadow = true
    this.scene.add(threeFloor)

    // add height data to plane
    const vertices = threeFloor.geometry.attributes.position.array
    const dx = scale.x / nSubDivs
    const dy = scale.y / nSubDivs
    // store height data in map column-row map
    const columnsRows = new Map()
    for (let i = 0; i < vertices.length; i += 3) {
      // translate into column / row indices
      const row = Math.floor(Math.abs(vertices[i] + (scale.x / 2)) / dx)
      const column = Math.floor(Math.abs(vertices[i + 1] - (scale.y / 2)) / dy)
      // generate height for this column & row
      const randomHeight = Math.random()
      vertices[i + 2] = scale.z * randomHeight
      // store height
      if (!columnsRows.get(column)) {
        columnsRows.set(column, new Map())
      }
      columnsRows.get(column).set(row, randomHeight)
    }
    threeFloor.geometry.computeVertexNormals()

    // store height data into column-major-order matrix array
    for (let i = 0; i <= nSubDivs; ++i) {
      for (let j = 0; j <= nSubDivs; ++j) {
        heights.push(columnsRows.get(j).get(i))
      }
    }

    const groundBodyDesc = RAPIER.RigidBodyDesc.fixed()
    const groundBody = this.world.createRigidBody(groundBodyDesc)
    const groundCollider = RAPIER.ColliderDesc.heightfield(
      nSubDivs, nSubDivs, new Float32Array(heights), scale
    )
    this.world.createCollider(groundCollider, groundBody.handle)
  }
}
