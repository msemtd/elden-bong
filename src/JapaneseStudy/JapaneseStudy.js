/*
 * RTK - I'm doing it - that's that!
 * I accept it as the challenge it is.
 * I consider it to be a side-quest in my Japanese learning.
 *
 * Overcoming laziness as a learner.
 *
 * kanjivg and heisig-rtk-index
 *
 * I want a learning space in the world where I can "go" and access the resources.
 * - Warp to the classroom and pick resources
 * - simple HTML popup will be OK for now - links to open things in system browser
 * - 3D things might be fun too
 *
 * cSpell:words kanjivg heisig hepburn jlpt Misa Jisho Keita Wanikani kumo jgrpg Kyouiku Anki
 */

import * as THREE from 'three'
import { generalObj3dClean } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { MiniGameBase } from '../MiniGameBase'
import { getN5KanjiTab, getN5VocabTab } from './jlptN5Help'
import $ from 'jquery'
import { shellOpenExternal, loadTextFile } from '../HandyApi'
import { Screen } from '../Screen'
import CameraControls from 'camera-controls'
import { KanjiByFrequency } from './KanjiByFrequency'
import { filePathToMine } from '../util'
import { loadSettings, saveTheseSettings } from '../settings'
import * as hepburn from 'hepburn'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import animeClassroom from '../../stuff/anime_classroom.glb'

class JapaneseStudy extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Japanese Study')
    this.sources = this.mkSources()
    this.props = {
      kanjivgDir: ''
    }
    this.settings = loadSettings(this.name, this.props)
    this.props = { ...this.props, ...this.settings }
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.add(this, 'activate')
      this.gui.add(this, 'deactivate')
      this.gui.add(this, 'n5Kanji')
      const links = {
        wpKyouikuKanji: () => { shellOpenExternal('https://en.wikipedia.org/wiki/Ky%C5%8Diku_kanji') },
        jisho: () => { shellOpenExternal('https://jisho.org/') },
        kanjivg: () => { shellOpenExternal('https://kanjivg.tagaini.net/index.html') }
      }
      this.gui.add(links, 'wpKyouikuKanji')
      this.gui.add(links, 'jisho')
      this.gui.add(links, 'kanjivg')
      this.gui.add(this, 'testKanjiByFrequency')
      this.gui.add(this, 'trySomeSvg')
      this.gui.add(this.props, 'kanjivgDir').name('KanjiVG index').onFinishChange((v) => {
        console.log(`KanjiVG Dir set to ${v}`)
        saveTheseSettings(this.name, this.props)
      })
    })
  }

  //
  //
  async runTest () {
    const k = this.kanaGenerate()
    // console.table(k)
    // patch and convert with hepburn
    const hiragana = k.map(item => hepburn.toHiragana(item))
    console.table(hiragana)
    const katakana = k.map(item => hepburn.toKatakana(item))
    console.table(katakana)

    // create the classroom "over there" and enter learning mode!
    // - disable camera user input and animate move the camera to there
    // - escape to stop! maybe
    // mini-games can have their own "modes" that are exited by deactivate?
    // sounds like a percy
    // Can enter a mode with activate - as well as just showing the group
    // maybe deactivate others? well, we shall see!
    //
    // labelled blocks in the field of view - user can click any of them
    // When in learning mode.
    // we can leave learning mode

    // make/load a classroom and place it "somewhere"
    // "drive" the camera there!
    // to test reset the camera first

    this.buildClassroom()
    this.activate()
    console.assert(this.screen instanceof Screen)
    console.assert(this.screen.cameraControls instanceof CameraControls)
    const classroom = this.group.getObjectByName('classroom')
    await this.screen.cameraControls.fitToSphere(classroom, true)
    await this.screen.cameraControls.rotatePolarTo(Math.PI / 2, true)
    await this.screen.cameraControls.dollyTo(0.5, true)
    await this.screen.cameraControls.rotateAzimuthTo(Math.PI / 4 * 3, true)

    const t1 = getN5KanjiTab()
    const t2 = getN5VocabTab()
  }

  mkSources () {
    return {
      gradedReaders: {
        first: {
          site: 'https://jgrpg-sakura.com/',
          info: 'needs registration and a test',
          me: `kumo no ito was a enlightening - I should go back and read it again
      Keita to neko ishi part one was also enlightening
      (enlightening as in the exciting light-bulb moment of things coming together)
      `
        }
      },
      JLPT_N5: {
        vocabulary: {
          list: 'https://nihongoichiban.com/2011/04/30/complete-list-of-vocabulary-for-the-jlpt-n5/',
          html: ''
        },
        videoList: {
          listName: 'Japanese Ammo with Misa JLPT N5 YouTube playlist (@JapaneseAmmowithMisa)',
          src: 'https://www.youtube.com/playlist?list=PLd5-Wp_4tLqaDGh1kvlS_N0X3O_bTaKar'
        },
        kanji: {
          learning: {
            process:
          `
          When I encounter a kanji as text I tend to immediately google it and
          follow the wiktionary link, e.g. https://en.wiktionary.org/wiki/%E9%95%B7#Japanese
          to see the Japanese usage.
          Next I'd search for it in Jisho to see the get newspaper usage stats
          and the RTK dictionary index.
          This mismatch in the RTK order vs newspaper frequency is one of the annoyances with RTK!
          Wanikani search is sometimes next - the usage examples are good and the reading
          mnemonics are cool if they don't conflict too much with RTK.
          The Anki deck is pretty good too.
          Getting the radicals.
          School order is also important.

          Launching URL using electron shell to open the browser.

          `
            ,
          },
          n5Kanji: {

          },
          rtkVsSchool: {
            situation: `

              The RTK Kanji list is ordered to build up from a foundation but
              that order is not frequency of usage or how important the Kanji is.

              That may be a bit annoying.

              RTK does not teach any Japanese readings - only conceptual meanings
              and only associated with English words in order to create a mapping
              of english word to Kanji _in that direction_!

              The Kanji is taught in school to kids who quite naturally already
              speak and understand the language, see those kanji symbols every day,
              are free to ask anyone any questions about them, etc. etc.

              There's a fixed order of learning. The learning is by repetition.

        `,
            items: {
              term: 'Kyōiku kanji',
              meaning: 'education kanji',
              wpPage: 'https://en.wikipedia.org/wiki/Ky%C5%8Diku_kanji',

            }

          }
        }
      }
    }
  }

  buildClassroom () {
    {
      const o = this.group.getObjectByName('classroom')
      if (o) {
        o.removeFromParent()
        generalObj3dClean(o)
      }
    }
    const g = new THREE.BoxGeometry(5, 4, 3)
    const m = new THREE.MeshLambertMaterial({ color: 'tan', side: THREE.DoubleSide, transparent: true, opacity: 0.05 })
    const o = new THREE.Mesh(g, m)
    o.name = 'classroom'
    o.position.set(5, 15, 1.5)
    this.group.add(o)

    const loader = new GLTFLoader()
    const progressCb = (xhr) => { console.log((xhr.loaded / xhr.total * 100) + '% loaded') }
    const errCb = (error) => { console.error('An error happened', error) }
    loader.load(animeClassroom, (gltf) => {
      const classroom = gltf.scene
      classroom.rotateX(Math.PI / 2)
      classroom.scale.divideScalar(10)
      o.add(classroom)
    }, progressCb, errCb)
  }

  /**
   *
   * @returns this little routine creates an elementary 5 x 10 grid for the kana
   * of the Japanese language - incorrect of course but mathematical!
   */
  kanaGenerate () {
    const out = []
    const col = ' kstnhmyrw'.split('')
    const row = 'aiueo'.split('')
    for (let i = 0; i < col.length; i++) {
      for (let j = 0; j < row.length; j++) {
        let k = `${col[i]}${row[j]}`
        if (k === 'si') k = 'shi'
        if (k === 'ti') k = 'chi'
        if (k === 'tu') k = 'tsu'
        if (k === 'hu') k = 'fu'
        if (k === 'yi') k = '-'
        if (k === 'ye') k = '-'
        if (k === 'wu') k = 'n' // for convenience
        out.push(k)
      }
    }
    return out.map(x => x.trim())
  }

  n5Kanji () {
    const id = 'n5KanjiDiv'
    // toggle
    // if div exists
    const s = $(`#${id}`)
    if (s.length) {
      s.toggle()
      return
    }
    $(`<div id="${id}">Hello</div>`).appendTo('body')
  }

  async testKanjiByFrequency () {
    console.warn('TODO testKanjiByFrequency')
    console.assert(KanjiByFrequency.getFreq('日') === 1)
    console.assert(KanjiByFrequency.getFreq('味') === 442)
    console.assert(KanjiByFrequency.getFreq('Z') === 0)
  }

  async trySomeSvg () {
    // get an SVG image from the custom URL
    const cp = '066f8'
    // the kanjivg data is included in package.json and it could be added to a
    // webpack bundle (that does not change)
    // how does a webpack bundle avoid slow startup times?
    // In dev mode (i.e. most of the time for me!) load kanji svg files from a
    // configurable dir.
    // In production mode, load from a static dir in the app package.
    let kvgDir = this.props.kanjivgDir
    if (!kvgDir || kvgDir.length === 0) {
      console.error('KanjiVG Dir not set!')
      return
    }
    kvgDir = kvgDir.replace(/\\/g, '/')
    if (kvgDir.endsWith('kvg-index.json')) {
      kvgDir = kvgDir.slice(0, -'kvg-index.json'.length)
    }
    const f = `${kvgDir}/kanji/${cp}.svg`
    const url = filePathToMine(f)
    const alreadyGotData = await loadTextFile(f)
    await this.loadSvg(url, this.screen.scene, alreadyGotData)
  }

  async loadSvg (url, scene, alreadyGotData) {
    // taken from https://github.com/mrdoob/three.js/blob/master/examples/webgl_loader_svg.html
    const guiData = {
      currentURL: '',
      drawFillShapes: true,
      drawStrokes: true,
      fillShapesWireframe: false,
      strokesWireframe: false
    }
    const loader = new SVGLoader()
    const callback = (data) => {
      const group = new THREE.Group()
      group.scale.multiplyScalar(0.1)
      group.position.x = 5
      group.position.y = 5
      group.position.z = 1
      group.scale.y *= -1
      let renderOrder = 0
      for (const path of data.paths) {
        const fillColor = path.userData.style.fill
        if (guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none') {
          const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setStyle(fillColor),
            opacity: path.userData.style.fillOpacity,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: guiData.fillShapesWireframe
          })
          const shapes = SVGLoader.createShapes(path)
          for (const shape of shapes) {
            const geometry = new THREE.ShapeGeometry(shape)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.renderOrder = renderOrder++
            group.add(mesh)
          }
        }
        const strokeColor = path.userData.style.stroke
        if (guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none') {
          const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setStyle(strokeColor),
            opacity: path.userData.style.strokeOpacity,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: guiData.strokesWireframe
          })
          for (const subPath of path.subPaths) {
            const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style)
            if (geometry) {
              const mesh = new THREE.Mesh(geometry, material)
              mesh.renderOrder = renderOrder++
              group.add(mesh)
            }
          }
        }
      }
      scene.add(group)
    }
    if (alreadyGotData) {
      const parsedData = loader.parse(alreadyGotData)
      callback(parsedData)
    } else {
      loader.load(url, callback)
    }
  }
}

export { JapaneseStudy }
