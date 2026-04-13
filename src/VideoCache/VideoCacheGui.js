/* eslint-disable @stylistic/comma-dangle */
import { MiniGameBase } from '../MiniGameBase'
import { loadSettings, saveTheseSettings } from '../settings'
import $ from 'jquery'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import van from 'vanjs-core/debug'
import { FloatingWindow } from 'vanjs-ui'
import path from 'path-browserify'
import { videoCache } from '../HandyApi'
import { Dlg } from '../dlg'
import { Bong } from '../bong'

const { p, div, button, input, label, span, table, tbody, thead, td, th, tr, br } = van.tags

export class VideoCacheGui extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Video Cache')
    this.props = {
      exePath: '',
      ffmpegPath: '',
      nodePath: '',
    }
    this.settings = loadSettings(this.name, this.props)
    this.props = { ...this.props, ...this.settings }
    this.jobId = 0
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      const fld = this.gui.addFolder('settings').onFinishChange((v) => {
        saveTheseSettings(this.name, this.props)
      })
      fld.add(this.props, 'exePath').name('exePath')
      fld.add(this.props, 'ffmpegPath').name('ffmpegPath')
      fld.add(this.props, 'nodePath').name('nodePath')
      Bong.getInstance().addEventListener('getVidFeedback', (ev) => { this.vpFeedback(ev) })
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
    const inputText = van.state('')
    const xa = van.state(false)

    van.add(document.body,
      FloatingWindow({ title, closed, width, height, childrenContainerStyleOverrides },
        div({ id, class: 'videoCacheGui' },
          p('yo'),
          button({ onclick: () => { this.vpHelp() } }, 'run help'),
          input({ type: 'text', value: inputText, oninput: e => { inputText.val = e.target.value } }),
          'audio',
          input({ type: 'checkbox', checked: xa, oninput: e => { xa.val = e.target.checked } }),
          button({ onclick: () => { this.download(inputText.val, xa.val) } }, 'download'),
        ),
      )
    )
  }

  async vpHelp () {
    // run vp --help and vp --version and show the output in a dialog
    const helpOutput = await videoCache('help', { ...this.props })
    const msg = `<pre>\n${helpOutput}\n</pre>`
    Dlg.awaitableDialog(msg, 'Video Cache Help and Version')
  }

  async download (url, xa) {
    this.jobId++
    const jobId = this.jobId
    console.log(`Starting video cache job ${jobId} for url: ${url} with extract-audio: ${xa}`)
    const msg = await videoCache(url, { ...this.props, xa, jobId })
    const msg2 = `<pre>\n${msg}\n</pre>`
    Dlg.awaitableDialog(msg2, 'Video cache output')
  }

  async vpFeedback (ev) {
    console.log('Video cache feedback:', ev)
  }
}
