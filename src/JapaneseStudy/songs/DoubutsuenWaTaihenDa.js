import { SongBase, AboutSongs } from './SongBase.js'
// cspell: disable
export class DoubutsuenWaTaihenDa extends SongBase {
  constructor () {
    super('動物園は大変だ (Doubutsuen wa taihen da!)', '小神あきら (Akira Kogami)', 2007)
    // Crayon Shin-chan OST - Doubutsuen wa Taihen da! (動物園は大変だ)
    // https://www.youtube.com/watch?v=dk73U-ogcSA

    // https://lyricstranslate.com/en/crayon-shin-chan-ost-dobutsuen-wa-taihen-da-lyrics.html

    // ℗ 
    // Released on: 
    // Composer, Arranger: 
    // Lyricist: 
    const a = AboutSongs.layouts
    this.dataLayout = [a.KANJI, a.ROMAJI, a.ENGLISH]
    this.data = `

街の動物園は忙しい
ゾウさん風引き
鼻水のシャワーだゾウ
クマさん徹夜で
目にクマが出来た
大変だそりゃ大変だ  私もちょっと大変なのよ
あいつのハート追いかけて
夏の日差しは恋のリズムなのに
どうしてなの一人じゃ踊れない  **夏の動物園は忙しい
サイのおしゃべり
ウルサイ止めてください
カエルのクロールにゃあきれカエル
大変だそりゃ大変だ  私もちょっと大変なのよ
デートの約束したのに  突然のキャンセルなんて
どうしてなの話が違


`
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
