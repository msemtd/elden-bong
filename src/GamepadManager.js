import $ from 'jquery'
import { SVG } from '@svgdotjs/svg.js'

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
const ps5Buttons = [
  'btnCross', 'btnCircle', 'btnSquare', 'btnTriangle',
  'btnL1', 'btnR1', 'btnL2', 'btnR2',
  'btnShare', 'btnMenu', 'stickLeft', 'stickRight',
  'dPadUp', 'dPadDown', 'dPadLeft', 'dPadRight',
  'btnPs', 'touchPad']
const ps5svg = `
<g id="controller" transform="translate(0,-100)">
  <rect id="btnL2" class="btn"
    width="15.114473" height="7"
    x="22.310383" y="161.55946" rx="1" ry="1"
    transform="rotate(-7.6767415)" />
  <rect id="btnR2" class="btn"
    width="15.114473" height="7"
    x="-175.65126" y="134.87582" rx="1" ry="1"
    transform="matrix(-0.99103751,-0.1335839,-0.1335839,0.99103751,0,0)" />
  <rect id="btnR1" class="btn"
    width="15.114473" height="7"
    x="-175.33888" y="143.51978" rx="1" ry="1"
    transform="matrix(-0.99103751,-0.1335839,-0.1335839,0.99103751,0,0)" />
  <rect id="btnL1" class="btn"
    width="15.114473" height="7"
    x="22.622749" y="170.20341" rx="1" ry="1"
    transform="rotate(-7.6767415)" />
  <path id="outline"
    style="opacity:1;fill:#ffffff;stroke:#000000;stroke-width:0.944882"
    d="m 377.48438,622.85547 -209.38477,17.77344 c -8.34542,0.70836 -16.5957,18.07226 -16.5957,18.07226 0,0 -40.0375,89.23309 -36.1875,135.97852 2.42737,29.47234 16.00545,59.56088 36.53515,80.8457 13.07336,13.55426 32.00601,28.03051 50.60938,25.10742 26.49746,-4.16341 27.26162,-51.92437 57.64062,-56.14648 9.80568,-1.36279 51.23612,2.15155 117.38282,2.21289 66.14669,-0.0613 107.57713,-3.57568 117.38281,-2.21289 30.37901,4.22211 31.14315,51.98307 57.64062,56.14648 18.60337,2.92309 37.53599,-11.55316 50.60938,-25.10742 20.52967,-21.28482 34.10779,-51.37336 36.53515,-80.8457 3.84998,-46.74543 -36.1875,-135.97852 -36.1875,-135.97852 0,0 -8.25028,-17.3639 -16.5957,-18.07226 z"
    transform="scale(0.26458333)" />
  <rect id="touchPad" class="btn"
    width="50" height="24.999998"
    x="74.875961" y="167.92075" rx="3.9999974" ry="3.9999971" />
  <rect id="btnMic" class="btn"
    width="3" height="7" x="217.78883" y="-103.37596" rx="1" ry="1"
    transform="rotate(90)" />
  <circle id="btnPs" class="btn"
    cx="99.875961" cy="209.71017" r="5" />
  <circle id="stickLeftOuter" class="btn"
    cx="72.094711" cy="209.71017" r="11.908247" />
  <circle id="stickLeft" class="btn"
    cx="72.094711" cy="209.71017" r="6.243484" />
  <path id="dPadUp" class="btn"
    d="m 49.372559,177.53327 v 1.7109 3.43617 l 3.436177,3.43618 3.436178,-3.43618 v -3.43617 -1.7109 z" />
  <path id="dPadDown" class="btn"
    d="m 49.372559,196.24999 v -1.7109 -3.43618 l 3.436177,-3.43618 3.436178,3.43618 v 3.43618 1.7109 z" />
  <path id="dPadRight" class="btn"
    d="M 62.167098,183.45545 H 60.456197 57.02002 l -3.436173,3.43618 3.436173,3.43617 h 3.436177 1.710901 z" />
  <path id="dPadLeft" class="btn"
    d="m 43.450375,183.45545 h 1.710901 3.436177 l 3.436177,3.43618 -3.436177,3.43617 h -3.436177 -1.710901 z" />
  <rect id="btnShare" class="btn"
    width="3" height="7" x="68.875961" y="170.7749" rx="1" ry="1" />
  <rect id="btnMenu" class="btn"
    width="3" height="7" x="127.87597" y="170.7749" rx="1" ry="1" />
  <circle id="btnTriangle" class="btn"
    cx="145.98482" cy="180.84035" r="4.4487848" />
  <circle id="btnCross" class="btn"
    cx="145.98482" cy="198.6355" r="4.4487848" />
  <circle id="btnCircle" class="btn"
    cx="154.8824" cy="189.73793" r="4.4487848" />
  <circle id="btnSquare" class="btn"
    cx="137.08725" cy="189.73793" r="4.4487848" />
  <circle id="stickRightOuter" class="btn"
    cx="127.65721" cy="209.71017" r="11.908247" />
  <circle id="stickRight" class="btn"
    cx="127.65721" cy="209.71017" r="6.243484" />
</g>
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
  constructor (screen) {
    this.screen = screen
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
      axisDeadZone: 0.09,
      axisDeltaFixed: 8,
      axisDeltaMultiplier: 2,
    }

    window.addEventListener('gamepadconnected', this.gamepadConnected.bind(this))
    window.addEventListener('gamepaddisconnected', this.gamepadDisconnected.bind(this))
    // this.scanGamepads()
    this.setupInProgress = setInterval(() => {
      console.log('gamepad setup attempt: 400ms repeat')
      if (this.screen?.camera) {
        clearInterval(this.setupInProgress)
        this.setupInProgress = false
        this.screen.addMixer?.('gamepads', this.procInputs.bind(this))
      }
    }, 400)
    $('<div id="gamePad"/>').appendTo('body')
    // eslint-disable-next-line new-cap
    const draw = SVG().addTo('#gamePad').size(240, 150)
    draw.svg(ps5svg).scale(1.5).translate(80)
    this.draw = draw
    this.svgButtons = []
  }

  dispose () {
    window.removeEventListener('gamepadconnected', this.gamepadConnected.bind(this))
    window.removeEventListener('gamepaddisconnected', this.gamepadDisconnected.bind(this))
  }

  gamepadConnected (ev) {
    const gamepad = ev.gamepad
    this.controllers[gamepad.index] = gamepad
    console.log('gamepadConnected', gamepad)
    // map buttons to svg
    if (this.draw) {
      ps5Buttons.forEach((n, i) => {
        this.svgButtons[i] = this.draw.findOne(`#${n}`)
      })
    }
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
      pad.buttons.forEach((v, i) => {
        if (v.pressed) {
          this.svgButtons[i].addClass('btnPushed')
        } else {
          this.svgButtons[i].removeClass('btnPushed')
        }
      })
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
      this.screen.onKeyHold?.({ deltaTime: c.axisDeltaFixed + (amt * c.axisDeltaMultiplier) }, (axisVal < 0) ? negKey : posKey)
    }
  }

  scanGamepads () {
    const gamepads = navigator.getGamepads()
    for (const pad of gamepads) {
      if (pad) {
        this.controllers[pad.index] = pad
        console.log(pad)
      }
    }
    window.requestAnimationFrame(this.scanGamepads.bind(this))
  }
}
export { GamepadManager, standardGamepadDescription }
