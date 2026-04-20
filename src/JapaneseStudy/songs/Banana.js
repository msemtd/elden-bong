import { AboutSongs, SongBase } from './AboutSongs'
// cspell:disable
export class Banana extends SongBase {
  // https://www.youtube.com/watch?v=0hKSXMGzvcE
  // https://www.discogs.com/artist/1307314-Kay-Ishiguro
  // https://ja.wikipedia.org/wiki/%E7%9F%B3%E9%BB%92%E3%82%B1%E3%82%A4
  constructor () {
    super('BANANA', 'Ishiguro Kei (石黒ケイ)', 1982)
    const a = AboutSongs.layouts
    this.dataLayout = [a.KANJI, a.ROMAJI, a.ENGLISH]
    this.data = `

I like banana いつでも
そばにおいて ながめたい
I like banana I like banana
誰にもあげたくないくらいよ
孤独な夜ふけは そっとベッドの中へ忍ばせるの
可愛いい 可愛いい my banana
淋しがりやの 私の treasure
素敵な夢を 見せて・・・・・・

I like banana
もしも この世に お前がなければ
I like banana I like banana
私は 考えられない

I like banana
はじめて 食べた時の ときめき
I like banana I like banana
言葉にならないくらいよ
目覚めの悪い朝は 朝陽の中でキスするの
たくましい たくましい my banana
情熱的な私の treasure
強い刺激が いいわ

I like banana
お前を 嫌いな人も いるけど
I like banana I like banana
それは食べず嫌いよ
I like banana もしも
この世に お前がなければ
I like banana I like banana
私は 考えられない

`.trim()
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
