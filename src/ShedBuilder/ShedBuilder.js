import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { isString, isObject, isInteger } from '../wahWah'
import { Screen } from '../Screen'
import { pickFile } from '../HandyApi'

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

  activate () {
    this.group.visible = true
    this.redraw()
  }

  async runTest () {
    console.warn('TODO runTest')
    // const fa = await pickFile()
    // console.log('file info: ', fa)
    // parent to set the location
    // foundations
    // tables of parts and costs
    // construct posts and cladding
    // cutting list

    this.activate()
    if (!this.group.getObjectByName('shed')) {
      this.makeShed('shed')
    }
  }

  makeShed (shedName) {
    const width = 4
    const height = 3
    const depth = 2
    const widthSegments = 8
    const heightSegments = 8
    const depthSegments = 8
    // NB: remember that geometry is Y-up!
    const geometry = new THREE.BoxGeometry(
      width, height, depth,
      widthSegments, heightSegments, depthSegments)
    const material = new THREE.MeshPhongMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(5, 8, depth / 2)
    mesh.name = shedName
    this.group.add(mesh)
  }
}

export { ShedBuilder }
