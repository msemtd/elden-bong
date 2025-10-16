import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { MiniGameBase } from '../MiniGameBase'
import { Colours } from '../Colours'

export class Matcha extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Matcha')
    this.clickable = []
    this.gameState = 'attract' // 'playing', 'paused', 'gameover'
    const tiles = {
      monkey: { t: '🐵', colour: 'grey' },
      dog: { t: '🐶', colour: 'grey' },
      pig: { t: '🐷', colour: 'grey' },
      chicken: { t: '🐔', colour: 'grey' },
      rabbit: { t: '🐰', colour: 'grey' },
      rat: { t: '🐭', colour: 'grey' },
    }
    this.params = {
      w: 8,
      h: 8,
      tileSize: 0.9,
      tileSpacing: 0.1,
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
    const p = {
      w: 8,
      h: 8,
      tileSize: 0.9,
      tileSpacing: 0.1,
      tiles: Object.keys(this.tiles),
    }
    // what fonts have these emoji?
    const backdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(p.w, p.h),
      new THREE.MeshBasicMaterial({ color: Colours.get('purple'), side: THREE.DoubleSide })
    )
    backdrop.position.set(0, 0, -0.1)
    this.group.add(backdrop)
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
