import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MiniGameBase } from '../MiniGameBase'
import { GeoRef } from './GeoRef'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { gsap } from 'gsap'

export class GeoRefMiniGame extends MiniGameBase {
  constructor (parent) {
    super(parent, 'GeoRef')
    this.geoRef = null

    this.timeLine = gsap.timeline({
      autoRemoveChildren: true,
      onComplete: () => { this.redraw?.() }
    })

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
    if (!this.active) { return false }
    // anything on the timeline?
    if (!this.timeLine) { return false }
    return this.timeLine.isActive()
  }

  runTest () {
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.activate()

    const ca = [
      { target: [3.041719, 0.006072, 1.409697], position: [-0.589600, 0.947500, 0.544600], },
      { target: [3.333091, 2.076217, 0.969406], position: [-1.491600, -0.997800, 0.101700], },
      { target: [1.539498, -0.002062, 1.499361], position: [0.838300, 0.505700, 0.622700], },
      { target: [-0.037234, 1.036926, 1.734547], position: [2.047200, -0.957700, 0.858600], },
    ]
    this.geoRef = new GeoRef(ca, this.group)
    this.redraw()
    this.state = 1
  }

  nextState () {
    if (this.state === 1) {
      // move both groups to first point
      const o = this.geoRef.parts
      // o.grp1.position.sub(o.pa1[0])
      // o.grp2.position.sub(o.pa2[0])
      {
        const pos = o.grp1.position
        const v = pos.clone().sub(o.pa1[0])
        this.timeLine.to(pos, { x: v.x, y: v.y, z: v.y, duration: 1 })
      }
      {
        const pos = o.grp2.position
        const v = pos.clone().sub(o.pa2[0])
        this.timeLine.to(pos, { x: v.x, y: v.y, z: v.y, duration: 1 })
      }
    }
    if (this.state === 2) {
      // move both groups to first point
      // TODO
    }
    this.state++
    this.redraw()
  }
}
