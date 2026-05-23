import { MiniGameBase } from './MiniGameBase'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Screen } from './Screen'

export class DemoCube extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Demo Cube')
    this.cube = null
    this.rotating = true
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      console.assert(this.screen instanceof Screen)
      this.gui.add(this, 'runTest')
      this.gui.add(this, 'rotating')
      this.gui.add(this, 'animationOn')
      this.gui.add(this, 'animationOff')
    })
  }

  animationOn () {
    this.mixerControl(true)
    this.redraw()
  }

  animationOff () {
    this.mixerControl(false)
    this.redraw()
  }

  mixerControl (on) {
    this.screen.removeMixer(this.name)
    if (!on) { return }
    this.screen.addMixer(this.name, (_delta) => {
      if (!this.rotating) return false
      this.cube.rotation.z += 0.01
      return true
    })
  }

  async runTest () {
    // if not there already!
    if (!this.cube) {
      const geometry = new THREE.BoxGeometry(1.2, 1.2, 0.5)
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
      this.cube = new THREE.Mesh(geometry, material)
      this.cube.name = 'demoCube'
      this.group.add(this.cube)
    }
    this.activate()
    this.mixerControl(true)
    this.redraw()
  }
};
