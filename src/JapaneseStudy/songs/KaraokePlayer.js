import { Howl } from 'howler'

// https://github.com/goldfire/howler.js/tree/master/examples/player
// open overlay screen - semi-transparent
// present the list of loaded songs to choose from
// need test songs

// file stashing in main thread
// user-installed yt-dl
// C:\Users\whatever\Documents\dev\yt-dlp

export class KaraokePlayer {
  constructor () {
    this.howl = new Howl({ html5: true })
  }
}
