import { Howl } from 'howler'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import van from 'vanjs-core/debug'
import path from 'path-browserify'
import { FloatingWindow } from 'vanjs-ui'
import { MiniGameBase } from '../../MiniGameBase'
import { pickFile } from '../../HandyApi'
import { filePathToMine } from '../../util'
import './KaraokePlayer.css'

/* eslint-disable @stylistic/comma-dangle */
const { p, div, button, input, label, span } = van.tags

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
 * user-installed from
 * https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
 * https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
 *
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
 * SRT to LRC conversion tools online (https://github.com/magic-akari/lrc-maker)
 *
 * Associating mp3 with lyrics files via the playlist metadata, or by filename convention (same name but .lrc extension)
 */

export class KaraokePlayer extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Karaoke Player')
    this.howl = null
    this.playlist = []
    this.nowPlaying = -1
    // TODO: populate playlist from data dir and settings
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
    const title = 'Karaoke Player'
    this.state = {}
    this.state.closed = van.state(false)
    this.state.track = van.state('<none>')
    this.state.timer = van.state(this.formatTime(0))
    this.state.duration = van.state(this.formatTime(0))
    this.state.linePrevious = van.state('<previous line>')
    this.state.lineCurrent = van.state('<current line>')
    this.state.lineNext = van.state('<next line>')
    van.add(document.body, FloatingWindow({ title, closed: this.state.closed, width: 600, height: 500 },
      div({ id: 'KaraokePlayer', class: 'karaokePlayer' },
        // <!-- Top Info -->
        div({ class: 'top' },
          div({ class: 'track' }, this.state.track),
          div(input({ type: 'range', class: 'seek', min: '0', max: '100', value: '50' })),
          div({ class: 'times' },
            span({ class: 'timer' }, this.state.timer),
            span({ class: 'duration' }, this.state.duration),
          ),
        ),
        div({ class: 'lines' },
          p({ class: 'linePrevious' }, this.state.linePrevious),
          p({ class: 'lineCurrent' }, this.state.lineCurrent),
          p({ class: 'lineNext' }, this.state.lineNext),
        ),
        // <!-- Controls -->
        div({ class: 'controlsOuter' },
          div({ class: 'controlsInner' },
            button({ class: 'prevBtn', onclick: this.prevBtn.bind(this) }, 'previous'),
            button({ class: 'playBtn', onclick: this.playBtn.bind(this) }, 'play'),
            button({ class: 'pauseBtn', onclick: this.pauseBtn.bind(this) }, 'pause'),
            button({ class: 'stopBtn', onclick: this.stopBtn.bind(this) }, 'stop'),
            button({ class: 'nextBtn', onclick: this.nextBtn.bind(this) }, 'next'),
            button({ class: 'ejectBtn', onclick: this.openFile.bind(this) }, 'open'),
          ),
          button({ class: 'playlistBtn' }, 'playlist'),
          // button({ class: 'volumeBtn' }, 'volume'),
          div(
            input({ type: 'range', id: 'volume2', name: 'volume', min: '0', max: '11' }),
            label({ for: 'volume2' },
              'Volume',
            ),
          )
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
    const pp = path.parse(u)
    console.dir(pp)
    this.playlist.push(new PlaylistItem(u, pp.name))
    // auto-play this song
    this.setSong(this.playlist.length - 1)
  }

  setSong (index) {
    if (index < 0 || index >= this.playlist.length) {
      console.warn('song index out of bounds', index)
      return
    }
    this.nowPlaying = index
    const song = this.playlist[index]
    this.howl?.unload()
    this.state.track.val = song.title
    this.howl = new Howl({
      src: [song.uri],
      html5: false,
      onplay: this.onHowlPlay.bind(this),
    })
    this.howl.play()
  }

  onHowlPlay () {
    const d = this.howl.duration()
    this.state.duration.val = this.formatTime(d)
  }

  playBtn () {
    console.log('playBtn')
    if (!this.playlist.length) { return }
    if (this.howl?.playing()) { return }
    this.howl?.play()
  }

  pauseBtn () {
    console.log('pauseBtn')
    this.howl?.pause()
  }

  stopBtn () {
    console.log('stopBtn')
    this.howl?.stop()
  }

  nextBtn () {
    console.log('nextBtn')
    if (!this.playlist.length) { return }
    let index = this.nowPlaying + 1
    if (index >= this.playlist.length) { index = 0 }
    this.setSong(index)
  }

  prevBtn () {
    console.log('prevBtn')
    if (!this.playlist.length) { return }
    let index = this.nowPlaying - 1
    if (index < 0) { index = this.playlist.length - 1 }
    this.setSong(index)
  }

  formatTime (t) {
    const s = Math.round(t) || 0
    const minutes = Math.floor(s / 60) || 0
    const seconds = (s - minutes * 60) || 0
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
  }
}

class PlaylistItem {
  constructor (uri, title = '') {
    this.uri = uri
    this.title = title
    this.lyrics = null
  }
}
