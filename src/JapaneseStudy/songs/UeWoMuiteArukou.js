import { SongBase } from './SongBase.js'
// cspell: disable
export class UeWoMuiteArukou extends SongBase {
  constructor () {
    super('上を向いて歩こう (Ue Wo Muite Arukou aka Sukiyaki)', '坂本九 (Kyu Sakamoto)', 1961)
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

const todo = `
上を向いて歩こう
涙がこぼれないように
思い出す 春の日
一人ぽっちの夜
上を向いて歩こう
にじんだ星をかぞえて
思い出す 夏の日
一人ぽっちの夜
幸せは 雲の上に
幸せは 空の上に
上を向いて歩こう
涙がこぼれないように
泣きながら 歩く
一人ぽっちの夜
思い出す 秋の日
一人ぽっちの夜
悲しみは星のかげに
悲しみは月のかげに
上を向いて歩こう
涙がこぼれないように
泣きながら 歩く
一人ぽっちの夜
一人ぽっちの夜

`