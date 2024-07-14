import * as THREE from 'three'
import { Screen } from './Screen'

/**
 * TODO jsdoc
 */
class Mouse {
  /**
   *  screen :
   * @param screen {Screen}
   */
  constructor (screen) {
    this.screen = screen
    const canvas = screen.renderer.domElement
    canvas.addEventListener('mousedown', this.onDown.bind(this), false)
    canvas.addEventListener('mousemove', this.onMove.bind(this), false)
    canvas.addEventListener('dblclick', this.onDblClick.bind(this), false)
    canvas.addEventListener('click', this.onClick.bind(this), false)
    canvas.addEventListener('contextmenu', this.onClick.bind(this), false)
    this.canvas = canvas
    this.screenPosition = new THREE.Vector2()
    this.doubleClickHandler = null
    this.singleClickHandler = null
  }

  onDown (ev) {
    this.clicker(ev, false)
  }

  onMove (ev) {
    this.positionUpdate(ev)
    ev.preventDefault()
  }

  onClick (ev) {
    // this.clicker(ev, false)
  }

  onDblClick (ev) {
    this.clicker(ev, true)
  }

  positionUpdate (ev) {
    const rect = ev.target.getBoundingClientRect()
    this.screenPosition.x = (ev.clientX - rect.left) / rect.width * 2 - 1
    this.screenPosition.y = -(ev.clientY - rect.top) / rect.height * 2 + 1
  }

  clicker (ev, double) {
    this.positionUpdate(ev)
    this.canvas.focus()
    if (double) {
      this.doubleClickHandler?.(ev, this.screenPosition)
    } else {
      this.singleClickHandler?.(ev, this.screenPosition)
    }
    this.screen.forceRedraw = true
    ev.preventDefault()
  }
}

export { Mouse }
