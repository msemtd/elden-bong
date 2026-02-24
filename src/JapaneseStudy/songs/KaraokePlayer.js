import { Howl } from 'howler'

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
}
