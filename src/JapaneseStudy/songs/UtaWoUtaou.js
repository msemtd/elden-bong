import { AboutSongs, SongBase } from './AboutSongs'
// cspell: words Utaou Daijiman
export class UtaWoUtaou extends SongBase {
  constructor () {
    super('Uta Wo Utaou', 'Daijiman Brothers Band', 2015)
    // reference track: https://www.youtube.com/watch?v=A4aNSn0Vvj0
    const a = AboutSongs.layouts
    this.dataLayout = [a.KANJI, a.ROMAJI, a.ENGLISH]
    // cspell:disable
    this.data = `

歌を 歌おう 君のために
uta wo utaou kimi no tame ni
sing a song for you

幸せでありますように
shiawase de arimasu you ni
I hope you will be happy

歌を 歌おう 君のために
uta wo utaou kimi no tame ni
sing a song for you

幸せでありますように
shiawase de arimasu you ni
I hope you will be happy

心から 歌う
kokoro kara utau
sing from the heart

`.trim()
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
