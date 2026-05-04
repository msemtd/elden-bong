import * as THREE from 'three'
// eslint-disable-next-line no-unused-vars
import { Screen } from './Screen'
import { depthFirstReverseTraverse, generalObj3dClean } from './threeUtil'
import { filePathToMine } from './util'
import { pickFile, loadBinaryFile } from './HandyApi'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import path from 'path-browserify'

/**
 * Having Character as a MiniGame - good idea?
 * Well, character functionality could do with being abstracted
 * - remove heavy code from bong.js
 * - at startup load character for game state we are loading
 * - initial game states
 * - floor, sky, area name, mood, music
 */
export class Character {
  constructor (bong) {
    this.bong = bong
  }

  changeCharacter (v) {
    console.log('character class change: ' + v)
    const characterMappings = {
      Dork: 'Adventurer.glb',
      Pleb: 'Animated Woman.glb',
      Wuss: 'Medieval.glb',
      Goon: 'Punk.glb',
      Geek: 'Sci Fi Character.glb',
      Jock: 'Soldier.glb',
      Suit: 'Suit.glb',
      Jerk: 'Witch.glb',
      Nerd: 'Worker.glb',
    }
    const glb = characterMappings[v]
    if (!glb) {
      console.warn('no mapping for ' + v)
      return
    }
    const fp = path.join(this.bong.settings.characterModelsDir, glb)
    this.loadCharacter(fp)
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
      charGroup.add(gObj.scene)
      // the object contains the animations and other stuff which may be useful!
      charGroup.userData = gObj
      // need to rotate it upright for our Z-up...
      gObj.scene.rotateX(Math.PI / 2)
      scene.add(charGroup)
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
