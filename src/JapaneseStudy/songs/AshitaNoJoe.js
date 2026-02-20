import { AboutSongs, SongBase } from './AboutSongs'
// cspell: disable

export class AshitaNoJoe extends SongBase {
  constructor () {
    super('あしたのジョー (Ashita No Joe)', '尾藤イサオ (Isao Bito)', 1970)
    this.singAlongVideo = 'https://www.youtube.com/watch?v=1EguOrIrZ4s&t=5s'
    const a = AboutSongs.layouts
    this.dataLayout = [a.KANJI, a.ROMAJI, a.ENGLISH]
    this.data = `


サンドバッグに 浮かんで消える
Sandobaggu ni, ukande kieru
On the sandbag, it appears and disappears

憎いあんちくしょうの 顔めがけ
Nikui anchikushou no kao megake
The face of that guy who I hate

たたけ！ たたけ！ たたけ！
Tatake! Tatake! Tatake!
Hit it! Hit it! Hit it!

俺らにゃ けものの血がさわぐ
Oiranya kemono no chi ga sawagu
An animal instinct within me is getting louder

だけど ルルル……
Dakedo rururu...
But lululu.....

あしたはきっと なにかある
Ashita wa kitto nani ga aru
There will be something waiting for me tomorrow

あしたは どっちだ
Ashita wa docchi da
Which way is to tomorrow?

親のある奴は くにへ帰れ
Oya no aru yatsu wa, kuni e kaere
If you have parents, go back to your home

俺とくる奴は 狼だ
Ore to kuru yatsu wa, ookami da!
If you are coming with me, you are a wolf

吠えろ！ 吠えろ！ 吠えろ！
Hoero! Hoero! Hoero!
Howl! Howl! Howl!

俺らにゃ 荒野がほしいんだ
Oiranya kouya ga hoshiinda
I want a wasteland

だけど ルルル……
Dakedo rururu...
But lululu.....

あしたはきっと なにかある
Ashita wa kitto nanika aru
There will be something waiting for me tomorrow

あしたは どっちだ
Ashita wa docchi da
Which way is to tomorrow?

少年院の 夕焼け空が
Shounenin no, yuuyake sora ga
The sky from Juvenile Detention

燃えているんだ ぎらぎらと
Moeteirunda, giragira to
Is burning red brightly

やるぞ！ やるぞ！ やるぞ！
Yaruzo! Yaruzo! Yaruzo!
I'll do it! I'll do it! I'll do it!

俺らにゃ 闘う意地がある
Oiranya tatakau iji ga aru
I have a determination to fight

だけど ルルル……
Dakedo rururu...
But lululu.....

あしたはきっと なにかある
Ashita wa kitto nanika aru
There will be something waiting for me tomorrow

あしたは どっちだ
Ashita wa docchi da
Which way is to tomorrow?

`.trim()
    // cspell: enable
    this.lines = this.data.split('\n\n').filter(x => x.length)
  }
}
