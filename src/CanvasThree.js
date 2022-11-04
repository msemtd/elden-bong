import * as THREE from 'three'
import CameraControls from 'camera-controls'

CameraControls.install({ THREE })

class CanvasThree {
  constructor (container) {
    // resizes to fill container
    // super()
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1)
    const canvas = this.renderer.domElement
    canvas.id = 'canvasThree'
    this.container.appendChild(canvas)
    this.forceRedraw = false
    this.resizeRequired = true
    this.debugResize = true
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
    // Update any animation/raycasting mixers: array of mixers that return "didUpdate"
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
    const canvas = this.renderer.domElement
    if (this.cameraControls) {
      this.cameraControls.dispose()
      this.cameraControls = null
    }
    this.camera = new THREE.PerspectiveCamera()
    this.camera.position.y = -5
    this.camera.position.x = 2
    this.camera.position.z = 1
    this.doResize()
    const cc = new CameraControls(this.camera, this.renderer.domElement)
    cc.dollyToCursor = true
    cc.updateCameraUp()
    this.cameraControls = cc

    // this.emit('camera-changed', this.camera)
    this.forceRedraw = true
  }

  cameraFit (aspectRatio) {
    if (this.camera) {
      if (this.camera.type === 'PerspectiveCamera') {
        this.camera.aspect = aspectRatio
      } if (this.camera.type === 'OrthographicCamera') {
        // this.camera.left = width / -200
        // this.camera.right = width / 200
        // this.camera.top = height / 200
        // this.camera.bottom = height / -200
      }
      this.camera.updateProjectionMatrix()
    }
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
export { CanvasThree }
