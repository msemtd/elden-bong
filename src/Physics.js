import { RigidBody, World } from '@dimforge/rapier3d'
import path from 'path-browserify'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MiniGameBase } from './MiniGameBase'
import { filePathToMine } from './util'
import { getMainDirs } from './HandyApi'

// cspell: words dimforge heightfield

/**
 * This is a journey into the world of game physics using Rapier3D (for now).
 *
 * For 3D adventure game world navigation and object interaction.
 * Get to grips with the ideas in Rapier3D - limited world, manual copying of
 * results of physics
 *
 * I'm copying the example code at https://github.com/tamani-coding/threejs-rapier3d-character-terrain-movement/
 * with changes to suit my player-character, game-controls, camera-controls, animation-loop, etc.
 * The MiniGames system is used for convenience:
 * - ensure readiness at startup
 * - runTest feature, enable/disable, menu
 * - add and remove work in the animation loop
 * - own settings
 *
 *
 */
export class Physics extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Physics')
    this.world = null
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.scene = this.group
      // this.staticDir = Bong.getInstance().mainDirs.staticDir
      this.gui.add(this, 'runTest')
    })
  }

  async init () {
    this.staticDir = (await getMainDirs()).staticDir
    import('@dimforge/rapier3d').then(RAPIER => {
      console.log('import done')
      this.world = new RAPIER.World({ x: 0.0, y: 0.0, z: -9.81 })
      this.generateTerrain(20, new RAPIER.Vector3(70.0, 70.0, 3.0), RAPIER)
      // drop some objects to interact with - just for testing - no performance considerations right now
      // this.generateJunk()
      // this could be done at any time! Same with adding the player character
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
    threeFloor.name = 'physicsFloorPlane'
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

function loadTexture (path) {
  const texture = new THREE.TextureLoader().load(path)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.x = 10
  texture.repeat.y = 10
  return texture
}
