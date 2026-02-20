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



























































































































I'm supposed to be the one who laughs last

Because of my sailor clothes ← That's the conclusion

I'm in a bad mood, what to do?

Even though it's Monday!

Summer clothes'll fix it ← Cuuute! ^^v

Of course

I'm supposed to be the one who laughs last

Because of my sailor clothes ← That's the conclusion

A vague 3cm, ain't that a flexible rule? whoa!

For rapping, a uniform... right! it isn't a disadvantage

Gotta do our best! Gotta do it!

That's when we wear our cap and jersey, ha

If you can see our sweat through 'em darlin' darling be AMUSED!!






 */
import { Howl } from 'howler'

export class AboutSongs {
  static layouts = {
    ENGLISH: 'English',
    KANJI: 'Kanji',
    ROMAJI: 'Romaji',
  }

  launchMp3Player () {
    // open overlay screen - semi-transparent
    // present the list of loaded songs to choose from
    // need test songs

    // file stashing in main thread
    // user-installed yt-dl
    // C:\Users\msemt\Documents\dev\yt-dlp

    // Lucky Star ED 16 - Misoji Misaki [FULL]
    // https://www.youtube.com/watch?v=X0hq8bPUbJg
    // Misoji Misaki · Akira Kogami (CV: Hiromi Konno)
    // Misoji Misaki
    // ℗ 2007 Lantis
    // Released on: 2007-08-29
    // Composer, Arranger: Satoru Kosaki
    // Lyricist: Aki Hata

    // https://github.com/goldfire/howler.js/tree/master/examples/player

  }
}

export class SongBase {
  constructor (title, artist, year) {
    this.title = title
    this.artist = artist
    this.year = year
  }
}
