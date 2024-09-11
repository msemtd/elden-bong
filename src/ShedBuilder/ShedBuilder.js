import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { isString, isObject, isInteger } from '../wahWah'
import { Screen } from '../Screen'

class ShedBuilder extends THREE.EventDispatcher {
  constructor (parent) {
    super()
    console.assert(parent instanceof THREE.EventDispatcher)
    this.active = false
    this.gui = null
    this.group = new THREE.Group()
    this.group.name = 'ShedBuilder'
    // -------------------------------------

    // ------------------------------------------------
    parent.addEventListener('ready', (ev) => {
      console.assert(ev.gui instanceof GUI)
      console.assert(ev.group instanceof THREE.Object3D)
      console.assert(typeof ev.redrawFunc === 'function')
      console.assert(ev.screen instanceof Screen)
      this.redraw = ev.redrawFunc
      this.screen = ev.screen
      ev.group.add(this.group)
      const f = this.gui = ev.gui.addFolder('Shed Builder')
      f.add(this, 'runTest')
    })
  }

  runTest () {
    console.warn('TODO runTest')
    // parent to set the location
    // foundations
    // tables of parts and costs
    // construct posts and cladding
    // cutting list
  }
}

export { ShedBuilder }
