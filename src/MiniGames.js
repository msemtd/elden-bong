// eslint-disable-next-line no-unused-vars
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { CardsDude } from './CardsDude/CardsDude'
import { MoanSwooper } from './MoanSwooper/MoanSwooper'
import { Screen } from './Screen'
/**
 * Allow the mini-games wrapper provide a games room
 *
 * For the games to "play nicely" with our "component system" here...
 * - be a THREE.EventDispatcher
 * - graphically, reside entirely with a THREE.Group
 * - accept a parent as a constructor arg
 * - have a minimal constructor but listen to parent!
 * - wait until parent emits the 'ready' event...
 * - then make use of the resources passed in: -
 *   - gui {GUI}
 *   - group {THREE.Group}
 *   - redrawFunc
 *   - screen {Screen}
 * - add your own lil-gui folder to gui
 * - add your group to the given group
 * - save the redraw request function
 * - hook into the screen features: animation mixers, controls, mouse clicks, selection, ray-tracing, etc.
 */
class MiniGames extends THREE.EventDispatcher {
  constructor (parent) {
    super()
    console.assert(parent instanceof THREE.EventDispatcher)
    this.gui = null
    this.group = new THREE.Group()
    this.group.name = 'Mini-Games'
    this.games = {
      cardsDude: new CardsDude(this)
    }
    parent.addEventListener('ready', (ev) => {
      // Kids, do as I do!
      console.assert(ev.gui instanceof GUI)
      console.assert(ev.group instanceof THREE.Object3D)
      console.assert(typeof ev.redrawFunc === 'function')
      console.assert(ev.screen instanceof Screen)
      this.redraw = ev.redrawFunc
      this.screen = ev.screen
      ev.group.add(this.group)
      const f = this.gui = ev.gui.addFolder('Mini Games Yo!')
      f.add(this, 'deactivateAll')
      // this.addMoanSwooper(c)
      this.dispatchEvent({ type: 'ready', gui: this.gui, group: this.group, redrawFunc: this.redraw, screen: this.screen })
    })
  }

  deactivateAll () {
    // visit each game and get it to pause/hide itself
    this.games.cardsDude.deactivate()
    this.redraw()
  }

  // TODO - complete the transplant of Moan Swooper
  addMoanSwooper (c) {
    this.moanSwooper = new MoanSwooper()
    // we control the group - it controls its own group contents
    const g = new THREE.Group()
    g.name = 'MoanSwooper'
    g.position.set(2, -1, 1)
    g.scale.set(0.5, 0.5, 0.5)
    this.moanSwooper.group = g
    this.moanSwooper.resetThreeGroup()
    // s.addMixer('MoanSwooper', (_delta) => {
    //   return moanSwooper.update()
    // })
    c.scene.add(g)
    this.redraw()
    this.moanSwooper.addEventListener('moanState', this.onMoanSwooperGameState.bind(this))
    this.moanSwooper.addEventListener('redraw', this.redraw.bind(this))
  }

  onMoanSwooperGameState (ev) {
    console.warn(ev)
    if (ev.value === 'BANG_GAME_OVER') {
      this.youDiedWithSound()
    }
  }
}

export { MiniGames }
