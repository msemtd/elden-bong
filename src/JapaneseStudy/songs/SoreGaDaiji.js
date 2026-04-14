import { AboutSongs, SongBase } from './AboutSongs'
// cspell: disable

export class SoreGaDaiji extends SongBase {
  constructor () {
    super('それが大事 (Sore Ga Daiji)', 'DaijiMAN Brothers Band', 2007)
    const a = AboutSongs.layouts
    this.dataLayout = [a.ROMAJI, a.KANJI, a.ENGLISH]
    this.data = `
makenai koto
nagedasanai koto
nigedasanai koto
shinjinuku koto
dame ni narisou na toki
sore ga ichiban daiji

makenai koto
nagedasanai koto
nigedasanai koto
shinjinuku koto
namida misetemo ii yo
sore wo wasurenakereba

`.trim()
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
