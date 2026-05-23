import path from 'path-browserify'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { getMainDirs, loadBinaryFile, pickFile } from './HandyApi'
import { MiniGameBase } from './MiniGameBase'
import { Screen } from './Screen'
import { depthFirstReverseTraverse, generalObj3dClean } from './threeUtil'
import { filePathToMine } from './util'

/**
 * Character classes functionality abstracted from bong.js
 * - using built in character models for ease of setup
 * - mapping player character classes to models from
 *   Ultimate Modular Women Pack by Quaternius [CC-BY] via Poly Pizza
 *   https://poly.pizza/bundle/Ultimate-Modular-Women-Pack-aCBDXDdTNN
 *   https://poly.pizza/u/Quaternius
 *   license: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
 *
 * cspell: ignore Quaternius
 * This has a lot of common character model loading functionality so could be
 * used for NPC, enemy, player, etc.
 * - check animations and other features of the model with...
 *   https://github.com/donmccurdy/three-gltf-viewer
 *
 */

const characterMappings = {
  Dork: 'Adventurer.glb',
  Pleb: 'Animated Woman.glb',
  Bozo: 'Animated Woman-nIItLV9nxS.glb',
  Wuss: 'Medieval.glb',
  Goon: 'Punk.glb',
  Geek: 'Sci Fi Character.glb',
  Jock: 'Soldier.glb',
  Suit: 'Suit.glb',
  Jerk: 'Witch.glb',
  Nerd: 'Worker.glb',
}

export class Character extends MiniGameBase {
  static classNames () {
    return Object.keys(characterMappings)
  }

  constructor (parent) {
    super(parent, 'Character')
    this.objName = 'playerCharacter'
    this.characterClass = Character.classNames()[0]
    this.currentAction = '[none]'
    // when we switch characters we want to fix up all the objects
    this.animationMixer = null
    this.animationsMap = null
    this.fadeDuration = 0.25
    this.staticCharacterModelsDir = ''
    // start off with an OrbitControls or go straight to camera-controls
    // how to mesh with the existing camera and controls which is managed by
    // Screen object - just replicate the work in the example
    // in character playing mode we will be following the character
    // The existing modes in bong.js need to be developed
    // we will always need a free-moving mode for exploration
    // anyhow, mini-games can take control anything
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      console.assert(this.screen instanceof Screen)
      const fld = this.gui
      fld.add(this, 'runTest')
      // TODO add the character class and animation testing
      fld.add(this, 'testLoadCharacter')
      fld.add(this, 'deleteCharacter')
      fld.add(this, 'characterClass', Character.classNames()).onChange(v => { this.changeCharacter(v, fld) })
    })
  }

  async runTest () {
    console.log('runTest in character')
    // TODO load the default character - one saved in settings perhaps
    this.activate()
    this.changeCharacter(this.characterClass, this.gui)
  }

  async changeCharacter (v, fld) {
    console.log('character class change: ' + v)
    const glb = characterMappings[v]
    if (!glb) {
      console.warn('no mapping for ' + v)
      return
    }
    if (!this.staticCharacterModelsDir) {
      const mainDirs = await getMainDirs()
      this.staticCharacterModelsDir = path.join(mainDirs.staticDir, 'models', 'character')
    }
    const fp = path.join(this.staticCharacterModelsDir, glb)
    const model = await this.loadCharacter(fp)
    // set up animation clips/actions/whatever
    this.animationMixer = new THREE.AnimationMixer(model)
    this.animationsMap = new Map()
    model.animations.forEach(a => { this.animationsMap.set(a.name, this.animationMixer.clipAction(a)) })
    this.screen.removeMixer(this.name)
    this.screen.addMixer(this.name, this.animationLoop.bind(this))
    // GUI folder fixup...
    if (fld instanceof GUI) {
      const PROPS = { animation: '[none]' }
      const animations = Array.from(this.animationsMap.keys())
      console.log(animations)
      animations.unshift(PROPS.animation)
      const existingGuiController = fld.controllers.find(c => c.property === 'animation')
      if (existingGuiController) {
        const existingValue = existingGuiController.getValue()
        if (PROPS.animation !== existingValue && animations.includes(existingValue)) {
          PROPS.animation = existingValue
        }
        existingGuiController.destroy()
      }
      fld.add(PROPS, 'animation', animations).onChange(v => { this.changeAnimation(v) })
      this.changeAnimation(PROPS.animation)
    }
  }

  changeAnimation (v) {
    console.log(`animation change: from '${this.currentAction}' to ${v}`)
    const currentClip = this.animationsMap.get(this.currentAction)
    currentClip?.fadeOut(0.2)
    const newClip = this.animationsMap.get(v)
    newClip?.reset().fadeIn(0.2).play()
    this.currentAction = v
  }

  animationLoop (delta) {
    this.animationMixer?.update(delta)
    return true
  }

  async loadCharacter (fp) {
    const e = this.group.getObjectByName(this.objName)
    if (e) {
      depthFirstReverseTraverse(null, e, generalObj3dClean)
      e.removeFromParent()
    }
    const loader = new GLTFLoader()
    // The GLTF loader doesn't like the mine URL type - texture loader seemed OK with it though!
    // Load the file in main as binary and pass the ArrayBuffer
    const buffer = await loadBinaryFile(fp)
    const gObj = await loader.parseAsync(buffer.buffer, '')
    const model = gObj.scene
    model.rotateX(Math.PI / 2)
    model.name = this.objName
    // attach the animations to the model Object3D
    model.animations = gObj.animations
    model.animations.forEach(a => {
      if (a.name.startsWith('CharacterArmature|')) {
        a.name = a.name.replace('CharacterArmature|', '')
      }
    })
    this.group.add(model)
    this.redraw()
    return model
  }

  deleteCharacter () {
    const e = this.group.getObjectByName(this.name)
    if (!e) { return }
    depthFirstReverseTraverse(null, e, generalObj3dClean)
    e.removeFromParent()
    this.screen.removeMixer(this.name)
    this.redraw()
  }

  /**
   * Load a third-party character model and try to make it useful.
   * Add it to a new group called 'character'.
   * When loaded the user should be able to examine it and tweak it.
   * Get a list of animations and test them.
   * When user is happy with their edits they can save it in a known game format.
   */
  async testLoadCharacter () {
    const info = await pickFile()
    if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
    const fp = info.filePaths[0]
    if (!fp) { return }
    const u = filePathToMine(fp)
    console.log(u)
    await this.loadCharacter(fp)
  }
}
