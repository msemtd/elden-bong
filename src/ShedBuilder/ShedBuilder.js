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
    this.addComponents()
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

    const wall = {
      component: 'shipLap',
      arraySize: 1,
      startPos: [0, 0, 0],
    }

    const c = this.components[wall.component]
    const n = wall.arraySize
    console.assert(isObject(c))
    console.assert(c?.isMesh)
    const a = wall.startPos
    const p = new THREE.Vector3(a[0], a[1], a[2])
    if (c?.isMesh) {
      for (let i = 0; i < n; i++) {
        const o = c.clone()
        if (c.userData.overlap) {
          p.z = c.userData.overlap * i
        }
        o.position.copy(p)
        this.group.add(o)
      }
    }
    this.redraw()
  }

  addComponents () {
    const b = new THREE.BoxGeometry(0.0145, 0.119, 2.4)
    const m = new THREE.MeshLambertMaterial({ color: 'brown' })
    const plank = new THREE.Mesh(b, m)
    const gp = new THREE.BoxGeometry(2.1, 0.075, 0.075)
    const mp = new THREE.MeshLambertMaterial({ color: 'green' })
    const post = new THREE.Mesh(gp, mp)
    post.userData = {
      pricePerUnit: '£13.00',
      link: 'https://www.wickes.co.uk/Incised-Timber-Fence-Post---75-x-75-x-2100mm/p/542002'
    }
    // ship-lap profile...
    const profile = new THREE.Shape()
    const thickness = 14.5 / 1000
    const tw = thickness / 2.0
    const lap = 9 / 1000
    const height = 119 / 1000
    const length = 2.4
    profile.moveTo(tw, 0)
    profile.lineTo(thickness, 0)
    profile.lineTo(thickness, height - (lap * 3))
    profile.lineTo(tw, height - (lap * 1.3))
    profile.lineTo(tw, height)
    profile.lineTo(0, height)
    profile.lineTo(0, lap)
    profile.lineTo(tw, lap)
    profile.lineTo(tw, 0)

    // profile.lineTo(tw, 0)
    // profile.lineTo(tw, lap * 1.3)
    // profile.lineTo(thickness, lap * 3)
    // profile.lineTo(thickness, height)
    // profile.lineTo(tw, height)
    // profile.lineTo(tw, height - lap)
    // profile.lineTo(0, height - lap)
    // profile.lineTo(0, 0)
    const geometry = new THREE.ExtrudeGeometry(profile, { depth: length, bevelEnabled: false })
    const material = new THREE.MeshPhongMaterial({ color: 'tan' })
    const shipLap = new THREE.Mesh(geometry, material)
    shipLap.userData = {
      link: 'https://www.wickes.co.uk/Wickes-Treated-Rebated-Shiplap-14-5-x-119-x-2400mm/p/9000281526',
      pricePerUnit: '£9.40',
      overlap: 0.112,
      height,
      length,
      thickness,
    }
    // shipLap.rotateX(-Math.PI / 2.0)
    // shipLap.rotateY(Math.PI / 2.0)

    this.components = { post, shipLap, plank }
  }
}

export { ShedBuilder }
