// Controls.js
// Everything to do with user input
// Define a set of abstract actions
// Enable mapping of actions to keys and buttons

// Bring in GamepadManager

// user can use whatever they want
// - controls on different platforms - https://vulkk.com/2022/02/26/elden-ring-pc-and-console-controls-guide-and-lists/

// setting keys and gamepad buttons
// show little keyboard like Forsa
// keys bound to canvas or to document?

// Third-person camera
// https://www.youtube.com/watch?v=UuNPHOJ_V5o

// User controls aren't just keys or mouse - they're often combinations
// So shift hold and scroll wheel
// press and release is required for map or menu but button press for jump and double jump requires another press but not a second release!

const language = 0
const moveForward = 1
const moveBackward = 2
const moveLeft = 3
const moveRight = 4
//
const jump = 5
const dash = 6
const useItem = 7
const eventAction = 8
//
const switchItem = 9
const switchSpell = 10
const switchLeftArms = 11
const switchRightArms = 12
//
const map = 13
const crouch = 14
const shift = 15
const menu = 16
const attack = 17
const strongAttack = 18
const guard = 19
const skill = 20

export class UserControls {
  // moveForward moveBackward moveLeft moveRight
  // jump, crouch, dash, use
  // map
  constructor (screen) {
    this.descriptionEn = []
    {
      const d = this.descriptionEn
      d[language] = 'English'
      d[moveForward] = 'Move Forwards'
      d[moveBackward] = 'Move Backwards'
      d[moveLeft] = 'Move Left'
      d[moveRight] = 'Right'
      d[jump] = 'Jump'
      d[dash] = 'Backstep / Dodge Roll / Dash'
      d[useItem] = 'Use Item'
      d[eventAction] = 'Event Action (Talk, Examine, Open etc)'
      d[switchItem] = 'Switch Item'
      d[switchSpell] = 'Switch Sorcery / Incantation'
      d[switchLeftArms] = 'Switch Left-Hand Armament'
      d[switchRightArms] = 'Switch Right-Hand Armament'
      d[map] = 'Map'
      d[menu] = 'Menu'
      d[crouch] = 'Crouch / Stand Up / Dismount'
      d[shift] = 'Modifier'
      d[attack] = 'Attack (RH &amp; 2H Armament)'
      d[strongAttack] = 'Strong Attack (LH Armament)'
      d[guard] = 'Guard'
      d[skill] = 'Skill'
    }
    // buttons/keys pressed
    this.pressed = this.descriptionEn.map(x => 0)
    this.defaultKeys = ['default keys']
    {
      const d = this.defaultKeys
      d[moveForward] = 'KeyW'
      d[moveBackward] = 'KeyS'
      d[moveLeft] = 'KeyA'
      d[moveRight] = 'KeyD'
      d[jump] = 'KeyF'
      d[dash] = 'Space'
      d[useItem] = 'KeyR'
      d[eventAction] = 'KeyE'
      d[switchItem] = 'ArrowDown'
      d[switchSpell] = 'ArrowUp'
      d[switchLeftArms] = 'ArrowLeft'
      d[switchRightArms] = 'ArrowRight'
      d[map] = 'KeyG'
      d[crouch] = 'KeyX'
      d[shift] = 'Shift'
    }

    const element = document
    element.addEventListener('keydown', (e) => this._onKeyDown(e), false)
    element.addEventListener('keyup', (e) => this._onKeyUp(e), false)
  }

  _onKeyDown (event) {
    const i = this.defaultKeys.indexOf(event.code)
    if (i === -1) {
      return
    }
    this.pressed[i] = 1
  }

  _onKeyUp (event) {
    const i = this.defaultKeys.indexOf(event.code)
    if (i === -1) {
      return
    }
    this.pressed[i] = 0
  }

  characterActOnInputs (character, delta) {
    // only movement to begin with
    if (this.pressed[moveForward]) {
      // not very smart!
      character.position.y += 0.5
    }
  }
}
