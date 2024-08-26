import * as THREE from 'three'
import CameraControls from 'camera-controls'

CameraControls.install({ THREE })

class Screen extends THREE.EventDispatcher {
  constructor (container) {
    // resizes to fill container
    super()
    if (THREE.REVISION >= 149) {
      THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1)
    } else {
      THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1)
    }
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1)
    const canvas = this.renderer.domElement
    canvas.id = 'screenCanvas'
    this.container.appendChild(canvas)
    this.forceRedraw = false
    this.resizeRequired = true
    this.debugResize = false
    this.rendererViewportGeom = new THREE.Vector4()
    this.camera = null
    this.cameraControls = null
    this.camInfo = {
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      count: 0,
    }
    this.doResize()
    new ResizeObserver(_ex => {
      this.resizeRequired = true
    }).observe(this.container)
    this.clock = new THREE.Clock()
    this.scene = new THREE.Scene()
    this.mixers = null
    this.cameraSetup()
    this.play()
  }

  play () {
    const self = this
    this.resizeRequired = true
    this.forceRedraw = true
    this.renderer.setAnimationLoop(() => {
      self.render()
    })
  }

  stop () {
    this.renderer.setAnimationLoop(null)
  }

  doResize () {
    const dpr = this.renderer.getPixelRatio()
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    const aspectRatio = width / height
    if (this.debugResize) { console.log(`RESIZE: pr=${dpr} cw=${width} ch=${height} ar=${aspectRatio.toFixed(2)}`) }
    // fit to parent size
    this.renderer.setSize((width | 0), (height | 0), true)
    this.renderer.getViewport(this.rendererViewportGeom)
    this.cameraFit(aspectRatio)
  }

  render () {
    // there can be various sources of update that will require a render
    let renderRequired = this.forceRedraw
    this.forceRedraw = false
    const delta = this.clock.getDelta()
    if (this.resizeRequired) {
      this.doResize()
      this.resizeRequired = false
      renderRequired = true
    }
    // TODO any pluggable animations?
    // Update any animation/raycaster mixers: array of mixers that return "didUpdate"
    // indicating should render detected alterations to the (current) scene
    if (this.mixers) {
      for (const mixer of this.mixers) {
        renderRequired |= mixer.update(delta)
      }
    }
    if (this.cameraControls.update(delta)) {
      renderRequired = true
      this.updateCamInfo()
    }
    if (renderRequired) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  updateCamInfo () {
    this.cameraControls.getPosition(this.camInfo.position)
    this.cameraControls.getTarget(this.camInfo.target)
    this.camInfo.count++
  }

  cameraSetup (opt, stateToLoad, userOptions) {
    if (this.cameraControls) {
      this.cameraControls.dispose()
      this.cameraControls = null
    }
    this.camera = new THREE.PerspectiveCamera()
    this.camera.position.y = -4
    this.camera.position.x = 4
    this.camera.position.z = 10
    this.doResize()
    const cc = new CameraControls(this.camera, this.renderer.domElement)
    Object.assign(cc, {
      dollyToCursor: true,
      infinityDolly: true,
      minDistance: 0.5,
      maxDistance: 5000,
    })
    cc.updateCameraUp()
    this.cameraControls = cc
    cc.saveState()
    // this.emit('camera-changed', this.camera)
    this.forceRedraw = true
  }

  cameraFit (aspectRatio) {
    if (this.camera) {
      if (this.camera.type === 'PerspectiveCamera') {
        this.camera.aspect = aspectRatio
      } if (this.camera.type === 'OrthographicCamera') {
        const frustumSize = 30
        this.camera.left = frustumSize * aspectRatio / -2
        this.camera.right = frustumSize * aspectRatio / 2
        this.camera.top = frustumSize / 2
        this.camera.bottom = frustumSize / -2
      }
      this.camera.updateProjectionMatrix()
    }
  }

  onKeyHold (event, code) {
    const cc = this.cameraControls
    if (!cc.enabled || this.cameraKeysDisabled || this.camera.type === 'OrthographicCamera') { return }
    switch (code) {
      case 'KeyW': { return cc.forward(0.01 * event.deltaTime, true) }
      case 'KeyA': { return cc.truck(-0.01 * event.deltaTime, 0, true) }
      case 'KeyS': { return cc.forward(-0.01 * event.deltaTime, true) }
      case 'KeyD': { return cc.truck(0.01 * event.deltaTime, 0, true) }
      case 'ArrowLeft': { return cc.rotate(-0.1 * THREE.MathUtils.DEG2RAD * event.deltaTime, 0, true) }
      case 'ArrowUp': { return cc.rotate(0, -0.05 * THREE.MathUtils.DEG2RAD * event.deltaTime, true) }
      case 'ArrowRight': { return cc.rotate(0.1 * THREE.MathUtils.DEG2RAD * event.deltaTime, 0, true) }
      case 'ArrowDown': { return cc.rotate(0, 0.05 * THREE.MathUtils.DEG2RAD * event.deltaTime, true) }
      case 'KeyR': { return cc.truck(0, -0.005 * event.deltaTime, true) }
      case 'KeyF': { return cc.truck(0, 0.005 * event.deltaTime, true) }
      case 'KeyQ': { return this.rotateCameraThetaInPlace(cc, 0.1 * THREE.MathUtils.DEG2RAD * event.deltaTime, 1.0, 0.5, true) }
      case 'KeyE': { return this.rotateCameraThetaInPlace(cc, -0.1 * THREE.MathUtils.DEG2RAD * event.deltaTime, 1.0, 0.5, true) }
      case 'KeyT': { return cc.reset(true) }
    }
  }

  // cSpell:ignore targ, posn, dirn

  /**
   * Rotate camera around the given axis on the spot by given angle and move the orbit target to the given fixed distance away.
   *
   * @param {CameraControls} cc - camera controls object
   * @param {number} axis - axis to rotate around (0, 1 or 2)
   * @param {number} angle - angle to rotate about the vertical axis (Y in THREE world coordinates)
   * @param {number} fixedTargDist - distance away from position to move the notional orbit target
   * @param {number} _backStepHead - TODO neatly rotate position in opposite direction but by a lesser amount
   * @param {boolean} smoothlyDoesIt - smooth transition
   */
  rotateCameraInPlace (cc, axis, angle, fixedTargDist, _backStepHead, smoothlyDoesIt) {
    const eulerAxis = [0, 0, 0]
    eulerAxis[axis] = angle
    const rotateAboutY = new THREE.Euler(eulerAxis[0], eulerAxis[1], eulerAxis[2])
    const posn = cc.getPosition()
    const targ = cc.getTarget()
    const dirn = targ.clone().sub(posn).normalize().multiplyScalar(fixedTargDist)
    dirn.applyEuler(rotateAboutY)
    const newTarg = dirn.clone().add(posn)
    cc.setTarget(newTarg.x, newTarg.y, newTarg.z, smoothlyDoesIt)
  }

  /**
   * Rotate camera horizontally (yaw) on the spot by given angle and move the orbit target to the given fixed distance away.
   *
   * @param {CameraControls} cc - camera controls object
   * @param {number} angle - angle to rotate about the vertical axis (Y in THREE world coordinates)
   * @param {number} fixedTargDist - distance away from position to move the notional orbit target
   * @param {number} _backStepHead - TODO neatly rotate position in opposite direction but by a lesser amount
   * @param {boolean} smoothlyDoesIt - smooth transition
   */
  rotateCameraThetaInPlace (cc, angle, fixedTargDist, _backStepHead, smoothlyDoesIt) {
    this.rotateCameraInPlace(cc, 1, angle, fixedTargDist, _backStepHead, smoothlyDoesIt)
  }

  /**
   * Rotate camera vertically (tilt) on the spot by given angle and move the orbit target to the given fixed distance away.
   *
   * @param {CameraControls} cc - camera controls object
   * @param {number} angle - angle to rotate about the vertical axis (Y in THREE world coordinates)
   * @param {number} fixedTargDist - distance away from position to move the notional orbit target
   * @param {number} _backStepHead - TODO neatly rotate position in opposite direction but by a lesser amount
   * @param {boolean} smoothlyDoesIt - smooth transition
   */
  rotateCameraPhiInPlace (cc, angle, fixedTargDist, _backStepHead, smoothlyDoesIt) {
    this.rotateCameraInPlace(cc, 2, angle, fixedTargDist, _backStepHead, smoothlyDoesIt)
  }

  addMixer (name, method, binder) {
    if (!this.mixers) { this.mixers = [] }
    this.mixers.push({
      name,
      update: binder ? method.bind(binder) : method
    })
  }

  removeMixer (name) {
    if (this.mixers) {
      this.mixers = this.mixers.filter(x => x.name !== name)
    }
    if (this.mixers && this.mixers.length === 0) {
      this.mixers = null
    }
  }
}
export { Screen }
