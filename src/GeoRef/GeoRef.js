import * as THREE from 'three'

export class GeoRef {
  constructor (ca, grp) {
    const grp1 = new THREE.Group()
    grp1.name = 'targets'
    const grp2 = new THREE.Group()
    grp2.name = 'positions'
    grp.add(grp1, grp2)
    const g = new THREE.OctahedronGeometry(0.05)
    const mat1 = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, wireframe: true })
    const mat2 = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5, wireframe: true })
    const matLine1 = new THREE.LineBasicMaterial({ color: 0xff0000 })
    const matLine2 = new THREE.LineBasicMaterial({ color: 0xffff00 })
    const pa1 = []
    const pa2 = []

    for (let idx = 0; idx < ca.length; idx++) {
      const element = ca[idx]
      const target = new THREE.Vector3().fromArray(element.target)
      const position = new THREE.Vector3().fromArray(element.position)
      pa1.push(target)
      pa2.push(position)
      const m1 = new THREE.Mesh(g, mat1)
      m1.position.copy(target)
      m1.name = `target-${idx}`
      grp1.add(m1)
      const m2 = new THREE.Mesh(g, mat2)
      m2.position.copy(position)
      m2.name = `position-${idx}`
      grp2.add(m2)
    }
    const bg1 = new THREE.BufferGeometry().setFromPoints(pa1)
    const bg2 = new THREE.BufferGeometry().setFromPoints(pa2)
    const line1 = new THREE.Line(bg1, matLine1)
    const line2 = new THREE.Line(bg2, matLine2)
    grp1.add(line1)
    grp2.add(line2)
  }
}
