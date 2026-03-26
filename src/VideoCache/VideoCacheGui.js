/* eslint-disable @stylistic/comma-dangle */
import { MiniGameBase } from '../MiniGameBase'
import { loadSettings, saveTheseSettings } from '../settings'
import $ from 'jquery'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import van from 'vanjs-core/debug'
import { FloatingWindow } from 'vanjs-ui'
import path from 'path-browserify'
import { videoProcessor } from '../HandyApi'
import { Dlg } from '../dlg'

const { p, div, button, input, label, span, table, tbody, thead, td, th, tr, br } = van.tags

export class VideoCacheGui extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Video Cache')
    this.props = {
      exePath: ''
    }
    this.settings = loadSettings(this.name, this.props)
    this.props = { ...this.props, ...this.settings }
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.add(this.props, 'exePath').name('exePath').onFinishChange((v) => {
        console.log(`exePath set to ${v}`)
        saveTheseSettings(this.name, this.props)
      })
    })
  }

  runTest () {
    this.popWindow()
  }

  popWindow () {
    // exe path configured?
    if (!this.props.exePath) { return Dlg.errorDialog('Please set the exePath in the settings before running this.') }
    const id = 'VideoCacheGui'
    if (document.getElementById(id)) {
      console.log('VideoCacheGui is already open')
      return
    }

    // Trick to allow our content to fill a FloatingWindow...
    const childrenContainerStyleOverrides = { height: 'calc(100% - 60px)' }
    const closed = van.state(false)
    const title = '📼 Video Cache'
    const width = 640
    const height = 480
    van.add(document.body,
      FloatingWindow({ title, closed, width, height, childrenContainerStyleOverrides },
        div({ id, class: 'videoCacheGui' },
          p('yo'),
          button({ onclick: () => { this.vpHelp() } }, 'run help'),
          button({ onclick: () => { } }, 'find a video caching app'),
        ),
      )
    )
  }

  async vpHelp () {
    // run vp --help and vp --version and show the output in a dialog
    const helpOutput = await videoProcessor('help', { exePath: this.props.exePath })
    const msg = `Help output:\n${helpOutput}`
    const vid = 'https://www.youtube.com/watch?v=UnqejtHwGLs'
    Dlg.awaitableDialog(msg, 'Video Processor Help and Version')
  }
}
