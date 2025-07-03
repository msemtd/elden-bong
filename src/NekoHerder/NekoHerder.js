import { MiniGameBase } from '../MiniGameBase'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import ntc from '@yatiac/name-that-color'

class NekoHerder extends MiniGameBase {
  constructor (parent) {
    super(parent, '猫-Herder')
    // https://hitoikigame.com/blog-entry-7879.html
    // just wraps https://llerrah.com/cattrapgame1.htm ???
    // 11 x 11 hexagonal grid - cat begins in the middle
    // how many grid places get randomly set?
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.add(this, 'activate')
      this.gui.add(this, 'deactivate')
      this.hexBlockGeometry = NekoHerder.hexBlock()
    })
    // TODO: ntc is not as awesome as it could be - we cannot do lookups by name - maybe fork it
    this.blockColours = ['Racing Green', 'Japanese Laurel']
    for (const c of this.blockColours) {
      const r = ntc(c)
      console.dir(r)
    }
  }

  static hexBlock () {
    const a = Math.cos(Math.PI / 3)
    const b = Math.sin(Math.PI / 3)
    const s = new THREE.Shape()
    s.moveTo(0, 1)
    s.lineTo(b, a)
    s.lineTo(b, -a)
    s.lineTo(0, -1)
    s.lineTo(-b, -a)
    s.lineTo(-b, a)
    s.lineTo(0, 1)
    const extrudeSettings = {
      steps: 2,
      depth: 1,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 3
    }
    const geometry = new THREE.ExtrudeGeometry(s, extrudeSettings)
    return geometry
  }

  async runTest () {
    console.warn('runTest')
    this.group.clear()
    const material = new THREE.MeshPhongMaterial({ color: 'green' })
    const sx = 11
    const sy = 11
    const spacing = 0.98
    const xOff = 2 * Math.sin(Math.PI / 3) * spacing
    const yOff = 2 * spacing

    for (let j = 0; j < sy; j++) {
      for (let i = 0; i < sx; i++) {
        const h = new THREE.Mesh(this.hexBlockGeometry, material)
        h.rotateZ(Math.PI / 2)
        const adj = (i % 2) / 2
        const x = i * xOff
        const y = (j + adj) * yOff
        h.position.set(x, y, 0)
        this.group.add(h)
      }
    }

    this.redraw()
  }
}

export { NekoHerder }
