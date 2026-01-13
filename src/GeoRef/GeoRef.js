import * as THREE from 'three'

export class GeoRef {
  constructor (ca, grp) {
    const tg = new THREE.Group()
    tg.name = 't'
    const pg = new THREE.Group()
    pg.name = 'p'
    grp.add(tg, pg)
    const g = new THREE.OctahedronGeometry(0.05)
    const mat1 = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, wireframe: true })
    const mat2 = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5, wireframe: true })
    const matLine1 = new THREE.LineBasicMaterial({ color: 0xff0000 })
    const matLine2 = new THREE.LineBasicMaterial({ color: 0xffff00 })
    const paT = []
    const paP = []

    for (let idx = 0; idx < ca.length; idx++) {
      const element = ca[idx]
      const t = new THREE.Vector3().fromArray(element.t)
      const p = new THREE.Vector3().fromArray(element.p)
      paT.push(t)
      paP.push(p)
      const m1 = new THREE.Mesh(g, mat1)
      m1.position.copy(t)
      m1.name = `target-${idx}`
      tg.add(m1)
      const m2 = new THREE.Mesh(g, mat2)
      m2.position.copy(p)
      m2.name = `position-${idx}`
      pg.add(m2)
    }
    const bg1 = new THREE.BufferGeometry().setFromPoints(paT)
    const bg2 = new THREE.BufferGeometry().setFromPoints(paP)
    const line1 = new THREE.Line(bg1, matLine1)
    const line2 = new THREE.Line(bg2, matLine2)
    tg.add(line1)
    pg.add(line2)
    this.paT = paT
    this.paP = paP
    this.tg = tg
    this.pg = pg
  }
}
