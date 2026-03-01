import { Howl } from 'howler'
import van from 'vanjs-core/debug'
import { Modal } from 'vanjs-ui'
const { p, div, button, span } = van.tags

// Karaoke player for language learning and fun

// https://github.com/goldfire/howler.js/tree/master/examples/player
// open overlay screen - semi-transparent
// present the list of loaded songs to choose from
// need test songs

// file stashing in main thread
// user-installed yt-dl
// C:\Users\whatever\Documents\dev\yt-dlp
// generic yt-dlp wrapper functionality in the application

// data structure for songs - compatibility with karaoke formats and .lrc files
// https://en.wikipedia.org/wiki/Karaoke
// CD+G and MP3+G formats already exist but I don't have any sample data
// https://www.afterdawn.com/glossary/term.cfm/mp3plusg
//
// https://en.wikipedia.org/wiki/LRC_(file_format)
// https://lrcmaker.com/
// timing button to capture the timing of each line as you sing along, then save that as a .lrc file or something
// Anime opening and closing songs usually have lyrics already available in subtitles files
// SRT to LRC conversion tools online

export class KaraokePlayer {
  constructor () {
    this.howl = new Howl({ html5: true })
  }

  popWindow () {
    // https://vanjs.org/vanui#modal
    // this won't easily overtake jBox until we can have a draggable/resizable window that looks like a window!
    // maybe create a jbox window and replicate it in vanjs with CSS etc.

    const closed = van.state(false)
    van.add(document.body, Modal({ closed, blurBackground: true, clickBackgroundToClose: true },
      
      // <!-- Top Info -->
      span({ id: 'title' },
        span({ id: 'track' }, 'TRACK'),
        span({ id: 'timer' }, '0:00'),
        span({ id: 'duration' }, '0:00')
      ),
      // <!-- Controls -->
      div({ class: 'controlsOuter' },
        div({ class: 'controlsInner' },
          div({ id: 'loading' }),
          div({ class: 'btn', id: 'playBtn' }),
          div({ class: 'btn', id: 'pauseBtn' }),
          div({ class: 'btn', id: 'prevBtn' }),
          div({ class: 'btn', id: 'nextBtn' })
        ),
        div({ class: 'btn', id: 'playlistBtn' }),
        div({ class: 'btn', id: 'volumeBtn' })
      ),
      // <!-- Progress -->
      div({ id: 'waveform' }),
      div({ id: 'bar' }),
      div({ id: 'progress' }),
      // <!-- Playlist -->
      div({ id: 'playlist' },
        div({ id: 'list' })
      ),
      // <!-- Volume -->
      div({ id: 'volume', class: 'fadeout' },
        div({ id: 'barFull', class: 'bar' }),
        div({ id: 'barEmpty', class: 'bar' }),
        div({ id: 'sliderBtn', class: 'bar' })
      ),
      button({ onclick: () => { closed.val = true } }, 'OK')
    ))

    // open overlay screen - semi-transparent
    // present the list of loaded songs to choose from
  }
}
