import { AboutSongs, SongBase } from './AboutSongs'
// cspell:words Sangatsu Kokonoka
export class SangatsuKokonoka extends SongBase {
  constructor () {
    super('3月9日 (March 9th)', 'レミオロメン (Remioromen)', 2005)
    this.misc = `

3月9日
レミオロメン
https://ja.wikipedia.org/wiki/3%E6%9C%889%E6%97%A5_(%E6%9B%B2)
https://ja.wikipedia.org/wiki/%E3%83%AC%E3%83%9F%E3%82%AA%E3%83%AD%E3%83%A1%E3%83%B3

`
    const a = AboutSongs.layouts
    this.dataLayout = [a.ENGLISH, a.KANJI, a.ROMAJI]
    // cspell:disable
    this.data = `

In the middle of the flowing seasons
流れる季節の真ん中で
Nagareru kisetsu no man'naka de

I suddenly feel the length of the day
ふと日の長さを感じます
futo hi no naga-sa o kanjimasu

In the busy days
せわしく過ぎる日々の中に
sewashiku sugiru hibi no naka ni

me and you draw a dream
私とあなたで夢を描く
watashi to anata de yume o egaku

Put your thoughts on the March wind
３月の風に想いをのせて
sangatsu no kaze ni omoi o nosete

Cherry blossom buds continue into spring
桜のつぼみは春へと続きます
sakura no tsubomi wa haru e to tsudzukimasu

The particles of light overflowing
溢れ出す光の粒が
Afure dasu hikari no tsubu ga

Warm up the morning little by little
少しずつ朝を暖めます
sukoshi zutsu asa o atatamemasu

after a big yawn
大きなあくびをした後に
ōkina akubi o shita nochi ni

Next to you who is a little shy
少し照れてるあなたの横で
sukoshi tere teru anata no yoko de

Standing at the entrance to a new world
新たな世界の入口に立ち
aratana sekai no iriguchi ni tachi

What I realized is that I'm not alone
気づいたことは1人じゃないってこと
kidzuita koto wa hitori janai tte koto

When I close my eyes, you
瞳を閉じればあなたが
Hitomi o tojireba anata ga

By being behind the eyelids
まぶたの裏にいることで
mabuta no ura ni iru koto de

How strong could you become?
どれほど強くなれたでしょう
dorehodo tsuyoku naretadeshou

I want to be the same for you
あなたにとって私もそうでありたい
anata ni totte watashi mo sōdearitai

A whirlwind carrying dust
砂ぼこり運ぶつむじ風
Sunabokori hakobu tsumujikaze

It gets tangled in laundry
洗濯物に絡まりますが
sentakubutsu ni karamarimasuga

The white moon in the sky before noon
昼前の空の白い月は
hirumae no sora no shiroi tsuki wa

It was so beautiful that I could see it
なんだか綺麗で見とれました
nandaka kireide mitoremashita

Sometimes things don't go well, but
上手くはいかぬこともあるけれど
umaku wa ikanu koto moarukeredo

When I look up to the sky, even it is small
天を仰げばそれさえ小さくて
ten o aogeba sore sae chīsakute

The blue sky is clear and dignified
青い空は凛と澄んで
Aoi sora wa rinto sunde

The sheep clouds sway quietly
羊雲は静かに揺れる
hitsujikumo wa shizuka ni yureru

The joy of waiting for flowers to bloom
花咲くを待つ喜びを
hanasaku o matsu yorokobi o

I'm happy if I can share it
分かち合えるのであればそれは幸せ
wakachi aeru nodeareba sore wa shiawase

Smile softly next to me
この先の隣でそっと微笑んで
Kono saki no tonari de sotto hohoende

When I close my eyes, you
瞳を閉じればあなたが
hitomi o tojireba anata ga

By being behind the eyelids
まぶたの裏にいることで
mabuta no ura ni iru koto de

How strong could you become?
どれほど強くなれたでしょう
dorehodo tsuyoku naretadeshou

I want to be the same for you
あなたにとって私もそうでありたい
anata ni totte watashi mo sōdearitai

La-la-la-la, la-la-la-la-la
La-la-la-la, la-la-la-la-la
La-la-la-la, la-la-la-la-la

La-la-la-la, la-la-la-la-la
La-la-la-la, la-la-la-la-la
La-la-la-la, la-la-la-la-la

La-la-la-la, la-la-la-la-la
La-la-la-la, la-la-la-la-la
La-la-la-la, la-la-la-la-la

Ah-ah
Ah-ah
Ah-ah

    `.trim()
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
