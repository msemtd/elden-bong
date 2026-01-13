import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MiniGameBase } from '../MiniGameBase'
import { GeoRef } from './GeoRef'
import { generalObj3dClean, depthFirstReverseTraverse, rotateAboutPoint } from '../threeUtil'
import * as TWEEN from 'three/addons/libs/tween.module.js'
import { delayMs } from '../util'

export class GeoRefMiniGame extends MiniGameBase {
  constructor (parent) {
    super(parent, 'GeoRef')
    this.geoRef = null
    this.state = 0
    this.animationQueue = []
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.add(this, 'nextState')
      this.screen.addMixer(this.name, (delta) => { return this.animate(delta) })
    })
  }

  /**
   * @returns {boolean} whether a redraw is required
   */
  animate (delta) {
    // anything in the queue to animate?
    if (!this.active || this.animationQueue.length === 0) { return false }
    const keep = []
    for (const func of this.animationQueue) {
      // functions should return false if they want to fall off the queue
      // NB: TWEEN can't use this delta that comes from Screen class...
      if (func(delta)) {
        keep.push(func)
      }
    }
    this.animationQueue = keep
    // return that we need to redraw...
    return true
  }

  async waitForAnimations () {
    // console.log('waiting for animations to finish...')
    // console.time('waitForAnimations')
    while (this.animationQueue.length) {
      await delayMs(100)
    }
    // console.timeEnd('waitForAnimations')
    // console.log('animations finished')
  }

  runTest () {
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.activate()

    const control = [
      { t: [3.041719, 0.006072, 1.409697], p: [-0.589600, 0.947500, 0.544600], },
      { t: [3.333091, 2.076217, 0.969406], p: [-1.491600, -0.997800, 0.101700], },
      { t: [1.539498, -0.002062, 1.499361], p: [0.838300, 0.505700, 0.622700], },
      { t: [-0.037234, 1.036926, 1.734547], p: [2.047200, -0.957700, 0.858600], },
    ]
    const control1 = [
      { t: [201210.453543, 227760.402946, 394.009652], p: [-6.274993, 17.678120, -2.544000] },
      { t: [201215.502870, 227754.794310, 395.689713], p: [-11.610781, 23.057872, -0.823300] },
      { t: [201204.619050, 227563.394158, 392.454255], p: [-11.200283, 214.727615, -3.452497] },
      { t: [201137.722631, 227583.271730, 392.784354], p: [56.753903, 198.489981, -3.201100] },
      { t: [201115.927864, 227633.914351, 394.499771], p: [81.224276, 149.099543, -1.527400] },
      { t: [201076.763729, 227578.350419, 394.031293], p: [117.310004, 206.807064, -1.952000] },
    ]
    const setToUse = control1
    this.geoRef = new GeoRef(setToUse, this.group)
    // Before we redraw, move the big georeferenced group into view
    // make initial major adjustment to targets bring both groups into view
    const fakeAdjust = new THREE.Vector3(1, 1, 1).sub(this.geoRef.paT[0])
    this.geoRef.tg.position.add(fakeAdjust)
    this.redraw()
    this.state = 1
    console.log('state is ' + this.state)
  }

  async nextState () {
    const dur = 1000
    const e = TWEEN.Easing.Quadratic.InOut
    if (this.state === 1) {
      // in this example we are animating moving the target group to align with the original group
      // The target group has already been roughly moved into place
      // now we animate the alignment of the first point
      // The new position of the group will be
      const newPos1 = this.geoRef.paP[0].clone().sub(this.geoRef.paT[0])
      // console.log('pointZeroDiff ', newPos1)
      const t1 = new TWEEN.Tween(this.geoRef.tg.position)
        .to({ x: newPos1.x, y: newPos1.y, z: newPos1.z }, dur)
        .easing(e)
        .start()
      this.animationQueue.push(() => {
        t1.update()
        return (t1.isPlaying())
      })
    }
    if (this.state === 2) {
      const obj = new THREE.Object3D()
      this.geoRef.tg.parent.add(obj)
      obj.position.copy(this.geoRef.tg.position)
      obj.rotation.copy(this.geoRef.tg.rotation)
      //
      const up = new THREE.Vector3(0, 0, 1).normalize()
      const theta = Math.PI // 5.0 // TODO: compute angle properly
      //
      console.log('obj state', obj.position, obj.rotation)
      rotateAboutPoint(obj, this.geoRef.paP[0].clone(), up, theta, true)
      console.log('obj state', obj.position, obj.rotation)
      // make it so!
      const t1 = new TWEEN.Tween(this.geoRef.tg.position)
        .to({ x: obj.position.x, y: obj.position.y, z: obj.position.z }, dur)
        .easing(e)
        .start()
      this.animationQueue.push(() => {
        t1.update()
        return (t1.isPlaying())
      })
      await this.waitForAnimations()
      const t2 = new TWEEN.Tween(this.geoRef.tg.rotation)
        .to({ x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z }, dur)
        .easing(e)
        .start()
      this.animationQueue.push(() => {
        t1.update()
        t2.update()
        return (t1.isPlaying() || t2.isPlaying())
      })
    }
    await this.waitForAnimations()
    this.state++
    this.redraw()
  }
}
