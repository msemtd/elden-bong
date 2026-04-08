// cspell: words Kyōiku kyouiku wanikani
// Kyōiku kanji by graded level, from https://en.wikipedia.org/wiki/Ky%C5%8Diku_kanji
// also kanji by wanikani level https://www.wanikani.com/kanji
// https://www.mext.go.jp/component/a_menu/education/micro_detail/__icsFiles/afieldfile/2018/09/05/1384661_4_3_2.pdf

const kyouikuKanji = []

export class KyouikuKanji {
  /**
   * Get the Kyōiku kanji for a given grade level (1-6).
   * If no grade is provided, returns all Kyōiku kanji.
   */
  static getKyouikuKanji (grade) {
    if (!kyouikuKanji.length) {
      kyouikuKanji.push(...KyouikuKanji.buildKyouikuKanji())
    }
    if (!grade) {
      return kyouikuKanji
    }
    if (grade < 1 || grade > 6) {
      throw Error('Invalid grade. Grade must be between 1 and 6.')
    }
    return kyouikuKanji[grade - 1]
  }

  // cspell:disable
  static buildKyouikuKanji () {
    // First grade (80 kanji)
    const kyouikuKanjiGrade1 = `
# | Kanji | Meaning | On'yomi | Kun'yomi | Strokes
1 | 一 | one | ichi, itsu | hito-tsu | 1
2 | 二 | two | ni, ji | futa-tsu | 2
3 | 三 | three | san | mit-tsu | 3
4 | 四 | four | shi | yot-tsu, yon | 5
5 | 五 | five | go | itsu-tsu | 4
6 | 六 | six | roku | mut-tsu | 4
7 | 七 | seven | shichi | nana-tsu, nana | 2
8 | 八 | eight | hachi | yat-tsu | 2
9 | 九 | nine | ku, kyū | kokono-tsu | 2
10 | 十 | ten | jū | tō | 2
11 | 百 | hundred | hyaku | momo | 6
12 | 千 | thousand | sen | chi | 3
13 | 上 | top, above | jō | ue | 3
14 | 下 | bottom, below | ka, ge | shita, shimo, moto | 3
15 | 左 | left | sa | hidari | 5
16 | 右 | right | u, yū | migi | 5
17 | 中 | inside, middle | chū, jū | naka | 4
18 | 大 | large | dai, tai | ō-kii, ō | 3
19 | 小 | small | shō | chii-sai, ko, o | 3
20 | 月 | month, moon | gatsu, getsu | tsuki | 4
21 | 日 | day, sun | nichi, jitsu | hi, ka | 4
22 | 年 | year | nen | toshi | 6
23 | 早 | early | sō, sa | haya-i | 6
24 | 木 | tree | moku, boku | ki | 4
25 | 林 | woods | rin | hayashi | 8
26 | 山 | mountain | san | yama | 3
27 | 川 | river | sen | kawa | 3
28 | 土 | soil | to, do | tsuchi | 3
29 | 空 | sky, empty | kū | sora, a-ku, kara | 8
30 | 田 | rice field | den | da, ta | 5
31 | 天 | heaven, sky | ten | ame, ama | 4
32 | 生 | living, birth, raw | sei, shō | i-kiru, u-mu, nama | 5
33 | 花 | flower | ka | hana | 7
34 | 草 | grass | sō | kusa | 9
35 | 虫 | insect | chū | mushi | 6
36 | 犬 | dog | ken | inu | 4
37 | 人 | person | jin, nin | hito | 2
38 | 名 | name | mei, myō | na | 6
39 | 女 | female | jo, nyo | on'na | 3
40 | 男 | male | dan, nan | otoko | 7
41 | 子 | child | shi, su | ko | 3
42 | 目 | eye | moku | me | 5
43 | 耳 | ear | ji, ni | mimi | 6
44 | 口 | mouth | kō | kuchi | 3
45 | 手 | hand | shu | te | 4
46 | 足 | foot, suffice | soku | ashi, ta-riru | 7
47 | 見 | see | ken, gen | mi-ru | 7
48 | 音 | sound | on | ne, oto | 9
49 | 力 | power | riki, ryoku | chikara | 2
50 | 気 | spirit, air | ki, ke | iki | 6
51 | 円 | yen, circle | en | maru | 4
52 | 入 | enter | nyū | hai-ru, i-ru | 2
53 | 出 | exit | shutsu | de-ru | 5
54 | 立 | stand up | ritsu | ta-tsu | 5
55 | 休 | rest | kyū | yasu-mu | 6
56 | 先 | previous | sen | saki | 6
57 | 夕 | evening | seki | yū | 3
58 | 本 | book | hon | moto | 5
59 | 文 | text | bun, mon | fumi | 4
60 | 字 | character | ji | aza | 6
61 | 学 | study | gaku | mana-bu | 8
62 | 校 | school | kō | kase | 10
63 | 村 | village | son | mura | 7
64 | 町 | town | chō | machi | 7
65 | 森 | forest | shin | mori | 12
66 | 正 | correct | sei, shō | tada-shii, masa | 5
67 | 水 | water | sui | mizu | 4
68 | 火 | fire | ka | hi | 4
69 | 玉 | jewel, ball | gyoku | tama | 5
70 | 王 | king | ō | kimi | 4
71 | 石 | stone | seki, koku | ishi | 5
72 | 竹 | bamboo | chiku | take | 6
73 | 糸 | thread | shi | ito | 6
74 | 貝 | shellfish | bai | kai | 7
75 | 車 | vehicle | sha | kuruma | 7
76 | 金 | gold, money | kin | kane, kana | 8
77 | 雨 | rain | u | ame, ama | 8
78 | 赤 | red | seki | aka | 7
79 | 青 | blue | sei, shō | ao | 8
80 | 白 | white | haku | shiro, shira | 5
`
    // Second grade (160 kanji)
    const kyouikuKanjiGrade2 = `
# | Kanji | Meaning | On | Kun | Strokes
81 | 数 | number, count | sū | kazu | 13
82 | 多 | many, much | ta | oo-i | 6
83 | 少 | a few, a little | shō | suku-nai, suko-shi | 4
84 | 万 | ten thousand | ban, man | yorozu | 3
85 | 半 | half | han | naka-ba | 5
86 | 形 | shape | kei, gyō | katachi | 7
87 | 太 | thick | ta | futo-i | 4
88 | 細 | thin | sai | hoso-i | 11
89 | 広 | wide | kō | hiro-i | 5
90 | 長 | long, leader | chō | naga-i | 8
91 | 点 | point | ten | bochi | 9
92 | 丸 | circle | gan | maru | 3
93 | 交 | intersect | kō | maji-waru | 6
94 | 光 | light | kō | hikari | 6
95 | 角 | corner, horn | kaku | kado, tsuno, sumi | 7
96 | 計 | measure | kei | haka-ru | 9
97 | 直 | straight, fix | choku, jiki | tada-chini, nao-su | 8
98 | 線 | line | sen | suji | 15
99 | 矢 | arrow | shi | ya | 5
100 | 弱 | weak | jaku | yowa-i | 10
101 | 強 | strong | kyō | tsuyo-i | 11
102 | 高 | high | kō | taka-i | 10
103 | 同 | same | dō | ona-ji | 6
104 | 親 | parent | shin | oya | 16
105 | 母 | mother | bo | haha, kā | 5
106 | 父 | father | fu | chichi, tou | 4
107 | 姉 | older sister | shi | ane | 8
108 | 兄 | older brother | kei, kyō | ani | 5
109 | 弟 | younger brother | tei, dai | otōto | 7
110 | 妹 | younger sister | mai | imōto | 8
111 | 自 | oneself | ji, shi | mizuka-ra | 6
112 | 友 | friend | yū | tomo | 4
113 | 体 | body | tai | karada | 7
114 | 毛 | hair | mō | ke | 4
115 | 頭 | head | tō | atama | 16
116 | 顔 | face | gan | kao | 18
117 | 首 | neck | shu | kubi | 9
118 | 心 | heart | shin | kokoro | 4
119 | 時 | time | ji | toki | 10
120 | 曜 | day of the week | yō |  | 18
121 | 朝 | morning | chō | asa | 12
122 | 昼 | daytime | chū | hiru | 9
123 | 夜 | night | ya | yoru | 8
124 | 分 | minute, understand | fun, bun | wa-karu | 4
125 | 週 | week | shū |  | 11
126 | 春 | spring | shun | haru | 9
127 | 夏 | summer | ka | natsu | 10
128 | 秋 | autumn | shū | aki | 9
129 | 冬 | winter | tō | fuyu | 5
130 | 今 | now | kon | ima | 4
131 | 新 | new | shin | atara-shii, ara-ta | 13
132 | 古 | old | ko | furu-i | 5
133 | 間 | interval | kan, ken | ma, aida | 12
134 | 方 | direction | hō | kata | 4
135 | 北 | north | hoku | kita | 5
136 | 南 | south | nan | minami | 9
137 | 東 | east | tō | higashi, azuma | 8
138 | 西 | west | sei, sai | nishi | 6
139 | 遠 | far | en | tō-i | 13
140 | 近 | near | kin | chika-i | 7
141 | 前 | before | zen | mae | 9
142 | 後 | after | go, kō | nochi, ushi-ro, ato | 9
143 | 内 | inside | nai | uchi | 4
144 | 外 | outside | gai, ge | soto, hoka, hazu-su | 5
145 | 場 | place | jō | ba | 12
146 | 地 | ground | chi, ji |  | 6
147 | 国 | country | koku | kuni | 8
148 | 園 | garden | en | sono | 13
149 | 谷 | valley | koku | tani | 7
150 | 野 | field | ya | no | 11
151 | 原 | meadow, plain | gen | hara | 10
152 | 里 | hometown | ri | sato | 7
153 | 市 | city | shi | ichi | 5
154 | 京 | capital | kyō, kei | miyako | 8
155 | 風 | wind, -style | fū | kaze | 9
156 | 雪 | snow | setsu | yuki | 11
157 | 雲 | cloud | un | kumo | 12
158 | 池 | pond | chi | ike | 6
159 | 海 | sea | kai | umi | 9
160 | 岩 | rock | gan | iwa | 8
161 | 星 | star | sei | hoshi | 9
162 | 室 | room | shitsu | muro | 9
163 | 戸 | door | ko | to, be | 4
164 | 家 | house | ka, ke | ie | 10
165 | 寺 | Buddhist temple | ji | tera | 6
166 | 通 | pass through, commute | tsū | tō-ru, kayo-u | 10
167 | 門 | gates | mon | kado | 8
168 | 道 | road | dō | michi | 12
169 | 話 | talk | wa | hanashi, hana-su | 13
170 | 言 | say | gen, gon | i-u, koto | 7
171 | 答 | answer | tō | kota-eru | 12
172 | 声 | voice | sei | koe | 7
173 | 聞 | hear, listen, ask | bun, mon | ki-ku | 14
174 | 語 | language | go | kata-ru | 14
175 | 読 | read | doku | yo-mu | 14
176 | 書 | write | sho | ka-ku | 10
177 | 記 | record | ki | shiru-su | 10
178 | 紙 | paper | shi | kami | 10
179 | 画 | brush stroke | ga, kaku |  | 8
180 | 絵 | picture | kai, e |  | 12
181 | 図 | drawing | zu | haka-ru | 7
182 | 工 | craft | kō, ku |  | 3
183 | 教 | teach | kyō | oshi-eru | 11
184 | 晴 | clear | sei | hare | 12
185 | 思 | think | shi | omo-u | 9
186 | 考 | consider | kō | kanga-eru | 6
187 | 知 | know | chi | shi-ru | 8
188 | 才 | age, ability | sai, zai | wazukani, zae | 3
189 | 理 | reason | ri | kotowari | 11
190 | 算 | calculate | san |  | 14
191 | 作 | make | saku | tsuku-ru | 7
192 | 元 | origin | gen, gan | moto | 4
193 | 食 | eat | shoku | ta-beru, ku-u | 9
194 | 肉 | meat | niku |  | 6
195 | 馬 | horse | ba | uma, ma | 10
196 | 牛 | cow | gyū | ushi | 4
197 | 魚 | fish | gyo | sakana | 11
198 | 鳥 | bird | chō | tori | 11
199 | 羽 | feather | u | ha, hane | 6
200 | 鳴 | chirp | mei | na-ku | 14
201 | 麦 | wheat | baku | mugi | 7
202 | 米 | rice | bei, mai | kome | 6
203 | 茶 | tea | cha, sa |  | 9
204 | 色 | colour | shoku | iro | 6
205 | 黄 | yellow | ō | ki | 11
206 | 黒 | black | koku | kuro | 11
207 | 来 | come | rai | ku-ru | 7
208 | 行 | go | kō, gyō | i-ku, yu-ku, okona-u | 6
209 | 帰 | return | ki | kae-ru | 10
210 | 歩 | walk | ho, fu, bu | aru-ku, ayu-mu | 8
211 | 走 | run | sō | hashi-ru | 7
212 | 止 | stop | shi | to-maru | 4
213 | 活 | active | katsu | i-kiru | 9
214 | 店 | store | ten | mise | 8
215 | 買 | buy | bai | ka-u | 12
216 | 売 | sell | bai | u-ru | 7
217 | 午 | noon | go | uma | 4
218 | 汽 | steam | ki |  | 7
219 | 弓 | bow | kyū | yumi | 3
220 | 回 | number of times, revolve | kai | mawa-ru | 6
221 | 会 | meet | kai, e | a-u | 6
222 | 組 | team | so | kumi | 11
223 | 船 | ship | sen | fune | 11
224 | 明 | bright | mei | aka-rui | 8
225 | 社 | company | sha | yashiro | 7
226 | 切 | cut | setsu | ki-ru | 4
227 | 電 | electricity | den | inazuma | 13
228 | 毎 | every | mai | goto | 6
229 | 合 | fit | gō | a-u | 6
230 | 当 | this, hit | tō | a-taru | 6
231 | 台 | pedestal | dai, tai |  | 5
232 | 楽 | music, pleasure | gaku, raku | tano-shii | 13
233 | 公 | public | kō | ōyake | 4
234 | 引 | pull | in | hi-ku | 4
235 | 科 | section, grade | ka |  | 9
236 | 歌 | song | ka | uta | 14
237 | 刀 | sword | tō | katana | 2
238 | 番 | number | ban |  | 12
239 | 用 | use | yō | mochi-iru | 5
240 | 何 | what | ka | nani, nan | 7
`
    // Third grade (200 kanji)
    const kyouikuKanjiGrade3 = `
# | Kanji | Meaning | On | Kun | Strokes
241 | 丁 | street, district | chō | hinoto | 2
242 | 世 | generation | sei, se | yo | 5
243 | 両 | both | ryō | teru, futatsu | 6
244 | 主 | master, main | shu | nushi, omo | 5
245 | 乗 | ride | jō | no-ru | 9
246 | 予 | beforehand | yo | arakaji-me | 4
247 | 事 | intangible thing | ji | koto | 8
248 | 仕 | serve | shi | tsuka-eru | 5
249 | 他 | other | ta | hoka | 5
250 | 代 | era, substitute | dai, tai | ka-waru, yo | 5
251 | 住 | dwell | jū | su-mu | 7
252 | 使 | use | shi | tsuka-u | 8
253 | 係 | person in charge | kei | kakari, kaka-ru | 9
254 | 倍 | double | bai |  | 10
255 | 全 | whole | zen | matta-ku | 6
256 | 具 | tool | gu | sona-eru, tsubusa-ni | 8
257 | 写 | copy | sha | utsu-su | 5
258 | 列 | row | retsu |  | 6
259 | 助 | help | jo | tasu-keru | 7
260 | 勉 | diligence | ben | tsuto-meru | 10
261 | 動 | move | dō | ugo-ku | 11
262 | 勝 | win | shō | ka-tsu | 12
263 | 化 | change | ka | ba-keru | 4
264 | 区 | district | ku |  | 4
265 | 医 | doctor | i | iya-su, i-suru | 7
266 | 去 | leave | kyo, ko | sa-ru | 5
267 | 反 | anti- | han | so-ru | 4
268 | 取 | take | shu | to-ru | 8
269 | 受 | receive | ju | u-keru | 8
270 | 号 | number | gō | yobina, sake-bu | 5
271 | 向 | face | kō | mu-kau | 6
272 | 君 | you, monarch | kun | kimi | 7
273 | 味 | flavor | mi | aji, aji-wau | 8
274 | 命 | fate, life | mei | inochi | 8
275 | 和 | harmony, Japanese | wa | yawa-ragu, nago-yaka | 8
276 | 品 | article | hin | shina | 9
277 | 員 | employee | in |  | 10
278 | 商 | commerce | shō |  | 11
279 | 問 | question | mon | to-u, ton | 11
280 | 坂 | slope | han | saka | 7
281 | 央 | center | ō |  | 5
282 | 始 | begin | shi | haji-meru | 8
283 | 委 | committee | i | yuda-neru | 8
284 | 守 | protect | shu | mamo-ru | 6
285 | 安 | cheap, calm | an | yasu-i | 6
286 | 定 | determine | tei, jō | sada-meru | 8
287 | 実 | fruit, realization | jitsu | mi, mino-ru | 8
288 | 客 | guest | kyaku |  | 9
289 | 宮 | Shinto shrine, prince | kyū, gū | miya | 10
290 | 宿 | inn | shuku | yado, yado-ru | 11
291 | 寒 | cold (weather) | kan | samu-i | 12
292 | 対 | opposite, against | tai, tsui | aite, soro-i | 7
293 | 局 | office | kyoku | tsubone | 7
294 | 屋 | roof | oku | ya | 9
295 | 岸 | shore | gan | kishi | 8
296 | 島 | island | tō | shima | 10
297 | 州 | state, province | shū | su | 6
298 | 帳 | notebook | chō | tobari | 11
299 | 平 | flat | hei, byō | tai-ra, hira | 5
300 | 幸 | happiness | kō | saiwa-i, shiawa-se | 8
301 | 度 | degrees | do | tabi | 9
302 | 庫 | warehouse | ko, ku | kura | 10
303 | 庭 | yard | tei | niwa | 10
304 | 式 | style, ceremony, numerical formula | shiki |  | 6
305 | 役 | role | yaku |  | 7
306 | 待 | wait | tai | ma-tsu | 9
307 | 急 | hurry | kyū | iso-gu | 9
308 | 息 | breath | soku | iki | 10
309 | 悪 | bad | aku | waru-i | 11
310 | 悲 | sad | hi | kana-shii | 12
311 | 想 | thought | sō |  | 13
312 | 意 | idea | i |  | 13
313 | 感 | feel | kan | kan-jiru | 13
314 | 所 | place | sho | tokoro | 8
315 | 打 | hit | da | u-tsu | 5
316 | 投 | throw | tō | na-geru | 7
317 | 拾 | pick up | shū | hiro-u | 9
318 | 持 | hold | ji | mo-tsu | 9
319 | 指 | finger, point | shi | yubi, sa-su | 9
320 | 放 | release | hō | hana-su | 8
321 | 整 | organize | sei | totono-eru | 16
322 | 旅 | trip | ryo | tabi | 10
323 | 族 | tribe | zoku |  | 11
324 | 昔 | long ago | seki, shaku | mukashi | 8
325 | 昭 | shine | shō |  | 9
326 | 暑 | hot | sho | atsu-i | 12
327 | 暗 | dark | an | kura-i | 13
328 | 曲 | melody, curve | kyoku | ma-garu | 6
329 | 有 | possess | yū | a-ru | 6
330 | 服 | clothes | fuku |  | 8
331 | 期 | period of time | ki |  | 12
332 | 板 | board | han, ban | ita | 8
333 | 柱 | pillar | chū | hashira | 9
334 | 根 | root | kon | ne | 10
335 | 植 | plant | shoku | u-eru | 12
336 | 業 | business | gyō |  | 13
337 | 様 | appearance | yō | sama | 14
338 | 横 | horizontal | ō | yoko | 15
339 | 橋 | bridge | kyō | hashi | 16
340 | 次 | next | ji | tsugi, tsu-gu | 6
341 | 歯 | tooth | shi | ha | 12
342 | 死 | death | shi | shi-nu | 6
343 | 氷 | ice | hyō | kōri | 5
344 | 決 | decide | ketsu | ki-meru | 7
345 | 油 | oil | yu | abura | 8
346 | 波 | wave | ha | nami | 8
347 | 注 | pour | chū | soso-gu | 8
348 | 泳 | swim | ei | oyo-gu | 8
349 | 洋 | ocean | yō |  | 9
350 | 流 | stream | ryū | naga-reru | 10
351 | 消 | extinguish | shō | ki-eru, ke-su | 10
352 | 深 | deep | shin | fuka-i | 11
353 | 温 | warm | on | atata-kai | 12
354 | 港 | harbor | kō | minato | 12
355 | 湖 | lake | ko | mizu'umi | 12
356 | 湯 | hot water | tō | yu | 12
357 | 漢 | Chinese | kan |  | 13
358 | 炭 | charcoal | tan | sumi | 9
359 | 物 | (tangible) thing | butsu, motsu | mono | 8
360 | 球 | sphere | kyū | tama | 11
361 | 由 | reason | yū, yu | yoshi | 5
362 | 申 | say | shin | mō-su | 5
363 | 界 | world | kai |  | 9
364 | 畑 | farm |  | hata, hatake | 9
365 | 病 | sick | byō | yamai | 10
366 | 発 | departure | hatsu |  | 9
367 | 登 | climb | tō, to | nobo-ru | 12
368 | 皮 | skin | hi | kawa | 5
369 | 皿 | dish | bei | sara | 5
370 | 相 | mutual | sō | ai | 9
371 | 県 | prefecture | ken | ka-keru | 9
372 | 真 | true | shin | ma | 10
373 | 着 | wear, arrive | chaku | ki-ru, tsu-ku | 12
374 | 短 | short | tan | mijika-i | 12
375 | 研 | sharpen | ken | to-gu | 9
376 | 礼 | manners | rei |  | 5
377 | 神 | deity | shin, jin | kami | 9
378 | 祭 | festival | sai | matsu-ri | 11
379 | 福 | luck | fuku |  | 13
380 | 秒 | second | byō |  | 9
381 | 究 | research | kyū | kiwa-meru | 7
382 | 章 | chapter | shō |  | 11
383 | 童 | juvenile | dō | warabe | 12
384 | 笛 | flute | teki | fue | 11
385 | 第 | ordinal | dai |  | 11
386 | 筆 | writing brush | hitsu | fude | 12
387 | 等 | class | tō | hito-shii | 12
388 | 箱 | box | sō | hako | 15
389 | 級 | rank | kyū |  | 9
390 | 終 | end | shū | o-waru, o-eru | 11
391 | 緑 | green | ryoku | midori | 14
392 | 練 | practice | ren | ne-ru | 14
393 | 羊 | sheep | yō | hitsuji | 6
394 | 美 | beauty | bi | utsuku-shii | 9
395 | 習 | learn | shū | nara-u | 11
396 | 者 | someone | sha | mono | 8
397 | 育 | raise | iku | soda-tsu | 8
398 | 苦 | suffer, bitter | ku | kuru-shii, niga-i | 8
399 | 荷 | luggage | ka | ni | 10
400 | 落 | fall | raku | o-chiru, o-tosu | 12
401 | 葉 | leaf | yō | ha | 12
402 | 薬 | medicine | yaku | kusuri | 16
403 | 血 | blood | ketsu | chi | 6
404 | 表 | express | hyō | omote, arawa-su | 8
405 | 詩 | poem | shi | uta | 13
406 | 調 | tone, find | chō | shira-beru | 15
407 | 談 | discuss | dan |  | 15
408 | 豆 | bean | tō, zu | mame | 7
409 | 負 | lose | fu | ma-keru, o-u | 9
410 | 起 | awaken | ki | o-kiru | 10
411 | 路 | path | ro | ji | 13
412 | 身 | body | shin | mi | 7
413 | 転 | to shift, fall down | ten | koro-bu | 11
414 | 軽 | lightweight | kei | karu-i | 12
415 | 農 | agriculture | nō |  | 13
416 | 返 | return | hen | kae-su | 7
417 | 追 | follow | tsui | o-u | 9
418 | 送 | send | sō | oku-ru | 9
419 | 速 | fast | soku | haya-i | 10
420 | 進 | progress | shin | susu-mu | 11
421 | 遊 | play | yū | aso-bu | 12
422 | 運 | carry | un | hako-bu | 12
423 | 部 | part | bu |  | 11
424 | 都 | metropolis | to, tsu | miyako | 11
425 | 配 | distribute | hai | kuba-ru | 10
426 | 酒 | liquor | shu | sake, saka | 10
427 | 重 | heavy, gravity, pile | jū, chō | omo-i, kasa-neru | 9
428 | 鉄 | iron | tetsu | kurogane | 13
429 | 銀 | silver | gin | shirogane | 14
430 | 開 | open | kai | hira-ku, a-ku | 12
431 | 院 | institution | in |  | 10
432 | 陽 | sun | yō | hi | 12
433 | 階 | storey | kai | kizahashi | 12
434 | 集 | gather | shū | atsu-maru | 12
435 | 面 | surface | men | omote, tsura | 9
436 | 題 | topic | dai |  | 18
437 | 飲 | drink | in | no-mu | 12
438 | 館 | public building | kan | tate | 16
439 | 駅 | station | eki |  | 14
440 | 鼻 | nose | bi | hana | 14

`
    // Fourth grade (202 kanji)
    const kyouikuKanjiGrade4 = `
# | Kanji | Meaning | On | Kun | Strokes
441 | 不 | not | fu, bu |  | 4
442 | 争 | conflict | sō | araso-u | 6
443 | 井 | well | sei, shō | i, ido | 4
444 | 付 | attach | fu | tsu-ku | 5
445 | 令 | orders | rei |  | 5
446 | 以 | reference point | i |  | 5
447 | 仲 | relationship | chū | naka | 6
448 | 伝 | convey | den | tsuta-eru | 6
449 | 位 | rank | i | kurai | 7
450 | 低 | low | tei | hiku-i | 7
451 | 佐 | assist | sa | tasuke, tasukeru, suke | 7
452 | 例 | example | rei | tato-eru | 8
453 | 便 | facility, flight, mail | ben, bin | tayo-ri | 9
454 | 信 | trust | shin |  | 9
455 | 倉 | storage | sō | kura | 10
456 | 候 | climate | kō |  | 10
457 | 借 | borrow | shaku | ka-riru | 10
458 | 健 | healthy | ken | suko-yaka | 11
459 | 側 | side | soku | kawa | 11
460 | 働 | work | dō | hatara-ku | 13
461 | 億 | hundred million | oku |  | 15
462 | 兆 | portent, trillion | chō | kiza-shi | 6
463 | 児 | offspring | ji, ni | ko | 7
464 | 共 | together | kyō | tomo | 6
465 | 兵 | soldier | hei, hyō | tsuwamono | 7
466 | 典 | code | ten |  | 8
467 | 冷 | cool | rei | tsume-tai, hi-eru, sa-meru | 7
468 | 初 | first | sho | hatsu, haji-me | 7
469 | 別 | separate | betsu | waka-reru | 7
470 | 利 | profit | ri |  | 7
471 | 刷 | printing | satsu | su-ru | 8
472 | 副 | vice- | fuku |  | 11
473 | 功 | achievement | kō |  | 5
474 | 加 | add | ka | kuwa-eru | 5
475 | 努 | toil | do | tsuto-meru | 7
476 | 労 | labor | rō | negira-u | 7
477 | 勇 | courage | yū | isa-mu | 9
478 | 包 | wrap | hō | tsutsu-mu | 5
479 | 卒 | graduate | sotsu |  | 8
480 | 協 | cooperation | kyō |  | 8
481 | 単 | simple | tan |  | 9
482 | 博 | wide knowledge, Dr. | haku |  | 12
483 | 印 | mark | in | shirushi | 6
484 | 参 | participate | san | mai-ru | 8
485 | 司 | director | shi |  | 5
486 | 各 | each | kaku | ono-ono | 6
487 | 周 | circumference | shū | mawa-ri | 8
488 | 唱 | chant | shō | tona-eru | 11
489 | 器 | container | ki | utsuwa | 15
490 | 固 | harden | ko | kata-maru | 8
491 | 城 | castle | jō | shiro | 9
492 | 埼 | headland | ki | saki | 11
493 | 塩 | salt | en | shio | 13
494 | 変 | change, strange | hen | ka-waru | 9
495 | 夫 | husband | fu fū bu | otto | 4
496 | 失 | lose | shitsu | ushina-u | 5
497 | 奈 | but | na, dai | karanashi | 8
498 | 好 | like | kō | su-ku, kono-mu | 6
499 | 媛 | beauty | en | hime | 12
500 | 季 | seasons | ki |  | 8
501 | 孫 | grandchild | son | mago | 10
502 | 完 | perfect | kan |  | 7
503 | 官 | government official | kan |  | 8
504 | 害 | harm | gai |  | 10
505 | 富 | abundant | fu | tomi | 12
506 | 察 | guess | satsu |  | 14
507 | 岐 | high | ki, gi | edamichi | 7
508 | 岡 | hill | kō | oka | 8
509 | 崎 | rough | ki | saki, kewashii | 11
510 | 巣 | nest | sō | su | 11
511 | 差 | distinction | sa |  | 10
512 | 希 | hope | ki | mare | 7
513 | 席 | seat | seki |  | 10
514 | 帯 | sash | tai | obi | 10
515 | 底 | bottom | tei | soko | 8
516 | 府 | urban prefecture | fu |  | 8
517 | 康 | ease | kō |  | 11
518 | 建 | build | ken | ta-teru | 9
519 | 径 | diameter | kei |  | 8
520 | 徒 | junior | to |  | 10
521 | 徳 | virtue | toku |  | 14
522 | 必 | inevitable | hitsu | kanara-zu | 5
523 | 念 | thought | nen |  | 8
524 | 愛 | love | ai |  | 13
525 | 成 | become | sei | na-ru | 6
526 | 戦 | war | sen | ikusa, tataka-u | 13
527 | 折 | fold, break | setsu | o-ru | 7
528 | 挙 | raise | kyo | a-geru | 10
529 | 改 | reformation | kai | arata-meru | 7
530 | 敗 | break, failure | hai | yabu-reru | 11
531 | 散 | scatter | san | chi-ru | 12
532 | 料 | fee | ryō |  | 10
533 | 旗 | flag | ki | hata | 14
534 | 昨 | yesterday | saku |  | 9
535 | 景 | scenery | kei |  | 12
536 | 最 | superlative | sai | mo, motto-mo | 12
537 | 望 | hope | bō | nozo-mu | 11
538 | 未 | un- | mi | ima-da | 5
539 | 末 | end | matsu | sue | 5
540 | 札 | bill, plate, tag | satsu | fuda | 5
541 | 材 | lumber, material | zai |  | 7
542 | 束 | bundle | soku | taba, tsuka | 7
543 | 松 | pine | shō | matsu | 8
544 | 果 | accomplish, fruit | ka | ha-tasu | 8
545 | 栃 | horse chestnut |  | tochi | 9
546 | 栄 | prosperity | ei | saka-eru | 9
547 | 案 | plan | an |  | 10
548 | 梅 | plum | bai | ume | 10
549 | 梨 | pear | ri | nashi | 11
550 | 械 | contraption | kai |  | 11
551 | 極 | poles | kyoku | kiwa-meru | 12
552 | 標 | signpost | hyō |  | 15
553 | 機 | machine | ki | hata | 16
554 | 欠 | lack | ketsu | ka-keru | 4
555 | 残 | remainder, left | zan | noko-ru | 10
556 | 氏 | surname, Mr. | shi | uji | 4
557 | 民 | people | min | tami | 5
558 | 求 | request | kyū | moto-mu | 7
559 | 沖 | pour | chū | oki, waku | 7
560 | 治 | govern, heal | chi, ji | osa-meru, nao-ru | 8
561 | 法 | method | hō |  | 8
562 | 泣 | cry | kyū | na-ku | 8
563 | 浅 | shallow | sen | asa-i | 9
564 | 浴 | bathe, bask | yoku | a-biru | 10
565 | 清 | pure | sei, shō | kiyo-raka | 11
566 | 満 | full | man | mi-chiru | 12
567 | 滋 | grow | ji, shi | shigeru, masu, masumasu | 12
568 | 漁 | look for, fishing | ryō, gyo | asa-ru | 14
569 | 潟 | lagoon | seki | kata | 15
570 | 灯 | lamp | tō | hi | 6
571 | 無 | nothing | mu, bu | na-i | 12
572 | 然 | so, although | zen, nen | shika-shi | 12
573 | 焼 | bake | shō | ya-ku | 12
574 | 照 | illuminate | shō | te-rasu | 13
575 | 熊 | bear | yū | kuma | 14
576 | 熱 | heat | netsu | atsu-i | 15
577 | 牧 | pasture, breed | boku | maki | 8
578 | 特 | special | toku |  | 10
579 | 産 | give birth | san | u-mu | 11
580 | 的 | target | teki | mato | 8
581 | 省 | government ministry, omit, look back | shō, sei | habu-ku | 9
582 | 祝 | celebrate | shuku | iwa-u | 9
583 | 票 | ballot | hyō |  | 11
584 | 種 | species, seed | shu | tane | 14
585 | 積 | accumulate, pile | seki | tsu-mu | 16
586 | 競 | emulate | kyō | kiso-u | 20
587 | 笑 | laugh | shō | wara-u | 10
588 | 管 | pipe | kan | kuda | 14
589 | 節 | node | setsu | fushi | 13
590 | 約 | promise | yaku |  | 9
591 | 結 | tie | ketsu | musu-bu, yu-u | 12
592 | 給 | salary | kyū | tama-u | 12
593 | 続 | continue | zoku | tsuzu-ku | 13
594 | 縄 | rope | jō, bin, yō | nawa | 15
595 | 置 | put | chi | o-ku | 13
596 | 老 | old man | rō | o-iru | 6
597 | 臣 | retainer | shin |  | 7
598 | 良 | good | ryō | yo-i | 7
599 | 芸 | art | gei |  | 7
600 | 芽 | bud | ga | me | 8
601 | 英 | England | ei |  | 8
602 | 茨 | caltrop | shi, ji | ibara, kusabuki, kaya | 9
603 | 菜 | vegetable | sai | na | 11
604 | 街 | street, city | gai | machi | 12
605 | 衣 | garment | i | koromo | 6
606 | 要 | need | yō | i-ru | 9
607 | 覚 | memorize | kaku | obo-eru, sa-meru | 12
608 | 観 | observe | kan | mi-ru | 18
609 | 訓 | instruction | kun |  | 10
610 | 試 | test | shi | kokoro-miru, tame-su | 13
611 | 説 | theory | setsu | to-ku | 14
612 | 課 | section | ka |  | 15
613 | 議 | deliberation | gi |  | 20
614 | 貨 | currency, cargo | ka |  | 11
615 | 賀 | congratulations | ga |  | 12
616 | 軍 | army | gun |  | 9
617 | 輪 | wheel | rin | wa | 15
618 | 辞 | resign, speech, encyclopedia | ji | kotoba, ya-meru | 13
619 | 辺 | edge, vicinity | hen | ata-ri | 5
620 | 連 | take along | ren | tsu-reru, tsura-neru | 10
621 | 達 | attain | tatsu | tachi | 12
622 | 選 | choose | sen | era-bu | 15
623 | 郡 | county | gun |  | 10
624 | 群 | flock | gun | mu-reru | 13
625 | 量 | quantity | ryō |  | 12
626 | 録 | transcript | roku |  | 16
627 | 鏡 | mirror | kyō | kagami | 19
628 | 関 | related | kan | seki | 14
629 | 阜 | mound | fu | oka | 8
630 | 阪 | heights/slope | han | saka | 6
631 | 陸 | land | riku |  | 11
632 | 隊 | squad | tai |  | 12
633 | 静 | quiet | sei | shizu-ka | 14
634 | 順 | obey | jun |  | 12
635 | 願 | request | gan | nega-u | 19
636 | 類 | sort | rui |  | 18
637 | 飛 | fly | hi | to-bu | 9
638 | 飯 | meal | han | meshi | 12
639 | 養 | foster | yō | yashina-u | 15
640 | 香 | fragrant | kō, kyō | kaori, ka | 9
641 | 験 | verify | ken |  | 18
642 | 鹿 | deer | roku | shika, ka | 11
`
    // Fifth grade (193 kanji)
    const kyouikuKanjiGrade5 = `
# | Kanji | Meaning | On | Kun | Strokes
643 | 久 | long time | kyū | hisa | 3
644 | 仏 | Buddha | futsu, butsu | hotoke | 4
645 | 仮 | sham | ka, ke | kari | 6
646 | 件 | affair | ken |  | 6
647 | 任 | responsibility | nin | maka-seru | 6
648 | 似 | resemble | ji | ni-ru | 7
649 | 余 | surplus | yo | ama-ru | 7
650 | 価 | value | ka | atai | 8
651 | 保 | preserve | ho | tamo-tsu | 9
652 | 修 | discipline | shū | osa-meru | 10
653 | 個 | individual | ko |  | 10
654 | 停 | halt | tei | to-maru, to-meru | 11
655 | 備 | provide | bi | sona-eru | 12
656 | 像 | statue | zō |  | 14
657 | 再 | again | sai, sa | futata-bi | 6
658 | 刊 | publish | kan |  | 5
659 | 判 | judge | han | waka-ru | 7
660 | 制 | control | sei |  | 8
661 | 則 | rule | soku | notto-ru | 9
662 | 効 | effect | kō | ki-ku | 8
663 | 務 | duty | mu | tsuto-meru | 11
664 | 勢 | energy | sei | ikio-i | 13
665 | 厚 | thick | kō | atsu-i | 9
666 | 句 | phrase | ku |  | 5
667 | 可 | possible | ka |  | 5
668 | 史 | history | shi |  | 5
669 | 告 | tell | koku | tsu-geru | 7
670 | 喜 | rejoice, joy | ki | yoroko-bu | 12
671 | 営 | manage | ei | itona-mu | 12
672 | 因 | cause | in | yo-ru | 6
673 | 団 | association | dan, ton |  | 6
674 | 囲 | surround | i | kako-u | 7
675 | 圧 | pressure | atsu |  | 5
676 | 在 | exist | zai | a-ru | 6
677 | 均 | level | kin |  | 7
678 | 型 | model | kei | kata | 9
679 | 基 | foundation | ki | moto-zuku | 11
680 | 堂 | public chamber | dō |  | 11
681 | 報 | report | hō | muku-iru | 12
682 | 境 | boundary | kyō | sakai | 14
683 | 墓 | grave | bo | haka | 13
684 | 増 | increase | zō | ma-su, fu-eru | 14
685 | 士 | gentleman | shi |  | 3
686 | 夢 | dream | mu | yume | 13
687 | 妻 | wife | sai | tsuma | 8
688 | 婦 | lady | fu |  | 11
689 | 容 | contain | yō |  | 10
690 | 寄 | approach | ki | yo-ru | 11
691 | 導 | guide | dō | michibi-ku | 15
692 | 居 | reside | kyo | i-ru | 8
693 | 属 | belong | zoku |  | 12
694 | 布 | linen | fu | nuno | 5
695 | 師 | expert | shi |  | 10
696 | 常 | normal | jō | tsune | 11
697 | 幹 | tree trunk | kan | miki | 13
698 | 序 | preface | jo |  | 7
699 | 弁 | valve | ben |  | 5
700 | 張 | stretch | chō | ha-ru | 11
701 | 往 | journey | ō |  | 8
702 | 得 | acquire | toku | e-ru | 11
703 | 復 | recovery | fuku |  | 12
704 | 志 | intention | shi | kokorozashi | 7
705 | 応 | respond | ō |  | 7
706 | 快 | cheerful | kai | kokoroyo-i | 7
707 | 性 | gender | sei, shō | saga | 8
708 | 情 | feelings | jō | nasa-ke | 11
709 | 態 | condition | tai |  | 14
710 | 慣 | accustomed | kan | na-reru | 14
711 | 技 | skill | gi | waza | 7
712 | 招 | beckon | shō | mane-ku | 8
713 | 授 | instruct | ju | sazu-keru | 11
714 | 採 | pick | sai | to-ru | 11
715 | 接 | contact | setsu | tsu-gu | 11
716 | 提 | propose | tei | sa-geru | 12
717 | 損 | loss | son | soko-neru | 13
718 | 支 | support | shi | sasa-eru | 4
719 | 政 | politics | sei | matsurigoto | 9
720 | 故 | circumstances | ko | yue | 9
721 | 救 | salvation | kyū | suku-u | 11
722 | 断 | decline, refuse | dan | kotowa-ru | 11
723 | 旧 | old times | kyū |  | 5
724 | 易 | easy | eki | yasa-shii | 8
725 | 暴 | outburst | bō | aba-ku | 15
726 | 条 | clause | jō | kudari | 7
727 | 枝 | branch | shi | eda | 8
728 | 査 | investigate | sa |  | 9
729 | 格 | status | kaku |  | 10
730 | 桜 | cherry | ō | sakura | 10
731 | 検 | examine | ken |  | 12
732 | 構 | construct | kō | kama-eru | 14
733 | 武 | military | bu, mu |  | 8
734 | 歴 | curriculum | reki |  | 14
735 | 殺 | kill | satsu | koro-su | 10
736 | 毒 | poison | doku |  | 8
737 | 比 | compare | hi | kura-beru | 4
738 | 永 | eternity | ei | naga-i | 5
739 | 河 | stream | ka | kawa | 8
740 | 液 | fluid | eki |  | 11
741 | 混 | mix | kon | ma-zeru | 11
742 | 減 | decrease | gen | he-ru | 12
743 | 測 | measure | soku | haka-ru | 12
744 | 準 | standard | jun |  | 13
745 | 演 | perform | en |  | 14
746 | 潔 | undefiled | ketsu | isagiyo-i | 15
747 | 災 | disaster | sai | wazawa-i | 7
748 | 燃 | burn | nen | mo-eru | 16
749 | 版 | printing block | han |  | 8
750 | 犯 | crime | han | oka-su | 5
751 | 状 | form | jō |  | 7
752 | 独 | alone | doku | hito-ri | 9
753 | 率 | rate | ritsu, sotsu | hiki-iru | 11
754 | 現 | appear | gen | arawa-reru | 11
755 | 留 | detain | ryū, ru | todo-maru | 10
756 | 略 | abbreviation | ryaku |  | 11
757 | 益 | benefit | eki |  | 10
758 | 眼 | eyeball | gan | me | 11
759 | 破 | rend | ha | yabu-ru | 10
760 | 確 | certain | kaku | tashi-ka | 15
761 | 示 | indicate | shi | shime-su | 5
762 | 祖 | ancestor | so |  | 9
763 | 禁 | prohibition | kin |  | 13
764 | 移 | shift | i | utsu-ru | 11
765 | 程 | extent | tei | hodo | 12
766 | 税 | tax | zei |  | 12
767 | 築 | fabricate | chiku | kizu-ku | 16
768 | 粉 | flour | fun | ko, kona | 10
769 | 精 | refined | sei |  | 14
770 | 紀 | chronicle | ki |  | 9
771 | 素 | elementary | su, so | moto | 10
772 | 経 | manage | kei, kyō | he-ru | 11
773 | 統 | relationship | tō | su-beru | 12
774 | 絶 | discontinue | zetsu | ta-tsu | 12
775 | 綿 | cotton | men | wata | 14
776 | 総 | whole | sō |  | 14
777 | 編 | compile | hen | a-mu | 15
778 | 績 | exploits | seki |  | 17
779 | 織 | weave | shiki | o-ru | 18
780 | 罪 | guilt | zai | tsumi | 13
781 | 義 | righteousness | gi |  | 13
782 | 耕 | till | kō | tagaya-su | 10
783 | 職 | employment | shoku |  | 18
784 | 肥 | fertilizer | hi | ko-yasu | 8
785 | 能 | ability | nō |  | 10
786 | 脈 | vein | myaku |  | 10
787 | 興 | entertain | kyō | oko-su | 16
788 | 舎 | cottage | sha |  | 8
789 | 航 | cruise | kō |  | 10
790 | 術 | art | jutsu | sube | 11
791 | 衛 | defense | ei |  | 16
792 | 製 | manufacture | sei |  | 14
793 | 複 | duplicate | fuku |  | 14
794 | 規 | rule | ki |  | 11
795 | 解 | untie | ge, kai | to-ku | 13
796 | 設 | establish | setsu | mō-keru | 11
797 | 許 | permit | kyo | yuru-su | 11
798 | 証 | evidence | shō | akashi | 12
799 | 評 | evaluate | hyō |  | 12
800 | 講 | lecture | kō |  | 17
801 | 謝 | apologize | sha | ayama-ru | 17
802 | 識 | discriminating | shiki |  | 19
803 | 護 | safeguard | go | mamo-ru | 20
804 | 豊 | bountiful | hō | yuta-ka | 13
805 | 象 | elephant, figure | zō, shō |  | 12
806 | 財 | wealth | zai |  | 10
807 | 貧 | poor | hin | mazu-shii | 11
808 | 責 | blame | seki | se-meru | 11
809 | 貯 | savings | cho | ta-meru | 12
810 | 貸 | lend | tai | ka-su | 12
811 | 費 | expense | hi | tsui-yasu | 12
812 | 貿 | trade | bō |  | 12
813 | 資 | resources | shi |  | 13
814 | 賛 | approve | san |  | 15
815 | 賞 | prize | shō |  | 15
816 | 質 | quality | shitsu |  | 15
817 | 輸 | transport | yu |  | 16
818 | 述 | state, express | jutsu | no-beru | 8
819 | 迷 | astray | mei | mayo-u | 9
820 | 逆 | inverted | gyaku | saka-rau | 9
821 | 造 | create | zō | tsuku-ru | 10
822 | 過 | pass, exceed | ka | sugi-ru | 12
823 | 適 | suitable | teki |  | 14
824 | 酸 | acid | san |  | 14
825 | 鉱 | mineral | kō |  | 13
826 | 銅 | copper | dō |  | 14
827 | 防 | prevent | bō | fuse-gu | 7
828 | 限 | limit | gen | kagi-ru | 9
829 | 険 | precipitous | ken | kewa-shii | 11
830 | 際 | occasion | sai | kiwa | 14
831 | 雑 | miscellaneous | zatsu |  | 14
832 | 非 | negative | hi | ara-zu | 8
833 | 領 | territory | ryō |  | 14
834 | 額 | amount | gaku | hitai | 18
835 | 飼 | domesticate | shi | ka-u | 13
`
    // Sixth grade (191 kanji)
    const kyouikuKanjiGrade6 = `
# | Kanji | Meaning | On | Kun | Strokes
836 | 並 | row | hei | nami, nara-bu | 8
837 | 乱 | chaos | ran | mida-reru | 7
838 | 乳 | milk | nyū | chichi | 8
839 | 亡 | deceased | bō | na-kunaru | 3
840 | 仁 | kindness | jin |  | 4
841 | 供 | offer | kyō, ku | tomo | 8
842 | 俳 | actor | hai |  | 10
843 | 俵 | straw bag | hyō | tawara | 10
844 | 値 | value | chi | atai | 10
845 | 傷 | wound | shō | kizu | 13
846 | 優 | superior | yū | yasa-shii | 17
847 | 党 | political party | tō |  | 10
848 | 冊 | counter for books | satsu |  | 5
849 | 処 | dispose | sho |  | 5
850 | 券 | ticket | ken |  | 8
851 | 刻 | engrave | koku | kiza-mu | 8
852 | 割 | divide | katsu | wa-ru | 12
853 | 創 | create | sō | tsuku-ru | 12
854 | 劇 | drama | geki |  | 15
855 | 勤 | diligence | kin | tsuto-meru | 12
856 | 危 | dangerous | ki | abu-nai | 6
857 | 卵 | egg | ran | tamago | 7
858 | 厳 | strict | gen | kibi-shii | 17
859 | 収 | obtain | shū | osa-meru | 4
860 | 后 | queen | kō, gō | kisaki | 6
861 | 否 | negate | hi | ina, iya | 7
862 | 吸 | suck | kyū | su-u | 6
863 | 呼 | call | ko | yo-bu | 8
864 | 善 | virtue | zen | yo-i | 12
865 | 困 | quandary | kon | koma-ru | 7
866 | 垂 | droop | sui | ta-reru | 8
867 | 域 | range | iki |  | 11
868 | 奏 | play music | sō | kana-deru | 9
869 | 奮 | stirred up | fun | furu-u | 16
870 | 姿 | shape | shi | sugata | 9
871 | 存 | suppose | son |  | 6
872 | 孝 | filial piety | kō |  | 7
873 | 宅 | home | taku | ie | 6
874 | 宇 | eaves | u |  | 6
875 | 宗 | religion | shū | sō | 8
876 | 宙 | mid-air | chū |  | 8
877 | 宝 | treasure | hō | takara | 8
878 | 宣 | proclaim | sen | notama-u | 9
879 | 密 | secrecy | mitsu |  | 11
880 | 寸 | measurement | sun |  | 3
881 | 専 | specialty | sen | moppa-ra | 9
882 | 射 | shoot | sha | i-ru | 10
883 | 将 | leader | shō |  | 10
884 | 尊 | revered | son | tōto-bu | 12
885 | 就 | concerning | shū | tsu-ku | 12
886 | 尺 | measure of length | shaku |  | 4
887 | 届 | deliver | kai | todo-ku | 8
888 | 展 | expand | ten |  | 10
889 | 層 | stratum | sō |  | 14
890 | 己 | self | ko | onore | 3
891 | 巻 | scroll | kan | maki | 9
892 | 幕 | curtain | maku, baku |  | 13
893 | 干 | dry | kan | ho-su | 3
894 | 幼 | infancy | yō | osana-i | 5
895 | 庁 | government office | chō |  | 5
896 | 座 | sit | za | suwa-ru | 10
897 | 延 | prolong | en | no-basu | 8
898 | 律 | rhythm | ritsu |  | 9
899 | 従 | obey | jū | shitaga-u | 10
900 | 忘 | forget | bō | wasu-reru | 7
901 | 忠 | loyalty | chū |  | 8
902 | 恩 | grace | on |  | 10
903 | 憲 | constitution | ken |  | 16
904 | 我 | ego | ga | ware | 7
905 | 批 | criticism | hi |  | 7
906 | 承 | acquiesce | shō, jō | uketamawa-ru | 8
907 | 担 | shouldering | tan | nina-u | 8
908 | 拝 | worship | hai | oga-mu | 8
909 | 拡 | broaden | kaku | hiro-geru | 8
910 | 捨 | discard | sha | su-teru | 11
911 | 探 | look for, search | tan | saga-su | 11
912 | 推 | infer | sui |  | 11
913 | 揮 | brandish | ki |  | 12
914 | 操 | maneuver | sō | ayatsu-ru | 16
915 | 敬 | respect | kei | uyama-u | 12
916 | 敵 | enemy | teki | kataki | 15
917 | 映 | reflect | ei | utsu-ru | 9
918 | 晩 | nightfall | ban |  | 12
919 | 暖 | warmth | dan | atata-kai | 13
920 | 暮 | livelihood | bo | ku-rasu | 14
921 | 朗 | melodious | rō | hoga-raka | 10
922 | 机 | desk | ki | tsukue | 6
923 | 枚 | sheet of... | mai |  | 8
924 | 染 | dye | sen | so-meru | 9
925 | 株 | stocks | shu | kabu | 10
926 | 棒 | rod | bō |  | 12
927 | 模 | imitation | mo, bo |  | 14
928 | 権 | rights | ken |  | 15
929 | 樹 | trees | ju | ki | 16
930 | 欲 | longing | yoku | ho-shii | 11
931 | 段 | steps | dan |  | 9
932 | 沿 | run alongside | en | so-u | 8
933 | 泉 | fountain | sen | izumi | 9
934 | 洗 | wash | sen | ara-u | 9
935 | 派 | sect | ha |  | 9
936 | 済 | settle | sai | su-mu | 11
937 | 源 | source | gen | minamoto | 13
938 | 潮 | tide | chō | shio | 15
939 | 激 | violent | geki | hage-shii | 16
940 | 灰 | ashes | kai | hai | 6
941 | 熟 | ripen | juku | u-reru | 15
942 | 片 | one-sided | hen | kata | 4
943 | 班 | corps | han |  | 10
944 | 異 | uncommon | i | koto-naru | 11
945 | 疑 | doubt | gi | utaga-u | 14
946 | 痛 | pain | tsū | ita-i | 12
947 | 皇 | emperor | kō, ō |  | 9
948 | 盛 | prosper | sei | mo-ru | 11
949 | 盟 | alliance | mei |  | 13
950 | 看 | watch over | kan |  | 9
951 | 砂 | sand | sa, sha | suna | 9
952 | 磁 | magnet | ji |  | 14
953 | 私 | me | shi | watakushi, watashi | 7
954 | 秘 | secret | hi | hi-meru | 10
955 | 穀 | cereal | koku |  | 14
956 | 穴 | hole | ketsu | ana | 5
957 | 窓 | window | sō | mado | 11
958 | 筋 | muscle | kin | suji | 12
959 | 策 | scheme | saku |  | 12
960 | 簡 | simplicity | kan |  | 18
961 | 糖 | sugar | tō |  | 16
962 | 系 | lineage | kei |  | 7
963 | 紅 | crimson | kō | beni, kurenai | 9
964 | 納 | settlement | nō | osa-meru | 10
965 | 純 | genuine | jun |  | 10
966 | 絹 | silk | ken | kinu | 13
967 | 縦 | vertical | jū | tate | 16
968 | 縮 | shrink | shuku | chidi-mu | 17
969 | 署 | government office | sho |  | 13
970 | 翌 | forthcoming | yoku |  | 11
971 | 聖 | holy | sei |  | 13
972 | 肺 | lung | hai |  | 9
973 | 胃 | stomach | i |  | 9
974 | 背 | back | hai | se | 9
975 | 胸 | chest, breast | kyō | mune | 10
976 | 脳 | brain | nō |  | 11
977 | 腸 | intestines | chō | harawata | 13
978 | 腹 | abdomen | fuku | hara | 13
979 | 臓 | entrails | zō |  | 19
980 | 臨 | lookover | rin | nozo-mu | 18
981 | 至 | climax | shi | ita-ru | 6
982 | 舌 | tongue | zetsu | shita | 6
983 | 若 | young | jaku | waka-i | 8
984 | 著 | renowned | cho | arawa-su, ichijiru-shii | 11
985 | 蒸 | foment | jō | mu-su | 13
986 | 蔵 | storehouse | zō | kura | 15
987 | 蚕 | silkworm | san | kaiko | 10
988 | 衆 | masses | shū |  | 12
989 | 裁 | judge | sai | saba-ku | 12
990 | 装 | attire | sō, shō | yosoo-u | 12
991 | 裏 | rear | ri | ura | 13
992 | 補 | supplement | ho | ogina-u | 12
993 | 視 | look at | shi | mi-ru | 11
994 | 覧 | perusal | ran |  | 17
995 | 討 | chastise | tō | u-tsu | 10
996 | 訪 | visit | hō | tazu-neru | 11
997 | 訳 | translate, reason | yaku | wake | 11
998 | 詞 | term | shi | kotoba | 12
999 | 誌 | document | shi |  | 14
1000 | 認 | recognize | nin | mito-meru | 14
1001 | 誕 | born | tan |  | 15
1002 | 誠 | sincerity | sei | makoto | 13
1003 | 誤 | mistake | go | ayama-ru | 14
1004 | 論 | argument, discussion | ron |  | 15
1005 | 諸 | various | sho | moro | 15
1006 | 警 | admonish | kei | imashi-meru | 19
1007 | 貴 | precious | ki | tatto-i | 12
1008 | 賃 | fare | chin |  | 13
1009 | 退 | retreat | tai | shirizo-ku | 9
1010 | 遺 | bequeath | i |  | 15
1011 | 郵 | mail | yū |  | 11
1012 | 郷 | home town | kyō | gō | 11
1013 | 針 | needle | shin | hari | 10
1014 | 銭 | coin | sen | zeni | 14
1015 | 鋼 | steel | kō | hagane | 16
1016 | 閉 | closed | hei | shi-meru | 11
1017 | 閣 | tower | kaku |  | 14
1018 | 降 | descend | kō | o-riru | 10
1019 | 陛 | majesty | hei |  | 10
1020 | 除 | exclude | jo, ji | nozo-ku | 10
1021 | 障 | hurt | shō | sawa-ru | 14
1022 | 難 | difficult | nan | muzuka-shii | 18
1023 | 革 | leather | kaku | kawa | 9
1024 | 頂 | top, receive | chō | itada-ku | 11
1025 | 預 | deposit | yo | azu-keru | 13
1026 | 骨 | bone | kotsu | hone | 10
`
    return [kyouikuKanjiGrade1, kyouikuKanjiGrade2, kyouikuKanjiGrade3, kyouikuKanjiGrade4, kyouikuKanjiGrade5, kyouikuKanjiGrade6]
  }
}
