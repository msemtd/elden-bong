/*
 * RTK - I'm doing it - that's that!
 * I accept it as the challenge it is.
 * I consider it to be a side-quest in my Japanese learning.
 *
 * Overcoming laziness as a learner.
 *
 * kanjivg and heisig-rtk-index
 *
 *
 */

import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MiniGameBase } from '../MiniGameBase'
import $ from 'jquery'

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
      // do more!
    })
  }

  //
  //
  async runTest () {
    console.warn('TODO runTest')
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
}

export { JapaneseStudy }
