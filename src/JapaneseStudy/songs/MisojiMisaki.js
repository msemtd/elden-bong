import { SongBase, AboutSongs } from './SongBase.js'
// cspell: disable
export class MisojiMisaki extends SongBase {
  constructor () {
    super('三十路岬 (Misoji Misaki)', '小神あきら (Akira Kogami)', 2007)
    // Lucky Star ED 16 - Misoji Misaki [FULL]
    // https://www.youtube.com/watch?v=X0hq8bPUbJg
    // Misoji Misaki · Akira Kogami (CV: Hiromi Konno)
    // Misoji Misaki
    // ℗ 2007 Lantis
    // Released on: 2007-08-29
    // Composer, Arranger: Satoru Kosaki
    // Lyricist: Aki Hata
    const a = AboutSongs.layouts
    this.dataLayout = [a.KANJI, a.ROMAJI, a.ENGLISH]
    this.data = `

三十路岬
Misoji Misaki
Thirty-Year-Old Cape

`
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
