import { AboutSongs, SongBase } from './AboutSongs'
// cspell:disable
export class MinowaBashi extends SongBase {
  // info: https://www.uta-net.com/song/162814/

  constructor () {
    super('三ノ輪橋 (Minowa Bashi)', '半田浩二 (Koji Handa)', 2014)
    // https://www.uta-net.com/song/1420/
    const a = AboutSongs.layouts
    this.dataLayout = [a.KANJI, a.ROMAJI, a.ENGLISH]
    this.data = `

おまえ 黙って鶴を折る
Omae damatte tsuru o oru
You fold paper cranes in silence.

おれは 手酌で酒を飲む
ore wa tejaku de sake wo nomu
I drink sake poured for myself.

別れる それとも やり直す
wakareru soretomo yarinaosu
Should we break up or start over?

口には出せない ことばかり
kuchi ni wa dasenai koto bakari
There are so many things I can't say.

都電 終点 三ノ輪橋
toden shūten Minowa-bashi
The Toden streetcar, last stop Minowabashi.

おでん 熱燗 赤ちょうちん
oden atsukan aka chō-chin
Oden, hot sake, red lantern.

赤ちょうちん
aka chō-chin
Red lantern.

生まれ 故郷は もう他人
Umare furusato wa mō tanin
My hometown is now a stranger.

帰る ところは もうないさ
kaeru tokoro wa mō nai sa
There's nowhere left to go back to.

おまえとおれとの めぐりあい
omae to ore to no meguriai
You and I met,

ぬくもり寄せ合い 住みついた
nukumori yose ai sumitsuita
we shared each other's warmth, and we settled down.

都電 終点 三ノ輪橋
toden shūten Minowa-bashi
The Toden streetcar's last stop is Minowabashi.

路地の奥にも 空がある
roji no oku ni mo sora ga aru
Even at the end of the alley, there's a sky.

空がある
sora ga aru
There's a sky.

表通りに 裏通り
omotedōri ni uradōri
On the main street, on the back street,

雨の降る日も 風の日も
ame no furu hi mo kaze no hi mo
on rainy days, on windy days,

しあわせ半分 それでいい
shiawase hanbun sorede ī
half happiness is fine,

かなしみ半分 それでいい
kanashimi hanbun sorede ī
half sadness is fine,

都電 終点 三ノ輪橋
toden shūten Minowa-bashi
on the Toden streetcar, at Minowabashi,

始発電車で 夜が明ける
shihatsu densha de yogaakeru
the last stop, the night breaks on the first train,

夜が明ける
yogaakeru
the night breaks

`.trim()
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
