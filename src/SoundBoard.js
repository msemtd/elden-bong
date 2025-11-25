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
import percussionSprite from '../sounds/percussion-sprite.ogg'

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
    this.howls = {
      percussion: new Howl({
        src: [percussionSprite],
        // cspell:ignore ashboy gewa thump thumpsik chik bop pop pizzabox folley lunarlander claves fingersnap perc spongey kickhat sadiquecat
        sprite: {
          'low-thump-bass-boosted': [0, 955.3514739229025],
          'low-thump-short': [2000, 233.62811791383197],
          'low-thump-long-trail': [4000, 1770.929705215419],
          'ashboy34-temple-block-wooden-room': [7000, 1212.3356009070285],
          'ashboy34-temple-block-dirty-verb': [10000, 1786.757369614513],
          'ashboy34-temple-block-lunarlander-1969': [13000, 1205.9863945578222],
          'mouth-k': [16000, 183.33333333333357],
          'mouth-pop': [18000, 316.9614512471668],
          'mouth-bop': [20000, 205.96371882086117],
          'mouth-chik': [22000, 370.22675736961475],
          'finger-snap-1-xy': [24000, 754.1043083900228],
          'finger-snap-2-xy': [26000, 535.1927437641706],
          'finger-snap-3-xy': [28000, 683.1746031746029],
          'pizzabox-hit': [30000, 619.0702947845814],
          'pan-hit': [32000, 3307.142857142857],
          'big-maraca-os-4': [37000, 570.9070294784553],
          'big-maraca-os-1': [39000, 559.0929705215401],
          'gewa-claves-2-os': [41000, 571.0657596371859],
          'gewa-claves-3-os': [43000, 517.7324263038514],
          'gewa-claves-4-os-dry': [45000, 297.4603174603203],
          'gewa-claves-5-os-dry': [47000, 391.5646258503429],
          'gewa-claves-6-os': [49000, 480.38548752834487],
          'gewa-claves-7-os-bouncing': [51000, 621.5419501133752],
          'gewa-claves-os-dry': [53000, 773.356009070298],
          'vocal-soft-thump': [55000, 135.17006802720744],
          'chopped-s-perc': [57000, 196.50793650793474],
          'adult-fingersnap-stereo': [59000, 361.49659863945516],
          'adult-fingersnap': [61000, 367.95918367347014],
          'kid-fingersnap-2': [63000, 500.04535147392204],
          'kid-fingersnap-3': [65000, 805.4195011337839],
          'kid-fingersnap': [67000, 614.0362811791391],
          'rubbery-spongey-kickhat-808485_and_808593': [69000, 286.7800453514775],
          'v-game-folley-808593_and_808485': [71000, 461.0204081632645],
          'kick-bass-808601_and_809153': [73000, 666.485260770969],
        },
      })
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

  getPercussionSpriteNames () {
    return Object.keys(this.howls.percussion._sprite)
  }

  playPercussionSprite (spriteName) {
    const percussionHowl = this.howls.percussion
    if (percussionHowl && percussionHowl._sprite[spriteName]) {
      percussionHowl.play(spriteName)
    } else {
      console.warn(`SoundBoard: no percussion sprite found for name ${spriteName}`)
    }
  }
}
