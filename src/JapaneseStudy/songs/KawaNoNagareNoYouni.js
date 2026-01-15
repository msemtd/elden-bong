import { AboutSongs } from './AboutSongs'

export class KawaNoNagareNoYouni extends AboutSongs {
  constructor () {
    super()
    // cspell: disable

    // https://www.uta-net.com/song/1420/
    this.songInfo = {
      titleEn: 'Kawa No Nagare No Youni',
      artist: 'Hibari Misora',
      year: 1989,
    }
    const a = this.layouts
    this.dataLayout = [a.ENGLISH, a.KANJI, a.ROMAJI]
    const data = `
I walked in without knowing it
知らず知らず 歩いて来た
Shirazu shirazu aruite kita

This long and narrow road
細く長いこの道
Hosoku nagai kono michi

If you look back, it's far away
振り返れば 遥か遠く
Furikaere ba haruka tooku

I can see my hometown
故郷が見える
Furusato ga mieru

bumpy roads and winding roads
でこぼこ道や 曲がりくねった道
Dekoboko michi ya, Magarikunetta michi

I don't even have a map, that's life too
地図さえない それもまた人生
Chizu saenai, Sore mo mata jinsei

Ah, like the flow of a river
ああ川の流れのように
Aa kawa no nagare no you ni

Many eras have passed slowly
ゆるやかに いくつも 時代は過ぎて
Yuruyaka ni, Ikutsu mo jidai wa sugite

Ah, like the flow of a river
ああ川の流れのように
Aa kawa no nagare no you ni

The sky is endlessly dyed in twilight
とめどなく 空が黄昏に 染まるだけ
Tomedonaku, Sora ga tasogare ni somaru dake

To live is to travel
生きることは 旅すること
Ikiru koto wa tabi suru koto

This endless road
終わりのない この道
Owari no nai kono michi

Take the person you love close to you
愛する人 そばに連れて
Aisuru hito soba ni tsurete

While searching for a dream
夢探しながら
Yume sagashi nagara

Even on a muddy road in the rain
雨に降られて ぬかるんだ道でも
Ame ni furarete, Nukarunda michi demo

Someday the sun will shine again
いつかはまた 晴れる日が来るから
Itsuka wa mata, Hareru hi ga kuru kara

Ah, like the flow of a river
ああ川の流れのように
Aa kawa no nagare no you ni

I want to leave this body to you calmly
おだやかに この身をまかせていたい
Odayaka ni, Kono mi wo makasete itai

Ah, like the flow of a river
ああ 川の流れのように
Aa kawa no nagare no you ni

As the seasons change, waiting for the snow to melt
移りゆく季節 雪どけを待ちながら
Utsuriyuku, Kisetsu yukidoke wo machi nagara

Ah, like the flow of a river
ああ川の流れのように
Aa kawa no nagare no you ni

I want to leave this body to you calmly
おだやかに この身をまかせていたい
Odayaka ni, Kono mi wo makasete itai

Ah, like the flow of a river
ああ川の流れのように
Aa kawa no nagare no you ni

While listening to the blue babbling forever
いつまでも 青いせせらぎを 聞きながら
Itsu made mo, Aoi seseragi wo kiki nagara
`
    // cspell: enable
    this.lines = data.split('\n\n').filter(x => x.length)
  }
}
