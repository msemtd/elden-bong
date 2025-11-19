import { Howl } from 'howler'

import defenderSwarmers from '../sounds/Swarmers.mp3'
import defenderBaiterBusted from '../sounds/Baiter busted.mp3'
import defenderDestroyed from '../sounds/Destroyed.mp3'
import defenderEnemyFire from '../sounds/Enemy Fire.mp3'
import defenderEnemyForm from '../sounds/Enemy Form.mp3'
import defenderExtraLife from '../sounds/Extra Life.mp3'
import defenderHumanoidCapture from '../sounds/Humanoid Capture.mp3'
import defenderHumanoidFall from '../sounds/Humanoid Fall.mp3'
import defenderHumanoidSave from '../sounds/Humanoid Save.mp3'
import defenderLanderDestroyed from '../sounds/Lander Destroyed.mp3'
import defenderMachineStartup from '../sounds/Machine Startup.mp3'
import defenderMutant from '../sounds/Mutant.mp3'
import defenderPlayerFire from '../sounds/Player Fire.mp3'
import defenderPlayerStart from '../sounds/Player Start.mp3'
import defenderPod from '../sounds/Pod.mp3'

let instance = null

export class SoundBoard {
  constructor () {
    this.internalSounds = {
      defenderSwarmers,
      defenderBaiterBusted,
      defenderDestroyed,
      defenderEnemyFire,
      defenderEnemyForm,
      defenderExtraLife,
      defenderHumanoidCapture,
      defenderHumanoidFall,
      defenderHumanoidSave,
      defenderLanderDestroyed,
      defenderMachineStartup,
      defenderMutant,
      defenderPlayerFire,
      defenderPlayerStart,
      defenderPod,
    }
  }

  static getInstance () {
    if (!instance) {
      instance = new SoundBoard()
    }
    return instance
  }

  playThis (src) {
    const sound = new Howl({ src: [src] })
    sound.play()
  }

  play (soundName) {
    const src = this.internalSounds[soundName]
    if (src) {
      this.playThis(src)
    } else {
      console.warn(`SoundBoard: no sound found for name ${soundName}`)
    }
  }

  getNames () {
    return Object.keys(this.internalSounds)
  }
}
