import { MiniGameBase } from '../MiniGameBase'
import { dictionary } from 'cmu-pronouncing-dictionary'
import * as THREE from 'three'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Colours } from '../Colours.js'

class PiTrain extends MiniGameBase {
  constructor (parent) {
    super(parent, 'PiTrain')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
    })
  }

  runTest () {
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.activate()
    // TODO a certain amount of UX required here
    const ts = dictionary['train']
    if (!ts) {
      console.warn('No pronunciation for "train" found in the dictionary.')
    } else {
      console.log('Pronunciation for "train":', ts)
      // TODO looks like the regular package doesn't have the phonemes so we can fork it to add them
      // TODO add the most simple TTS package to the project
    }
    this.group.position.set(0, 0, 1.5)
    this.redraw()
  }
}

export { PiTrain }
