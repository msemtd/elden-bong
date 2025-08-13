import { getJson, getImgExt } from '../HandyApi'
import { delayMs } from '../util'
// cSpell:ignore Banzuke sumodb doyoh dohyō rikishi basho shikona beya heya
// cSpell:ignore Makuuchi Jūryō Makushita Sandanme Jonidan Jonokuchi Maezumo Yokozuna Ozeki Sekiwake Komusubi
// cSpell:ignore chibi

// A live sumo database in English and Japanese.
// Web scraping or proper API calls? Why not both? Use whatever is available.
//
// https://www.sumo.or.jp/EnSumoDataSumoBeya/wrap/
// sumodb
//
// Looks like we can make these API calls to get the banzuke data:
// https://www.sumo.or.jp/EnHonbashoBanzuke/indexAjax/1/1/
// https://www.sumo.or.jp/EnHonbashoBanzuke/indexAjax/2/1/
// https://www.sumo.or.jp/EnHonbashoBanzuke/indexAjax/3/1/
// https://www.sumo.or.jp/EnHonbashoBanzuke/indexAjax/4/1/
// https://www.sumo.or.jp/ResultBanzuke/table/
// https://www.sumo.or.jp/EnSumoDataRikishi/profile/3842/
// https://sumodb.sumogames.de/Rikishi_opp.aspx?r=1287
// https://www.sumo-api.com/
//
// What do I want to achieve?
// - Get the banzuke (ranking sheet) for a given basho (tournament).
// - Get rikishi (wrestler) details, including their stable, rank, and performance.
// - Get the list of stables (beya) and their rikishi.
// play along at home during a basho
// learn in Japanese and English
// rikishi squareness and character making - realistic vs chibi
//
// A web scraping workflow: for each stable, get page, parse the rikishi list
// get each rikishi's details with slow fetches and cache all data

export class Banzuke {
  constructor () {
    this.cacheDirName = 'BanzukeData'
    this.rikishi = []
    this.divisions = [
      { name: 'Makuuchi', jpName: '幕内', enName: 'Top Division', sumoOrJpPage: 1 },
      { name: 'Jūryō', jpName: '十両', enName: 'Second Division', sumoOrJpPage: 2 },
      { name: 'Makushita', jpName: '幕下', enName: 'Third Division', sumoOrJpPage: 3 },
      { name: 'Sandanme', jpName: '三段目', enName: 'Fourth Division', sumoOrJpPage: 4 },
      { name: 'Jonidan', jpName: '序二段', enName: 'Fifth Division', sumoOrJpPage: 5 },
      { name: 'Jonokuchi', jpName: '序ノ口', enName: 'Lowest Division', sumoOrJpPage: 6 },
      { name: 'Maezumo', jpName: '前頭', enName: 'Unranked', sumoOrJpPage: undefined },
    ]
    // Yokozuna
    // Ozeki
    // Sekiwake
    // Komusubi
    // 東
    // 番付
    // 西

    this.stables = `
      Asakayama Asahiyama Ajigawa Arashio Ikazuchi Isegahama Isenoumi Oitekaze
      Onomatsu Oshima Otake Oshiogawa Otowayama Onoe Kasugano Kataonami Kise Kokonoe
      Sakaigawa Sadogatake Shikihide Shikoroyama Shibatayama Takasago Takadagawa
      Takekuma Tagonoura Tatsunami Tamanoi Dewanoumi Tokitsukaze Tokiwayama Nakamura
      Naruto Nishiiwa Nishikido Nishonoseki Hakkaku Hanaregoma Hidenoyama Fujishima
      Futagoyama Minato Musashigawa Yamahibiki
    `.trim().split(/\s+/)
  }

  getDivisions () {
    return structuredClone(this.divisions)
  }

  async cacheSumoOrJp (division, withThumbnails = false, withPhotos = false, withProfiles = false) {
    if (division === undefined) {
      return []
    }
    const pageSub = 1
    const cacheFile = `${this.cacheDirName}/banzuke${division}.json`
    const url = `https://www.sumo.or.jp/EnHonbashoBanzuke/indexAjax/${division}/${pageSub}/`
    const data = await getJson(url, { cacheFile })
    const thumbnailPrefix = 'https://www.sumo.or.jp/img/sumo_data/rikishi/60x60/'
    const photoPrefix = 'https://www.sumo.or.jp/img/sumo_data/rikishi/270x474/'
    const profilePrefix = 'https://www.sumo.or.jp/EnSumoDataRikishi/profile/'
    console.assert(data && Array.isArray(data.BanzukeTable))
    const tab = []
    const ew = (x) => {
      if (x === 1) return 'E'
      if (x === 2) return 'W'
      return x
    }
    for (let i = 0; i < data.BanzukeTable.length; i++) {
      const e = data.BanzukeTable[i]
      if (!e.rikishi_id || !e.shikona || !e.banzuke_id || !e.banzuke_name) {
        console.warn(`Skipping incomplete rikishi entry: ${JSON.stringify(e)}`)
        continue
      }
      const row = [
        e.rikishi_id,
        e.shikona,
        e.banzuke_id,
        e.banzuke_name,
        ew(e.ew),
        e.heya_name,
        e.photo,
        e.pref_name,
      ]
      tab.push(row)
      if (withThumbnails) {
        const imgUrl = thumbnailPrefix + e.photo
        const cacheFile = `${this.cacheDirName}/rikishiThumbnails/${e.photo}`
        const data = await getImgExt(imgUrl, { cacheFile, noDataJustCache: true })
        console.dir(data)
      }
      if (withPhotos) {
        const imgUrl = photoPrefix + e.photo
        const cacheFile = `${this.cacheDirName}/rikishiPhotos/${e.photo}`
        const data = await getImgExt(imgUrl, { cacheFile, noDataJustCache: true })
        console.dir(data)
      }
      if (withProfiles) {
        const profileUrl = profilePrefix + e.rikishi_id + '/'
        const cacheFile = `${this.cacheDirName}/rikishiProfiles/${e.rikishi_id}.html`
        const data = await getImgExt(profileUrl, { cacheFile })
        console.dir(data)
        await delayMs(100) // Delay between requests
      }
    }
    return tab
  }
}
