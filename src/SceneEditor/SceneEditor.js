import { MiniGameBase } from '../MiniGameBase'
import { Screen } from '../Screen'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

export class SceneEditor extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Scene Editor')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      console.assert(this.screen instanceof Screen)
      this.gui.add(this, 'runTest')
    })
  }

  async runTest () {
    console.log('SceneEditor.runTest()')
    this.activate()
    // 3D cross hair cursor object - same as transform tool
    // double-click to raycast and move cursor object to intersection point
    // hook into double click event
    // hook into renderer?
    this.redraw()
  }

  doubleClick (ev, mousePos, raycaster) {
    if (!this.active) { return false }
    console.log('SceneEditor.doubleClick()')
    const scene = this.screen.scene
    const intersects = raycaster.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
      const first = intersects[0]
      console.log('SceneEditor.doubleClick() found intersection: ', first)
      // move cursor object to intersection point
      // this.cursor.position.copy(first.point)
      // this.redraw()
      return true
    }
    return false
  }

  objectByName () {
    // put up dialog to ask for name
    // name field
    // provide button to add TransformControls to the object if found
    // const scene = this.screen.scene
    // const obj = scene.getObjectByName(name)
    // if (obj) {
    //   console.log('found object: ', obj)
    // } else {
    //   console.warn('object not found: ', name)
    // }
  }
}
