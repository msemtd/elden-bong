import { Howl } from 'howler'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import van from 'vanjs-core/debug'
import { FloatingWindow } from 'vanjs-ui'
import { MiniGameBase } from '../../MiniGameBase'
import { pickFile } from '../../HandyApi'
import { filePathToMine } from '../../util'
import './KaraokePlayer.css'

/* eslint-disable @stylistic/comma-dangle */
const { p, div, button, span } = van.tags

async function pick () {
  const info = await pickFile()
  if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
  return info.filePaths[0]
}

/**
 * Karaoke player for language learning and fun
 *
 * Use player internals as per the howler example...
 * https://github.com/goldfire/howler.js/tree/master/examples/player
 *
 * Create our own player GUI.
 * See https://webamp.org/ for example layout of a media player, playlist, etc.
 * Use https://icones.js.org/ to choose icons for play, pause, next, previous, playlist, volume, etc.
 *
 * Upon first show window:
 * - present the list of user's songs to choose from (data dir in settings)
 * - when no songs ask user where to find them or store them (set data dir)
 * - file stashing in main thread with a DataDir API
 * adding files from local disk - drag and drop or file picker dialog
 * adding lyrics and saving playlist metadata to the DataDir
 * adding files from the internet - search and download from YouTube using
 * user-installed yt-dlp
 * C:\Users\whatever\Documents\dev\yt-dlp
 * https://www.youtube.com/results?search_query=whatever
 * generic yt-dlp wrapper functionality in the application
 * data structure for playlist songs
 * - compatibility with karaoke formats and .lrc files
 * - https://en.wikipedia.org/wiki/Karaoke
 * CD+G and MP3+G formats already exist but I don't have any sample data
 * https://www.afterdawn.com/glossary/term.cfm/mp3plusg
 * https://en.wikipedia.org/wiki/LRC_(file_format)
 * https://lrcmaker.com/
 * timing button to capture the timing of each line as you sing along, then save that as a .lrc file or something
 * Anime opening and closing songs usually have lyrics already available in subtitles files
 * SRT to LRC conversion tools online
 */

export class KaraokePlayer extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Karaoke Player')
    this.howl = null // new Howl({ html5: true })
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
    })
  }

  runTest () {
    this.popWindow()
  }

  popWindow () {
    if (document.getElementById('KaraokePlayer')) {
      console.log('KaraokePlayer is already open')
      return
    }
    this.state = {}
    this.state.closed = van.state(false)
    this.state.track = van.state('<none>')
    this.state.timer = van.state(this.formatTime(0))
    this.state.duration = van.state(this.formatTime(0))
    this.state.linePrevious = van.state('<previous line>')
    this.state.lineCurrent = van.state('<current line>')
    this.state.lineNext = van.state('<next line>')
    van.add(document.body, FloatingWindow(
      { closed: this.state.closed, title: 'Karaoke Player', class: 'karaoke-player', width: 600, height: 500 },
      div({ id: 'KaraokePlayer' },
        // <!-- Top Info -->
        div({ class: 'top' },
          p({ class: 'track' }, this.state.track),
          p({ class: 'timer' }, this.state.timer),
          p({ class: 'duration' }, this.state.duration),
        ),
        div({ class: 'lines' },
          p({ class: 'linePrevious' }, this.state.linePrevious),
          p({ class: 'lineCurrent' }, this.state.lineCurrent),
          p({ class: 'lineNext' }, this.state.lineNext),
        ),
        // <!-- Controls -->

        /*
        cspell: ignore Themesberg
  https://icones.js.org/collection/flowbite
  <symbol viewBox="0 0 24 24" id="flowbite-backward-step-outline"><!-- Icon from Flowbite Icons by Themesberg - https://github.com/themesberg/flowbite-icons/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6v12m8-12v12l-8-6z"></path></symbol>
  <symbol viewBox="0 0 24 24" id="flowbite-play-outline"><!-- Icon from Flowbite Icons by Themesberg - https://github.com/themesberg/flowbite-icons/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 18V6l8 6z"></path></symbol>
  <symbol viewBox="0 0 24 24" id="flowbite-pause-outline"><!-- Icon from Flowbite Icons by Themesberg - https://github.com/themesberg/flowbite-icons/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 6H8a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1m7 0h-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1"></path></symbol>
  <symbol viewBox="0 0 24 24" id="flowbite-stop-outline"><!-- Icon from Flowbite Icons by Themesberg - https://github.com/themesberg/flowbite-icons/blob/main/LICENSE --><rect width="12" height="12" x="6" y="6" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2" rx="1"></rect></symbol>
  <symbol viewBox="0 0 24 24" id="flowbite-forward-step-outline"><!-- Icon from Flowbite Icons by Themesberg - https://github.com/themesberg/flowbite-icons/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 6v12M8 6v12l8-6z"></path></symbol>
  <symbol viewBox="0 0 24 24" id="flowbite-folder-open-outline"><!-- Icon from Flowbite Icons by Themesberg - https://github.com/themesberg/flowbite-icons/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19V6a1 1 0 0 1 1-1h4.032a1 1 0 0 1 .768.36l1.9 2.28a1 1 0 0 0 .768.36H16a1 1 0 0 1 1 1v1M3 19l3-8h15l-3 8z"></path></symbol>
  <symbol viewBox="0 0 24 24" id="flowbite-list-outline"><!-- Icon from Flowbite Icons by Themesberg - https://github.com/themesberg/flowbite-icons/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M9 8h10M9 12h10M9 16h10M4.99 8H5m-.02 4h.01m0 4H5"></path></symbol>
  <symbol viewBox="0 0 24 24" id="flowbite-volume-up-outline"><!-- Icon from Flowbite Icons by Themesberg - https://github.com/themesberg/flowbite-icons/blob/main/LICENSE --><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.5 8.43A5 5 0 0 1 17 12a4.98 4.98 0 0 1-1.43 3.5m2.794 2.864A8.97 8.97 0 0 0 21 12a8.97 8.97 0 0 0-2.636-6.364M12 6.135v11.73a1 1 0 0 1-1.64.768L6 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2l4.36-3.633a1 1 0 0 1 1.64.768"></path></symbol>
        */
        div({ class: 'controlsOuter' },
          div({ class: 'controlsInner' },
            button({ class: 'prevBtn' }, 'previous'),
            button({ class: 'playBtn', onclick: this.playBtn.bind(this) }, 'play'),
            button({ class: 'pauseBtn', onclick: this.pauseBtn.bind(this) }, 'pause'),
            button({ class: 'stopBtn', onclick: this.stopBtn.bind(this) }, 'stop'),
            button({ class: 'nextBtn' }, 'next'),
            button({ class: 'ejectBtn', onclick: this.openFile.bind(this) }, 'open'),
          ),
          button({ class: 'playlistBtn' }, 'playlist'),
          button({ class: 'volumeBtn' }, 'volume'),
        ),
        // <!-- Playlist -->
        div({ class: 'playlist' },
          div({ class: 'list' }),
        ),
      ),
    ))
  }

  async openFile () {
    const fp = await pick()
    if (!fp) { return }
    const u = filePathToMine(fp)
    console.log(u)
    this.howl?.unload()
    this.howl = new Howl({
      src: [u],
      html5: false,
      onplay: this.onHowlPlay.bind(this),
    })
    this.howl.play()
  }

  onHowlPlay () {
    const d = this.howl.duration()
    this.state.duration.val = this.formatTime(Math.round(d))
  }

  stopBtn () {
    console.log('stopBtn')
    this.howl?.stop()
  }

  playBtn () {
    console.log('playBtn')
    this.howl?.play()
  }

  pauseBtn () {
    console.log('pauseBtn')
    this.howl?.pause()
  }

  formatTime (s) {
    const minutes = Math.floor(s / 60) || 0
    const seconds = (s - minutes * 60) || 0
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
  }
}
