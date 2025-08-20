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
 */

import * as THREE from 'three'
import { generalObj3dClean } from '../threeUtil'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MiniGameBase } from '../MiniGameBase'
import { getN5KanjiTab, getN5VocabTab } from './jlptN5Help'
import $ from 'jquery'
import { shellOpenExternal } from '../HandyApi'
import { Screen } from '../Screen'
import CameraControls from 'camera-controls'
import { KanjiByFrequency } from './KanjiByFrequency'

const sources = {
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

class JapaneseStudy extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Japanese Study')
    this.sources = sources
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
      }
      this.gui.add(links, 'wpKyouikuKanji')
      this.gui.add(this, 'testKanjiByFrequency')

      // do more!
    })
  }

  //
  //
  async runTest () {
    console.warn('TODO runTest')
    const k = this.kanaGenerate()
    // console.dir(k)
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

  buildClassroom () {
    {
      const o = this.group.getObjectByName('classroom')
      if (o) {
        o.removeFromParent()
        generalObj3dClean(o)
      }
    }

    const g = new THREE.BoxGeometry(5, 4, 3)
    const m = new THREE.MeshLambertMaterial({ color: 'tan', side: THREE.DoubleSide })
    const o = new THREE.Mesh(g, m)
    o.name = 'classroom'
    o.position.set(5, 15, 1.5)
    this.group.add(o)
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
        out.push(`${col[i]}${row[j]}`)
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
}

export { JapaneseStudy }
