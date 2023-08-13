const standardGamepadDescription = `
Button/Axis Location
buttons[0] Bottom button in right cluster
buttons[1] Right button in right cluster
buttons[2] Left button in right cluster
buttons[3] Top button in right cluster
buttons[4] Top left front button
buttons[5] Top right front button
buttons[6] Bottom left front button
buttons[7] Bottom right front button
buttons[8] Left button in center cluster
buttons[9] Right button in center cluster
buttons[10] Left stick pressed button
buttons[11] Right stick pressed button
buttons[12] Top button in left cluster
buttons[13] Bottom button in left cluster
buttons[14] Left button in left cluster
buttons[15] Right button in left cluster
buttons[16] Center button in center cluster
axes[0] Horizontal axis for left stick (negative left/positive right)
axes[1] Vertical axis for left stick (negative up/positive down)
axes[2] Horizontal axis for right stick (negative left/positive right)
axes[3] Vertical axis for right stick (negative up/positive down)
`

class GamepadManager {
  // mostly about mapping functions and finding suitable defaults
  // the APIs involved
  // HID and gamepad Web APIs
  // https://web.dev/hid/
  // https://w3c.github.io/gamepad/#getgamepads-method
  // https://end3r.github.io/Gamepad-API-Content-Kit/
  // https://gamepad-tester.com/for-developers
  // https://github.com/luser/gamepadtest
  //
  constructor (canvas) {
    this.canvas = canvas
    this.controllers = {}
    this.chosenIndex = 0
    this.config = {
      axes: [
        { neg: 'KeyA', pos: 'KeyD' },
        { neg: 'KeyW', pos: 'KeyS' },
        { neg: 'KeyQ', pos: 'KeyE' },
        { neg: 'ArrowDown', pos: 'ArrowUp' },
      ],
      buttons: [

      ],
      axisDeadZone: 0.04,
      axisDeltaFixed: 8,
      axisDeltaMultiplier: 2,
    }

    window.addEventListener('gamepadconnected', this.gamepadConnected.bind(this))
    window.addEventListener('gamepaddisconnected', this.gamepadDisconnected.bind(this))
    // this.scanGamepads()
    this.setupInProgress = setInterval(() => {
      console.log('gamepad setup attempt: 400ms repeat')
      if (this.canvas?.camera) {
        clearInterval(this.setupInProgress)
        this.setupInProgress = false
        this.canvas.addMixer?.('gamepads', this.procInputs.bind(this))
      }
    }, 400)
  }

  dispose () {
    window.removeEventListener('gamepadconnected', this.gamepadConnected.bind(this))
    window.removeEventListener('gamepaddisconnected', this.gamepadDisconnected.bind(this))
  }

  gamepadConnected (ev) {
    const gamepad = ev.gamepad
    this.controllers[gamepad.index] = gamepad
    console.log('gamepadConnected', gamepad)
  }

  gamepadDisconnected (ev) {
    const gamepad = ev.gamepad
    delete this.controllers[gamepad.index]
    console.log('gamepadDisconnected', gamepad)
  }

  procInputs () {
    const redraw = false
    const gamepads = navigator.getGamepads()
    for (const pad of gamepads) {
      if (!pad) { continue }
      if (!pad.connected) { continue }
      if (!this.controllers[pad.index]) {
        console.warn('why is this pad not in our set of controllers?')
        continue
      }
      if (this.setupInProgress) { continue }
      // TODO filter for allowed pads
      // connected === true
      // mapping === "standard"
      // PS5 Vendor: 054c Product: 0ce6
      // get button state changes here
      if (pad.buttons[0].pressed) {
        // PS5 cross button
      }
      const c = this.config
      pad.axes.forEach((v, i) => {
        // if the axis is configured...
        const k = c.axes[i]
        if (k) {
          this.axisToKeyHold(v, k.neg, k.pos, c)
        }
      })
      // this.axisToKeyHold(pad.axes[0], 'KeyA', 'KeyD', this.config)
      // this.axisToKeyHold(pad.axes[1], 'KeyW', 'KeyS', this.config)
      // this.axisToKeyHold(pad.axes[2], 'KeyQ', 'KeyE', this.config)
      // this.axisToKeyHold(pad.axes[3], 'ArrowDown', 'ArrowUp', this.config)
    }
    return redraw
  }

  axisToKeyHold (axisVal, negKey, posKey, c) {
    const amt = Math.abs(axisVal) - c.axisDeadZone
    if (amt > 0) {
      this.canvas.onKeyHold?.({ deltaTime: c.axisDeltaFixed + (amt * c.axisDeltaMultiplier) }, (axisVal < 0) ? negKey : posKey)
    }
  }

  scanGamepads () {
    const gamepads = navigator.getGamepads()
    for (const pad of gamepads) {
      if (pad) {
        this.controllers[pad.index] = pad
        // todo; simple demo of displaying pad.axes and pad.buttons
        console.log(pad)
      }
    }
    window.requestAnimationFrame(this.scanGamepads.bind(this))
  }
}
export { GamepadManager, standardGamepadDescription }
