import { AboutSongs, SongBase } from './AboutSongs'
// cspell: disable

// https://www.youtube.com/watch?v=cyCzhcd1sMo
// https://ja.wikipedia.org/wiki/%E3%82%B3%E3%83%AD%E3%83%A0%E3%83%93%E3%82%A2%E3%83%BB%E3%83%AD%E3%83%BC%E3%82%BA
export class TokyoBasuGaru extends SongBase {
  constructor () {
    super('東京のバスガール', 'コロムビア・ローズ', 1957)
    const a = AboutSongs.layouts
    this.dataLayout = [a.KANJI]
    this.data = `

若い希望も
恋もある
ビルの街から
山の手へ
紺の制服
身につけて
私は東京の
バスガール
『発車 オーライ』
明るく明るく
走るのよ

昨日心に
とめた方
今日はきれいな
人つれて
夢ははかなく
破れても
くじけちゃいけない
バスガール
『発車 オーライ』
明るく明るく
走るのよ

酔ったお客の
意地悪さ
いやな言葉で
どなられて
ほろり落した
ひとしずく
それでも東京の
バスガール
『発車 オーライ』
明るく明るく
走るのよ

`.trim()
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
