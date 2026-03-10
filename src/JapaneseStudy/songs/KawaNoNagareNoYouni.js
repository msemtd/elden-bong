import { AboutSongs, SongBase } from './AboutSongs'
// cspell: disable
export class KawaNoNagareNoYouni extends SongBase {
  constructor () {
    super('Kawa No Nagare No Youni', '美空ひばり (Hibari Misora)', 1989)
    // https://www.uta-net.com/song/1420/
    // https://www.youtube.com/watch?v=SOCjkXBeKRs
    const a = AboutSongs.layouts
    this.dataLayout = [a.ENGLISH, a.KANJI, a.ROMAJI]
    const data = `
[length: 04:59.800]
[ti: 川の流れのように]
[ar: 美空ひばり (Hibari Misora)]
[tool: LRC Maker https://lrc-maker.github.io]
I walked in without knowing it
知らず知らず 歩いて来た
[00:22.682] Shirazu shirazu aruite kita

This long and narrow road
細く長いこの道
[00:28.093] Hosoku nagai kono michi

If you look back, it's far away
振り返れば 遥か遠く
[00:33.642] Furikaere ba haruka tooku

I can see my hometown
故郷が見える
[00:38.970] Furusato ga mieru

bumpy roads and winding roads
でこぼこ道や 曲がりくねった道
[00:43.906] Dekoboko michi ya, Magarikunetta michi

I don't even have a map, that's life too
地図さえない それもまた人生
[00:54.962] Chizu saenai, Sore mo mata jinsei

Ah, like the flow of a river
ああ川の流れのように
[01:07.499] Aa kawa no nagare no you ni

Many eras have passed slowly
ゆるやかに いくつも 時代は過ぎて
[01:17.397] Yuruyaka ni, Ikutsu mo jidai wa sugite

Ah, like the flow of a river
ああ川の流れのように
[01:28.579] Aa kawa no nagare no you ni

The sky is endlessly dyed in twilight
とめどなく 空が黄昏に 染まるだけ
[01:38.509] Tomedonaku, Sora ga tasogare ni somaru dake

To live is to travel
生きることは 旅すること
[02:15.883] Ikiru koto wa tabi suru koto

This endless road
終わりのない この道
[02:21.348] Owari no nai kono michi

Take the person you love close to you
愛する人 そばに連れて
[02:26.435] Aisuru hito soba ni tsurete

While searching for a dream
夢探しながら
[02:31.964] Yume sagashi nagara

Even on a muddy road in the rain
雨に降られて ぬかるんだ道でも
[02:36.972] Ame ni furarete, Nukarunda michi demo

Someday the sun will shine again
いつかはまた 晴れる日が来るから
[02:48.294] Itsuka wa mata, Hareru hi ga kuru kara

Ah, like the flow of a river
ああ川の流れのように
[03:00.780] Aa kawa no nagare no you ni

I want to leave this body to you calmly
おだやかに この身をまかせていたい
[03:10.725] Odayaka ni, Kono mi wo makasete itai

Ah, like the flow of a river
ああ 川の流れのように
[03:21.868] Aa kawa no nagare no you ni

As the seasons change, waiting for the snow to melt
移りゆく季節 雪どけを待ちながら
[03:31.749] Utsuriyuku, Kisetsu yukidoke wo machi nagara

Ah, like the flow of a river
ああ川の流れのように
[03:48.223] Aa kawa no nagare no you ni

I want to leave this body to you calmly
おだやかに この身をまかせていたい
[03:58.037] Odayaka ni, Kono mi wo makasete itai

Ah, like the flow of a river
ああ川の流れのように
[04:09.293] Aa kawa no nagare no you ni

While listening to the blue babbling forever
いつまでも 青いせせらぎを 聞きながら
[04:19.165] Itsu made mo, Aoi seseragi wo kiki nagara


`.trim()
    // cspell: enable
    this.lines = data.split('\n\n').filter(x => x.length)
  }
}
