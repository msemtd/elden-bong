import { MiniGameBase } from '../MiniGameBase'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Screen } from '../Screen'
import CameraControls from 'camera-controls'
import * as THREE from 'three'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'

export class Tetris extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Tetris')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
    })
  }

  runTest () {
    // what to do here? Draw a playing field?
    // define the blocks - get the colours right!
    // define the game
    // the controls
    // all dat stuff!
  }
}
