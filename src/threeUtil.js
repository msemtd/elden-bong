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

/**
 * Rotates an object using a point and axis of rotation
 * @param {THREE.Object3D} obj - your object (THREE.Object3D or derived)
 * @param {THREE.Vector3} point - the point of rotation (THREE.Vector3)
 * @param {THREE.Vector3} axis - the axis of rotation (normalized THREE.Vector3)
 * @param {number} theta - radian value of rotation
 * @param {boolean} pointIsWorld - boolean indicating the point is in world coordinates (default = false)
 */
export function rotateAboutPoint (obj, point, axis, theta, pointIsWorld = false) {
  if (pointIsWorld) {
    obj.parent.localToWorld(obj.position) // compensate for world coordinate
  }
  obj.position.sub(point) // remove the offset
  obj.position.applyAxisAngle(axis, theta) // rotate the POSITION
  obj.position.add(point) // re-add the offset
  if (pointIsWorld) {
    obj.parent.worldToLocal(obj.position) // undo world coordinates compensation
  }
  obj.rotateOnAxis(axis, theta) // rotate the OBJECT
}
