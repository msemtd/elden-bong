import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { MiniGameBase } from '../MiniGameBase'
import { Colours } from '../Colours'
import tileImageMonkey from './matcha-card-monkey.png'
import tileImageDog from './matcha-card-dog.png'
import tileImagePig from './matcha-card-pig.png'
import tileImageChicken from './matcha-card-chicken.png'
import tileImageRabbit from './matcha-card-rabbit.png'
import tileImageRat from './matcha-card-rat.png'

export class Matcha extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Matcha')
    this.clickable = []
    this.gameState = 'attract' // 'playing', 'paused', 'gameover'
    // TODO I want to make the tiles from emoji but I can't be sure that the
    // fonts will be available on the user's system
    // I'll start with little PNG images
    // TODO load images
    // TODO add tile textures from images similar to cards games
    const tiles = {
      monkey: { t: '🐵', colour: 'grey', img: tileImageMonkey },
      dog: { t: '🐶', colour: 'grey', img: tileImageDog },
      pig: { t: '🐷', colour: 'grey', img: tileImagePig },
      chicken: { t: '🐔', colour: 'grey', img: tileImageChicken },
      rabbit: { t: '🐰', colour: 'grey', img: tileImageRabbit },
      rat: { t: '🐭', colour: 'grey', img: tileImageRat },
    }
    this.params = {
      w: 8,
      h: 8,
      tileSize: 0.86,
      tileSpacing: 0.1,
      tileThickness: 0.1,
      tiles,
    }
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
    })
  }

  runTest () {
    console.log('Running Matcha test...')
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.activate()
    const p = this.params
    // what fonts have these emoji?
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(p.w, p.h),
      new THREE.MeshBasicMaterial({ color: Colours.get('purple'), side: THREE.DoubleSide })
    )
    backdrop.position.set(0, 0, -0.1)
    this.group.add(backdrop)
    // create tile prototypes
    const loader = new THREE.TextureLoader()
    const m = new THREE.MeshLambertMaterial({ color: Colours.get('green') })
    const geometry = new THREE.BoxGeometry(p.tileSize, p.tileSize, p.tileThickness)
    const meshes = []
    for (const [k, v] of Object.entries(p.tiles)) {
      v.mat = new THREE.MeshLambertMaterial({ map: loader.load(v.img) })
      const mesh = new THREE.Mesh(geometry, [m, m, m, m, v.mat, m])
      mesh.userData.tileType = k
      v.mesh = mesh
      meshes.push(mesh)
    }
    // create "rack" for tiles...
    const rack = new THREE.Group()
    rack.name = 'rack'
    rack.position.set(-3.5, -3.5, 0)
    backdrop.add(rack)
    // create initial rack full of tiles...
    for (let y = 0; y < p.h; y++) {
      for (let x = 0; x < p.w; x++) {
        const k = `${y}_${x}`
        const rnd = Math.floor(Math.random() * meshes.length)
        const tile = meshes[rnd].clone()
        tile.name = `tile_${k}`
        tile.position.set(x, y, p.tileThickness / 2 + 0.001)
        rack.add(tile)
        // this.clickable.push(tile)
      }
    }

    this.redraw()
  }

  /**
   * @returns true if I accept the intersect offer
   */
  offerDoubleClick (ev, mousePos, raycaster) {
    if (!this.active || ev.button !== 0) { return false }
    const hits = raycaster.intersectObjects(this.clickable, true)
    if (!hits.length) {
      return false
    }
    this.clickableClicked(hits[0].object)
    return true
  }

  /**
   * take focus - activate me, deactivate others, etc
   */
  clickableClicked (obj) {
    console.log('clickableClicked', obj)
    this.activate()
    // lock camera
    // on escape, pause game, unlock camera
    // start receiving single clicks
    this.redraw()
    // TODO -
  }
}
