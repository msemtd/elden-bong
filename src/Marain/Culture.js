import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MiniGameBase } from '../MiniGameBase'
import { Marain } from './Marain'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { dictionary } from 'cmu-pronouncing-dictionary'
import Speech from 'speak-tts' // es6

// cSpell:ignore marain ARPABET

export class Culture extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Culture')
    this.marain = new Marain()
    this.lineFont = {}
    this.convertMe = 'Whatever Dude'
    this.speech = null
    try {
      const speech = new Speech() // will throw an exception if not browser supported
      if (speech.hasBrowserSupport()) { // returns a boolean
        console.log('speech synthesis supported')
        this.speech = speech
      } else {
        console.log('no speech synthesis supported')
      }
    } catch (error) {
      console.log('no speech synthesis supported')
    }
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.add(this, 'convertMe').onFinishChange(() => {
        this.convertText(this.convertMe)
      })
    })
  }

  convertText (text) {
    // https://www.npmjs.com/package/speak-tts
    // https://codesandbox.io/p/sandbox/rmloxx60q4?file=%2Fsrc%2Findex.js
    console.log(`convert this text: '${text}'`)
    const aa = text.split(' ')
    for (let i = 0; i < aa.length; i++) {
      const word = aa[i].toLowerCase()
      console.log(`convert this word: '${word}'`)
      const res = dictionary[word]
      if (!res) {
        console.log('unknown word')
      } else {
        console.log(res)
      }
    }
    this.speech.init().then((data) => {
      // The "data" object contains the list of available voices and the voice synthesis params
      console.log('Speech is ready, voices are available', data)
      this.speech.speak({
        text,
      }).then(() => {
        console.log('Success !')
      }).catch(e => {
        console.error('An error occurred :', e)
      })
    }).catch(e => {
      console.error('An error occurred while initializing : ', e)
    })
  }

  runTest () {
    this.lineFont = {}
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.activate()
    // TODO read the marain glyphs structure and do something fun
    // convert to numbers
    // convert English words to marain - use the ARPABET
    // try external package loading?
    // runtime load of data and code?
    const material = new THREE.LineBasicMaterial({ color: 0x00ffff })
    const bmMaterial = new THREE.MeshToonMaterial({ color: 'pink' })
    let [objX, objY] = [0, 0]
    const scale = 1 / 2.5
    for (const [k, v] of Object.entries(this.marain.font)) {
      const lp = v.line
      console.assert(Array.isArray(lp))
      console.assert(lp.length % 2 === 0)
      // draw the thing
      const points = []
      for (let i = 0; i < lp.length; i++) {
        const e = lp[i] - 1
        const x = e % 3
        const y = 2 - (Math.floor(e / 3))
        points.push(new THREE.Vector3(x, y, 0))
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.LineSegments(geometry, material)
      line.position.set(objX, objY, 0)
      line.scale.multiplyScalar(scale)
      this.group.add(line)
      this.lineFont[k] = line
      // bitmap to spheres in a group
      const bm = v.bm.split('\n').map(x => x.trim()).filter(x => x.length).join('')
      console.assert(bm.length === 9)
      const g = new THREE.Group()
      for (let i = 0; i < bm.length; i++) {
        const e = bm[i]
        if (e === '@') {
          const x = i % 3
          const y = 2 - (Math.floor(i / 3))
          const geo = new THREE.SphereGeometry(0.1, 8, 8)
          const s = new THREE.Mesh(geo, bmMaterial)
          s.position.set(x, y, 0)
          g.add(s)
        }
      }
      g.position.set(objX, objY, 0)
      g.scale.multiplyScalar(scale)
      this.group.add(g)

      objX++
      if (objX > 6) {
        objX = 0
        objY--
      }
    }
    this.group.position.set(1, 5, 1)
    this.redraw()
  }
}
