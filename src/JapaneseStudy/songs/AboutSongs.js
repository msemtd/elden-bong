/**
 * The idea is to get the information stored by any means and then make it
 * useful later.
 * The user likely wants to learn a song for karaoke or to sing along.
 * We should have:
 * - a definitive version in full Japanese with (frequent use) kanji
 * - a non-kanji japanese version in hiragana or katakana as appropriate
 * - a romaji version
 * - an approximate English translation
 *
 * Ideas:
 * - a very simple song base class would allow common functionality to develop
 * - a jukebox of songs, with optional links to external media
 * - media caching feature: path to yt-dlp
 * - songs are just JSON so can be user added content in a data dir
 * - subtitles and actual karaoke functionality
 *   - formats for karaoke and subtitles timing
 *   - offset and speed controls
 * - can I use howler to play and control an MP3? just try that
 * - set a song path load and play pause stop, etc
 *
 */

export class AboutSongs {
  static layouts = {
    ENGLISH: 'English',
    KANJI: 'Kanji',
    ROMAJI: 'Romaji',
  }
}

export class SongBase {
  constructor (title, artist, year) {
    this.title = title
    this.artist = artist
    this.year = year
  }
}
