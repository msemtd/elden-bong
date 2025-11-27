import * as THREE from 'three'

export function generalObj3dClean (p, o) {
  if (!o) { return }
  if (o.geometry && o.geometry.dispose instanceof Function) {
    o.geometry.dispose()
  }
  if (o.material) {
    if (o.material.dispose instanceof Function) {
      o.material.dispose()
    }
  }
  if (p && p.children && o.parent === p && o.parent.remove instanceof Function) {
    o.parent.remove(o)
  }
}
/**
 * Helper function to traverse a tree depth first in reverse order (so that is is safe to remove an element from the nest within the callback)
 *
 * @param {object} p a parent object with a children array
 * @param {object} o an object that is a child of a parent(!)
 * @param {Function} cb a callback to do whatever
 */
export function depthFirstReverseTraverse (p, o, cb) {
  if (o?.children instanceof Array) {
    const len = o.children.length
    for (let i = len - 1; i >= 0; i--) {
      depthFirstReverseTraverse(o, o.children[i], cb)
    }
  }
  cb(p, o)
}

export function addGrid (scene, visible) {
  const width = 100
  const gridPos = new THREE.Vector3(0, 0, -0.01)
  const gridVisible = !!visible

  const grid = new THREE.GridHelper(width, width)
  grid.geometry.rotateX(Math.PI / 2)

  grid.position.copy(gridPos)
  grid.name = 'grid'
  grid.visible = gridVisible
  scene.add(grid)
}
