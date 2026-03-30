import { SongBase, AboutSongs } from './AboutSongs.js'
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
    // TODO: (in progress)
    this.data = `
街の動物園は忙しい
machi no doubutsuen wa isogashii
The city zoo is busy

大変だそりゃ大変だ
taihen da sorya taihen da
It's terrible, yes, it's terrible

私もちょっと大変なのよ
watashi mo chotto taihen na no yo
I too am a bit of a nightmare





ゾウさん風引き
zou-san kaze hiki
The elephant caught a cold

鼻水のシャワーだゾウ
hanamizu no shawaa da zou
A shower of snot, the elephant

クマさん徹夜で
kuma-san tetsuya de
The bear stayed up all night

目にクマが出来た
me ni kuma ga dekita
Bags under his eyes, the bear

あいつのハート追いかけて
夏の日差しは恋のリズムなのに
どうしてなの一人じゃ踊れない

**夏の動物園は忙しい
サイのおしゃべり
ウルサイ止めてください
カエルのクロールにゃあきれカエル
大変だそりゃ大変だ

私もちょっと大変なのよ
デートの約束したのに
突然のキャンセルなんて
どうしてなの話が違


`
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
