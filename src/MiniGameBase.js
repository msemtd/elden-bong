import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Screen } from './Screen'

class MiniGameBase extends THREE.EventDispatcher {
  constructor (parent, name) {
    super()
    console.assert(parent instanceof THREE.EventDispatcher)
    this.active = false
    this.name = name
    this.gui = null
    this.group = new THREE.Group()
    this.group.name = name
    this.onReady = (ev) => {
      console.assert(ev.gui instanceof GUI)
      console.assert(ev.group instanceof THREE.Object3D)
      console.assert(typeof ev.redrawFunc === 'function')
      console.assert(ev.screen instanceof Screen)
      this.redraw = ev.redrawFunc
      this.screen = ev.screen
      ev.group.add(this.group)
      this.gui = ev.gui.addFolder(name)
    }
  }

  activate () {
    this.group.visible = true
    this.redraw()
  }

  deactivate () {
    this.group.visible = false
    this.redraw()
  }
}

export { MiniGameBase }
