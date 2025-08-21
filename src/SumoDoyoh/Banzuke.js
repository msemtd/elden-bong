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
//
// OK, so the implementation as it stands:
// - using the DataDir class for data storage and retrieval
// - each division has its own JSON file fetched from sumo.or.jp banzuke
// - each rikishi thumbnail, photo, and profile HTML is also fetched and cached
// - rikishi profile is scraped for extra columns: height, weight, birthday etc.
// - all-rikishi.json is the full custom table with all additions
//

const thumbnailPrefix = 'https://www.sumo.or.jp/img/sumo_data/rikishi/60x60/'
const photoPrefix = 'https://www.sumo.or.jp/img/sumo_data/rikishi/270x474/'
const profilePrefix = 'https://www.sumo.or.jp/EnSumoDataRikishi/profile/'

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
      real_name
      birthday
      height
      weight
      mawashi_colour
      skin_colour
    `.trim().split(/\s+/)
    Object.freeze(this.tabColumns)
  }

  getDivisions () {
    return structuredClone(this.divisions)
  }

  /**
   * Get the cache dir for banzuke data
   * @returns {Promise<string>} full path
   */
  async getCacheDirFullPath () {
    const d = await DataDir.getCacheDir(this.cacheDirName)
    return d
  }

  /**
   * Cache a single division from current sumo.or.jp website banzuke
   * @param {number} division - The division number
   * @param {boolean} withThumbnails - Whether to cache thumbnails
   * @param {boolean} withPhotos - Whether to cache photos
   * @param {boolean} withProfiles - Whether to cache profiles
   * @returns {Promise<Array>} - The cached data
   */
  async cacheSumoOrJpDivision (division, withThumbnails = false, withPhotos = false, withProfiles = false) {
    if (division === undefined) {
      return []
    }
    const pageSub = 1
    const cacheFile = `${this.cacheDirName}/banzuke${division}.json`
    const url = `https://www.sumo.or.jp/EnHonbashoBanzuke/indexAjax/${division}/${pageSub}/`
    const data = await DataDir.getJson(url, { cacheFile })
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
        await DataDir.getText(profileUrl, { cacheFile, noDataJustCache: true })
      }
    }
    return tab
  }

  /**
   * Cache all division and rikishi data from current sumo.or.jp website banzuke
   * @param {function} progressCallback - Callback function to report progress
   */
  async cacheAllSumoOrJpDivisions (progressCallback = (pct, stage) => {
    console.log(`Progress: ${pct}% - ${stage}`)
  }) {
    this.rikishi = []
    const divisions = this.getDivisions()
    const t1 = performance.now()
    for (let i = 0; i < divisions.length; i++) {
      const d = divisions[i]
      const rows = await this.cacheSumoOrJpDivision(d.sumoOrJpPage, true, true, true)
      this.rikishi.push(...rows)
      console.log(`Banzuke data for ${d.sumoOrJpPage} cached: ${rows.length} entries`)
      progressCallback(Math.floor((i / divisions.length) * 100), `Processing division ${d.sumoOrJpPage || 0}`)
    }
    const t2 = performance.now()
    console.log(`fullCache build took ${t2 - t1} milliseconds.`)
  }

  async load (progressCallback = (pct, stage) => {
    console.log(`Progress: ${pct}% - ${stage}`)
  }) {
    this.rikishi = []
    // before we start a long build, let's see if we have a fully built table...
    const fullTableFile = `${this.cacheDirName}/all-rikishi.json`
    const data = await DataDir.getJson('', { cacheFile: fullTableFile })
    if (data instanceof Object && Array.isArray(data.rikishi)) {
      this.rikishi = data.rikishi
      return
    }
    // if not, we need to build it...
    await this.cacheAllSumoOrJpDivisions(progressCallback)
    const t1 = performance.now()
    let i = 0
    for (const rikishi of this.rikishi) {
      // Fill in missing data for each rikishi
      await this.fillInRikishiData(rikishi)
      i++
      progressCallback(Math.floor((i / this.rikishi.length) * 100), `Processing rikishi ${rikishi[1]} (${rikishi[0]})`)
    }
    const t2 = performance.now()
    console.log(`Rikishi tab patched with extra columns: ${this.rikishi.length} in ${t2 - t1} ms.`)
    const cacheThisData = { rikishi: this.rikishi }
    await DataDir.getJson('', { cacheFile: fullTableFile, cacheThisData })
  }

  async fillInRikishiData (rikishi) {
    // get the html rikishi page and...
    const cacheFile = rikishi[this.tabColumns.indexOf('profile_html')]
    if (!cacheFile) {
      console.log('no html for ', rikishi)
      return
    }
    const id = rikishi[this.tabColumns.indexOf('rikishi_id')]
    const profileUrl = profilePrefix + id + '/'
    const data = await DataDir.getText(profileUrl, { cacheFile })
    // parse...
    const parser = new DOMParser()
    const doc = parser.parseFromString(data, 'text/html')
    // Scrape relevant information from the profile page
    const rn = doc.querySelector('#mainContent > div:nth-child(3) > div > div > table > tbody > tr:nth-child(3) > td')?.textContent
    const bd = doc.querySelector('#mainContent > div:nth-child(3) > div > div > table > tbody > tr:nth-child(6) > td')?.textContent
    const hi = doc.querySelector('#mainContent > div:nth-child(3) > div > div > table > tbody > tr:nth-child(8) > td')?.textContent
    const we = doc.querySelector('#mainContent > div:nth-child(3) > div > div > table > tbody > tr:nth-child(9) > td')?.textContent
    if ([rn, bd, hi, we].includes(undefined)) {
      console.warn('problem scraping data from ' + cacheFile)
    }
    // Update the db with the extracted information
    rikishi[this.tabColumns.indexOf('real_name')] = rn
    rikishi[this.tabColumns.indexOf('birthday')] = bd
    rikishi[this.tabColumns.indexOf('height')] = hi
    rikishi[this.tabColumns.indexOf('weight')] = we
  }
}
