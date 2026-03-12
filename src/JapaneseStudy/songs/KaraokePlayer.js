import $ from 'jquery'
import * as THREE from 'three'
import { Howl } from 'howler'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import van from 'vanjs-core/debug'
import path from 'path-browserify'
import { FloatingWindow } from 'vanjs-ui'
import { Dlg } from '../../dlg'
import { MiniGameBase } from '../../MiniGameBase'
import { pickFile, shellOpenExternal, loadJsonFile } from '../../HandyApi'
import { filePathToMine } from '../../util'
import { loadSettings, saveTheseSettings } from '../../settings'
import './KaraokePlayer.css'

/* eslint-disable @stylistic/comma-dangle */

const { p, div, button, input, label, span, table, tbody, thead, td, th, tr, br } = van.tags

const Table = ({ head, data, tabProps }) => table(
  tabProps || { border: '1px solid black', width: '100%' },
  head ? thead({ align: 'left' }, tr(head.map(h => th(h)))) : [],
  tbody(data.map(row => tr(
    row.map(col => td(col))
  )))
)

async function pick (options) {
  const info = await pickFile(options)
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
    this.volMin = 0
    this.volMax = 11
    this.props = {
      playlist: ''
    }
    this.settings = loadSettings(this.name, this.props)
    this.props = { ...this.props, ...this.settings }
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'runTest')
      this.gui.add(this.props, 'playlist').name('Playlist File').onFinishChange((v) => {
        console.log(`playlist set to ${v}`)
        saveTheseSettings(this.name, this.props)
      })
      this.gui.add(this, 'browseForPlaylistFile').name('Choose Playlist File')
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
    const title = '🏮 Karaoke Player'
    const preferredVolume = 10 // TODO get from settings or last used
    const s = this.state = {}
    s.closed = van.state(false)
    s.track = van.state('<none>')
    s.timer = van.state(this.formatTime(0))
    s.duration = van.state(this.formatTime(0))
    s.linePrevious = van.state('<previous line>')
    s.lineCurrent = van.state('<current line>')
    s.lineNext = van.state('<next line>')
    s.volume = van.state(preferredVolume)
    s.trackProgress = van.state(0)
    //
    van.add(document.body, FloatingWindow({ title, closed: s.closed, width: 600, height: 500 },
      div({ id: 'KaraokePlayer', class: 'karaokePlayer' },
        // <!-- Top Info -->
        div({ class: 'top' },
          div({ class: 'track' }, s.track),
          div(
            input({
              type: 'range',
              class: 'seek',
              value: s.trackProgress,
              step: 'any',
              oninput: (e) => {
                s.trackProgress.val = Number(e.target.value)
                this.setSeekPct(s.trackProgress.val)
              }
            })
          ),
          div({ class: 'times' },
            span({ class: 'timer' }, s.timer),
            span({ class: 'duration' }, s.duration),
          ),
          div({ class: 'volumeArea' },
            button({ class: 'svgIcon svgPrev', onclick: this.prevBtn.bind(this) }),
            button({ class: 'svgIcon svgPlay', onclick: this.playBtn.bind(this) }),
            button({ class: 'svgIcon svgPause', onclick: this.pauseBtn.bind(this) }),
            button({ class: 'svgIcon svgStop', onclick: this.stopBtn.bind(this) }),
            button({ class: 'svgIcon svgNext', onclick: this.nextBtn.bind(this) }),
            button({ class: 'svgIcon svgPlaylist', onclick: this.showPlaylist.bind(this) }),
            button({ class: 'svgIcon svgLyrics', onclick: this.showPlaylist.bind(this) }),
            button({ class: 'svgIcon svgOpen', onclick: this.openFile.bind(this) }),
            label({ for: 'volume2' }, 'Volume:'),
            input({
              class: 'volumeInput',
              type: 'range',
              id: 'volume2',
              name: 'volume',
              min: this.volMin,
              max: this.volMax,
              step: 0.25,
              value: s.volume,
              oninput: (e) => {
                s.volume.val = Number(e.target.value)
                this.volumeChange(s.volume.val)
              }
            }),
            label({ for: 'volume2' }, s.volume),
          ),
        ),
        div({ class: 'lines' },
          p({ class: 'linePrevious' }, s.linePrevious),
          p({ class: 'lineCurrent' }, s.lineCurrent),
          p({ class: 'lineNext' }, s.lineNext),
        ),
        // <!-- Controls -->
        div({ class: 'controlsOuter' },
          // div({ class: 'controlsInner' },
          //   button({ class: 'prevBtn', onclick: this.prevBtn.bind(this) }, '⏮️'),
          //   button({ class: 'playBtn', onclick: this.playBtn.bind(this) }, '▶️'),
          //   button({ class: 'pauseBtn', onclick: this.pauseBtn.bind(this) }, '⏸️'),
          //   button({ class: 'stopBtn', onclick: this.stopBtn.bind(this) }, '⏹️'),
          //   button({ class: 'nextBtn', onclick: this.nextBtn.bind(this) }, '⏭️'),
          //   button({ class: 'ejectBtn', onclick: this.openFile.bind(this) }, '⏏️'),
          // ),
          button({ class: 'playlistBtn', onclick: this.showPlaylist.bind(this) }, 'playlist'),
          button({ class: 'searchBtn', onclick: this.searchDlg.bind(this) }, 'search'),
          br(),
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

  volumeChange (val) {
    // The volume value from the control is in the scale of min to max
    // and howl wants zero to one
    const range = this.volMax - this.volMin
    const rVal = (val - this.volMin) / (range)
    this.howl?.volume(rVal)
  }

  setSeekPct (val) {
    const d = this.howl?.duration() || 0
    const newSeek = d * (val / 100)
    // console.log(`setSeekPct ${val} = ${newSeek}`)
    this.howl?.seek(newSeek)
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
      onend: this.nextBtn.bind(this),
    })
    this.howl.play()
  }

  onHowlPlay () {
    this.volumeChange(this.state.volume.val)
    const d = this.howl?.duration()
    this.state.duration.val = this.formatTime(d)
    requestAnimationFrame(this.animate.bind(this))
  }

  animate () {
    if (!this.howl?.playing()) { return }
    // based on the howler example
    const p = this.howl?.seek() || 0
    const d = this.howl?.duration() || 1
    const newVal = this.formatTime(p)
    this.state.timer.val = newVal // TODO is it worth checking against old value?
    const pct = (((p / d) * 100) || 0)
    this.state.trackProgress.val = pct
    requestAnimationFrame(this.animate.bind(this))
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

  async searchDlg () {
    const song = await Dlg.questionBox('Search for a song (on YouTube or similar) then drop the URL in here')
    if (!song) { return }
    console.log(song)
    const enc = encodeURIComponent(song)
    const url = `https://www.youtube.com/results?search_query=${enc}`
    shellOpenExternal(url)
  }

  editLyricsFor (itm) {
    console.dir(itm)
    if (!itm.lyrics) {
      console.log('no lyrics yet')
    }
  }

  showPlaylist () {
    console.log('showPlaylist')
    //
    const head = ['#', 'title', 'lyrics',]
    const lyricsBtn = (itm) => button({ onclick: () => { this.editLyricsFor(itm) } }, '🎤')
    const data = this.playlist.map((itm, idx) => [idx, itm.title, lyricsBtn(itm)])
    const tabProps = { class: 'playlistTab', border: '1px solid black', width: '100%' }
    // Use the technique used in the BanzukeDialog to swap div shown in
    // the floating window. Show the playlist instead of the player controls,
    // showing a close button to return to the player view.
    const playlistDivId = 'KaraokePlayerPlaylist'
    const contentDiv = $('#KaraokePlayer')
    contentDiv.hide()
    const closeBtnClicked = () => {
      $(`#${playlistDivId}`).remove()
      contentDiv.show()
    }
    const dlgDiv = $('div.vanui-window > div.vanui-window-children').has(contentDiv)
    van.add(dlgDiv[0], div(
      { id: playlistDivId },
      Table({ head, data, tabProps }),
      p(this.props.playlist || 'No playlist file chosen'),
      p(
        button({ onclick: () => { this.browseForPlaylistFile() } }, 'Load Playlist File'),
        button({ }, 'Save'),
        button({ }, 'Save as'),
      ),
      button({ onclick: closeBtnClicked }, 'Close'),
    ))
  }

  async browseForPlaylistFile () {
    console.log('browseForPlaylistFile')
    const info = await pickFile({ filters: [{ name: 'Playlist Files', extensions: ['json'] }] })
    if (info.canceled || !Array.isArray(info.filePaths) || !info.filePaths.length) return
    const fp = info.filePaths[0]
    console.log(fp)
    // try loading it
    const data = await loadJsonFile(fp)
    // populate with data
    this.props.playlist = fp
    // update the GUI to show the new playlist file and save
    const e = this.gui.children.find(x => x.property === 'playlist')
    e?.updateDisplay()
    saveTheseSettings(this.name, this.props)
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
