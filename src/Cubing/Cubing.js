import { GUI } from 'dat.gui'
import { MiniGameBase } from '../MiniGameBase.js'
import { generalObj3dClean, depthFirstReverseTraverse } from '../../utils/threeUtils.js'
import * as THREE from 'three'

// https://github.com/cubing/cubing.js

export class Cubing extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Cubing')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.open()
      setTimeout(() => {
        this.runTest()
      }, 600)
    })
  }
}
