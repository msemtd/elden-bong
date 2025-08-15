import { DataDir } from '../DataDir'

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

    // cSpell:ignore  Asakayama Asahiyama Ajigawa Arashio Ikazuchi Isegahama Isenoumi Oitekaze
    // cSpell:ignore  Onomatsu Oshima Otake Oshiogawa Otowayama Onoe Kasugano Kataonami Kise Kokonoe
    // cSpell:ignore  Sakaigawa Sadogatake Shikihide Shikoroyama Shibatayama Takasago Takadagawa
    // cSpell:ignore  Takekuma Tagonoura Tatsunami Tamanoi Dewanoumi Tokitsukaze Tokiwayama Nakamura
    // cSpell:ignore  Naruto Nishiiwa Nishikido Nishonoseki Hakkaku Hanaregoma Hidenoyama Fujishima
    // cSpell:ignore  Futagoyama Minato Musashigawa Yamahibiki

    this.stables = `
      Asakayama Asahiyama Ajigawa Arashio Ikazuchi Isegahama Isenoumi Oitekaze
      Onomatsu Oshima Otake Oshiogawa Otowayama Onoe Kasugano Kataonami Kise Kokonoe
      Sakaigawa Sadogatake Shikihide Shikoroyama Shibatayama Takasago Takadagawa
      Takekuma Tagonoura Tatsunami Tamanoi Dewanoumi Tokitsukaze Tokiwayama Nakamura
      Naruto Nishiiwa Nishikido Nishonoseki Hakkaku Hanaregoma Hidenoyama Fujishima
      Futagoyama Minato Musashigawa Yamahibiki
    `.trim().split(/\s+/)

    this.tabColumns = `
      rikishi_id
      shikona
      banzuke_id
      banzuke_name
      ew
      heya_name
      photo
      pref_name
      thumbnail
      photo
      profile_html
    `.trim().split(/\s+/)
    Object.freeze(this.tabColumns)
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
    const data = await DataDir.getJson(url, { cacheFile })
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
        console.log(`Skipping empty entry: ${JSON.stringify(e)}`)
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
        row[this.tabColumns.indexOf('thumbnail')] = cacheFile
        await DataDir.getBinary(imgUrl, { cacheFile, noDataJustCache: true })
      }
      if (withPhotos) {
        const imgUrl = photoPrefix + e.photo
        const cacheFile = `${this.cacheDirName}/rikishiPhotos/${e.photo}`
        row[this.tabColumns.indexOf('photo')] = cacheFile
        await DataDir.getBinary(imgUrl, { cacheFile, noDataJustCache: true })
      }
      if (withProfiles) {
        const profileUrl = profilePrefix + e.rikishi_id + '/'
        const cacheFile = `${this.cacheDirName}/rikishiProfiles/${e.rikishi_id}.html`
        row[this.tabColumns.indexOf('profile_html')] = cacheFile
        await DataDir.getBinary(profileUrl, { cacheFile, noDataJustCache: true })
      }
    }
    return tab
  }

  async fullCache () {
    this.rikishi = []
    const divisions = this.getDivisions()
    const t1 = performance.now()
    for (let i = 0; i < divisions.length; i++) {
      const d = divisions[i]
      const rows = await this.cacheSumoOrJp(d.sumoOrJpPage, true, true, true)
      this.rikishi.push(...rows)
      console.log(`Banzuke data for ${d.sumoOrJpPage} cached: ${rows.length} entries`)
    }
    const t2 = performance.now()
    console.log(`fullCache build took ${t2 - t1} milliseconds.`)
  }

  async getCacheDirFullPath () {
    const d = await DataDir.getCacheDir(this.cacheDirName)
    return d
  }

  async fillInMissingData () {
    for (const rikishi of this.rikishi) {
      // Fill in missing data for each rikishi
      await this.fillInRikishiData(rikishi)
    }
  }

  async fillInRikishiData (rikishi) {
    // console.log('Banzuke tab size:', this.banzuke.tab.length)
    // // Further processing or consolidation logic here
    // for (const row of this.banzuke.tab) {
    //   // Process each row
    //   // Example: console.log(row)
    //   // get the html rikishi page and...
    //   const profileHtml = row[this.banzuke.tabColumns.indexOf('profile_html')]
    //   if (profileHtml) {
    //     const cf = await getImgExt(profileHtml)
    //     console.dir(cf)

    //     // const parser = new DOMParser()
    //     // const doc = parser.parseFromString(aaaaaaaaaaaaaa, 'text/html')
    //     // // Extract relevant information from the profile page
    //     // const age = doc.querySelector('.age')?.textContent
    //     // const height = doc.querySelector('.height')?.textContent
    //     // const weight = doc.querySelector('.weight')?.textContent
    //     // Update the row with the extracted information
    //     // row.push(age, height, weight)
    //   }
    // }
  }
}
