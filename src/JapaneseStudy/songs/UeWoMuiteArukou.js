import { SongBase } from './SongBase.js'
// cspell: disable
export class UeWoMuiteArukou extends SongBase {
  constructor () {
    super('上を向いて歩こう (Ue Wo Muite Arukou)', '坂本九 (Kyu Sakamoto)', 1961)
    this.singAlongVideo = 'https://www.youtube.com/watch?v=H2N9TtDeXoQ'
    const a = AboutSongs.layouts
    this.dataLayout = [a.KANJI, a.ROMAJI, a.ENGLISH]
    this.data = `

上を向いて歩こう
Ue wo muite arukou
I look up as I walk

涙がこぼれないように
Namida ga koborenai you ni
So that the tears won't fall

思い出す春の日
Omoidasu haru no hi
Remembering those spring days

一人ぼっちの夜
Hitoribocchi no yoru
And the nights when I was all alone

上を向いて歩こう
Ue wo muite arukou
I look up as I walk

`.trim()
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
