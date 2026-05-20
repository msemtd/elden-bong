import path from 'path-browserify'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Dlg } from './dlg'
import { getMainDirs, loadBinaryFile, pickFile } from './HandyApi'
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

let animationKeys = null

export class Character {
  constructor (bong) {
    this.bong = bong
    // when we switch characters we want to fix up all the objects
    this.mixer = null
    this.currentAction = null
    this.animationsMap = null
    // start off with an OrbitControls or go straight to camera-controls
    // how to mesh with the existing camera and controls which is managed by
    // Screen object - just replicate the work in the example
    // in character playing mode we will be following the character
    // The existing modes in bong.js need to be developed
    // we will always need a free-moving mode for exploration
    // anyhow, mini-games can take control anything
  }

  static classNames () {
    return Object.keys(characterMappings)
  }

  async changeCharacter (v) {
    console.log('character class change: ' + v)
    const glb = characterMappings[v]
    if (!glb) {
      console.warn('no mapping for ' + v)
      return
    }
    const mainDirs = await getMainDirs()
    if (mainDirs.staticDir) {
      const fp = path.join(mainDirs.staticDir, 'models', 'character', glb)
      await this.loadCharacter(fp)
      return
    }
    if (!this.bong.settings.characterModelsDir) {
      Dlg.popup('Please set the character models directory in settings before trying to load a character model.', 'No character models directory set')
      console.warn('no character models dir set')
      return
    }
    const fp = path.join(this.bong.settings.characterModelsDir, glb)
    await this.loadCharacter(fp)
  }

  async loadCharacter (fp) {
    const scene = this.bong.screen.scene
    const e = scene.getObjectByName('character')
    if (e) {
      depthFirstReverseTraverse(null, e, generalObj3dClean)
      e.removeFromParent()
    }
    const loader = new GLTFLoader()
    // The GLTF loader doesn't like the mine URL type - texture loader seemed OK with it though!
    // Load the file in main as binary and pass the ArrayBuffer
    const buffer = await loadBinaryFile(fp)
    loader.parse(buffer.buffer, '', (gObj) => {
      const charGroup = new THREE.Group()
      charGroup.name = 'character'
      // TODO Are we guaranteed a scene? It looks like there can be multiple scenes in the GLTF
      // For the ones I have here, the scene is the model
      const model = gObj.scene
      model.rotateX(Math.PI / 2)
      charGroup.add(model)
      // the object contains the animations and other stuff which may be useful!
      // charGroup.userData = gObj
      // need to rotate it upright for our Z-up...
      scene.add(charGroup)
      const aa = gObj.animations
      const ak = aa.map(x => x.name)
      console.log(ak)
      if (!animationKeys) {
        animationKeys = ak
      } else {
        // manual check for common animation names matching across all the built-in models
        console.assert(ak.join(' | ') === animationKeys.join(' | '), 'different animations?')
      }
    }, undefined, function (error) {
      console.error(error)
    })
    this.bong.redraw()
  }

  deleteCharacter () {
    const scene = this.bong.screen.scene
    const e = scene.getObjectByName('character')
    if (!e) { return }
    depthFirstReverseTraverse(null, e, generalObj3dClean)
    e.removeFromParent()
    this.bong.redraw()
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
