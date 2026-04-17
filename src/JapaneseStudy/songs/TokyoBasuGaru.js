import { AboutSongs, SongBase } from './AboutSongs'
// cspell: disable

// https://www.youtube.com/watch?v=cyCzhcd1sMo
// https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%AD%E3%83%A0%E3%83%93%E3%82%A2%E3%83%BB%E3%83%AD%E3%83%BC%E3%82%BA
export class TokyoBasuGaru extends SongBase {
  constructor () {
    super('東京のバスガール', 'コロムビア・ローズ', 1957)
    const a = AboutSongs.layouts
    this.dataLayout = [a.KANJI, a.ROMAJI]
    this.data = `

若い希望も恋もある
Wakai kibō mo koi mo aru

ビルの街から山の手へ
Biru no machi kara Yamanote e

紺の制服身につけて
Kon no seifuku mi ni tsukete

私は東京のバスガール
Watashi wa Tōkyō no basu ga-ru

『発車 オーライ』
"hassha o- rai"

明るく明るく走るのよ
Akaruku akaruku hashiru no yo

昨日心にとめた方
Kinō kokoro ni tometa hō

今日はきれいな人つれて
Kyō wa kireina hito tsurete

夢ははかなく破れても
Yume wa hakanaku yaburete mo

くじけちゃいけないバスガール
Kujike chaikenai basu ga-ru

『発車 オーライ』
"hassha o- rai"

明るく明るく走るのよ
Akaruku akaruku hashiru no yo


酔ったお客の意地悪さ
Yotta okyaku no ijiwarusa

いやな言葉でどなられて
Iyana kotoba de donararete

ほろり落したひとしずく
Horori otoshita hito shizuku

それでも東京のバスガール
Soredemo Tōkyō no basu ga-ru

"hassha o- rai"
『発車 オーライ』

明るく明るく走るのよ
Akaruku akaruku hashiru no yo


`.trim()
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
