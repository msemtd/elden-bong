import { MiniGameBase } from '../MiniGameBase'
import { Colours } from '../Colours.js'
import * as THREE from 'three'
import { generalObj3dClean, depthFirstReverseTraverse } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

// cSpell:ignore doyoh dohyō
const doyohHeight = 0.66 // height of the clay platform
const ringRadius = 4.55 / 2 // radius of the tawara ring
const tawaraThickRadius = 0.05 // exposed tawara bale height (or radius)

export class SumoDoyoh extends MiniGameBase {
  constructor (parent) {
    super(parent, 'SumoDoyoh')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      // this.gui.open()
      // setTimeout(() => {
      //   this.runTest()
      // }, 600)
    })
  }

  runTest () {
    depthFirstReverseTraverse(null, this.group, generalObj3dClean)
    this.activate()
    this.makeDoyoh()
    this.group.position.setZ(doyohHeight)
    this.redraw()
  }

  // cspell:ignore tawara tokudawara
  makeDoyoh () {
    const colours = new Colours()
    const doyoh = new THREE.Group()
    doyoh.name = 'doyoh'
    this.group.add(doyoh)
    const clayMaterial = new THREE.MeshLambertMaterial({
      color: colours.gimme('clay brown'),
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    })
    const sandMaterial = clayMaterial.clone()
    sandMaterial.color.set(colours.gimme('sand brown'))
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 'black' })

    // A typical dohyō is a circle made of partially buried rice-straw bales 4.55 meters in diameter
    {
      const g = new THREE.CylinderGeometry(ringRadius, ringRadius, 0.05, 32)
      const mesh = new THREE.Mesh(g, sandMaterial)
      mesh.rotateX(Math.PI / 2)
      doyoh.add(mesh)
    }
    // it is mounted on a square platform of clay 66 cm high and 6.7m wide on each side.
    {
    // Using THREE.js cylinder to make a square with sloping sides.
    // The cylinder radius, r is required to make us a square 6.7m wide.
    // If the "radius" of the square is x then r = x * Sin(45°) = x / √2
      const g = new THREE.CylinderGeometry(6.7 / 2 * Math.SQRT2, 8 / 2 * Math.SQRT2, doyohHeight, 4, 3)
      const mesh = new THREE.Mesh(g, clayMaterial)
      const e = new THREE.EdgesGeometry(g)
      const edges = new THREE.LineSegments(e, edgeMaterial)
      mesh.add(edges)
      mesh.position.setZ(0 - doyohHeight / 2)
      mesh.rotateX(Math.PI / 2)
      mesh.rotateY(Math.PI / 4)
      doyoh.add(mesh)
    }
    // The rice-straw bales (tawara (俵)) which form the ring are one third standard
    // size and are partially buried in the clay of the dohyō.
    // Four of the tawara are placed slightly outside the line of the circle at the
    // four cardinal directions, these are called privileged bales (tokudawara).

    // Experimenting with fancy tawara extrusions but torus sections are easier
    // to make (see below)
    if (this.tryFancyTawara) {
      const shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.arc(1, 1, 1, 0, Math.PI)
      const g = new THREE.ExtrudeGeometry(shape, {
        steps: 3,
        depth: 5,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelOffset: 0,
        bevelSegments: 2
      })
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
      const mesh = new THREE.Mesh(g, material)
      // const e = new THREE.EdgesGeometry(g)
      // const edges = new THREE.LineSegments(e, edgeMaterial)
      // mesh.add(edges)
      mesh.rotateX(Math.PI / 2)
      doyoh.add(mesh)
    }
    // try a simple torus geometry for the tawara and tokudawara
    {
      const tokudawaraSegment = Math.PI / 8
      const tawara = new THREE.TorusGeometry(ringRadius, tawaraThickRadius, 8, 16, (Math.PI / 2) - tokudawaraSegment)
      const tokudawara = new THREE.TorusGeometry(ringRadius + (tawaraThickRadius * 3), tawaraThickRadius, 8, 4, tokudawaraSegment)
      const tawaraBorder = new THREE.CylinderGeometry(tawaraThickRadius, tawaraThickRadius, 5, 8, 8, false)
      const material = new THREE.MeshBasicMaterial({ color: colours.gimme('sand yellow'), wireframe: true })
      for (let i = 0; i < 4; i++) {
        const mesh = new THREE.Mesh(tawara, material)
        mesh.rotateZ((i * Math.PI / 2) + (tokudawaraSegment / 2))
        doyoh.add(mesh)
        const mesh2 = new THREE.Mesh(tokudawara, material)
        mesh2.rotateZ((i * Math.PI / 2) - (tokudawaraSegment / 2))
        doyoh.add(mesh2)
        // border
        {
          const tawaraBorderOffset = 3.1
          const mesh3 = new THREE.Mesh(tawaraBorder, material)
          const mul = Math.floor(i / 2) ? 1 : -1
          const x = (i % 2) ? 0 : mul * tawaraBorderOffset
          const y = (i % 2) ? mul * tawaraBorderOffset : 0
          mesh3.position.setX(x)
          mesh3.position.setY(y)
          mesh3.rotateZ(i * Math.PI / 2)
          doyoh.add(mesh3)
        }
      }
    }
  }
}
