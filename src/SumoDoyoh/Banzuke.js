import { DataDir } from '../DataDir'
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
// Japanese profile page example: (Hoshouryu)
// https://www.sumo.or.jp/ResultRikishiData/profile/3842/
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

// cSpell:ignore Banzuke sumodb doyoh dohyō rikishi basho shikona beya heya mawashi
// cSpell:ignore Makuuchi Jūryō Makushita Sandanme Jonidan Jonokuchi Maezumo Yokozuna Ozeki Sekiwake Komusubi
// cSpell:ignore chibi romaji

// cSpell:ignore  Asakayama Asahiyama Ajigawa Arashio Ikazuchi Isegahama Isenoumi Oitekaze
// cSpell:ignore  Onomatsu Oshima Otake Oshiogawa Otowayama Onoe Kasugano Kataonami Kise Kokonoe
// cSpell:ignore  Sakaigawa Sadogatake Shikihide Shikoroyama Shibatayama Takasago Takadagawa
// cSpell:ignore  Takekuma Tagonoura Tatsunami Tamanoi Dewanoumi Tokitsukaze Tokiwayama Nakamura
// cSpell:ignore  Naruto Nishiiwa Nishikido Nishonoseki Hakkaku Hanaregoma Hidenoyama Fujishima
// cSpell:ignore  Futagoyama Minato Musashigawa Yamahibiki

const cacheDirName = 'BanzukeData'

export class Rikishi {
  constructor (
    rikishiId = 0,
    shikona = '',
    division = 0,
    banzukeId = 0,
    banzukeName = '',
    eastWest = '',
    heyaName = '',
    photo = '',
    prefecture = '',
    realName = '',
    birthday = '',
    height = '',
    weight = '',
    mawashiColour = '',
    skinColour = ''
  ) {
    this.rikishiId = rikishiId
    this.shikona = shikona
    this.division = division
    this.banzukeId = banzukeId
    this.banzukeName = banzukeName
    this.eastWest = eastWest
    this.heyaName = heyaName
    this.photo = photo
    this.prefecture = prefecture
    this.realName = realName
    this.birthday = birthday
    this.height = height
    this.weight = weight
    this.mawashiColour = mawashiColour
    this.skinColour = skinColour
  }

  asRow () {
    return [
      this.rikishiId,
      this.shikona,
      this.division,
      this.banzukeId,
      this.banzukeName,
      this.eastWest,
      this.heyaName,
      this.photo,
      this.prefecture,
      this.realName,
      this.birthday,
      this.height,
      this.weight,
      this.mawashiColour,
      this.skinColour
    ]
  }

  static cols = {
    rikishiId: 0,
    shikona: 1,
    division: 2,
    banzukeId: 3,
    banzukeName: 4,
    eastWest: 5,
    heyaName: 6,
    photo: 7,
    prefecture: 8,
    realName: 9,
    birthday: 10,
    height: 11,
    weight: 12,
    mawashiColour: 13,
    skinColour: 14,
  }

  urlProfileEnglish () {
    return `https://www.sumo.or.jp/EnSumoDataRikishi/profile/${this.rikishiId}/`
  }

  urlProfileJp () {
    return `https://www.sumo.or.jp/ResultRikishiData/profile/${this.rikishiId}/`
  }

  urlProfilePic () {
    return `https://www.sumo.or.jp/img/sumo_data/rikishi/270x474/${this.photo}`
  }

  urlThumbnail () {
    return `https://www.sumo.or.jp/img/sumo_data/rikishi/60x60/${this.photo}`
  }

  cacheFileProfile () {
    return `${cacheDirName}/rikishiProfiles/${this.rikishiId}.html`
  }

  cacheFileThumbnail () {
    return `${cacheDirName}/rikishiThumbnails/${this.photo}`
  }

  cacheFileProfilePic () {
    return `${cacheDirName}/rikishiPhotos/${this.photo}`
  }

  /**
   * Scrape relevant information from the English profile HTML text
   */
  scrapeProfileDataEn (html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const rn = doc.querySelector('#mainContent > div:nth-child(3) > div > div > table > tbody > tr:nth-child(3) > td')?.textContent
    const bd = doc.querySelector('#mainContent > div:nth-child(3) > div > div > table > tbody > tr:nth-child(6) > td')?.textContent
    const hi = doc.querySelector('#mainContent > div:nth-child(3) > div > div > table > tbody > tr:nth-child(8) > td')?.textContent
    const we = doc.querySelector('#mainContent > div:nth-child(3) > div > div > table > tbody > tr:nth-child(9) > td')?.textContent
    if ([rn, bd, hi, we].includes(undefined)) {
      return false
    }
    this.realName = rn
    this.birthday = bd
    this.height = hi
    this.weight = we
    return true
  }
}

export class Banzuke {
  constructor () {
    this.rikishi = []
    // when incomplete load, just save it anyway for a faster start
    this.saveTabAnyway = false
    this.divisions = [
      { name: 'Makuuchi', jpName: '幕内', enName: 'Top Division', sumoOrJpPage: 1 },
      { name: 'Jūryō', jpName: '十両', enName: 'Second Division', sumoOrJpPage: 2 },
      { name: 'Makushita', jpName: '幕下', enName: 'Third Division', sumoOrJpPage: 3 },
      { name: 'Sandanme', jpName: '三段目', enName: 'Fourth Division', sumoOrJpPage: 4 },
      { name: 'Jonidan', jpName: '序二段', enName: 'Fifth Division', sumoOrJpPage: 5 },
      { name: 'Jonokuchi', jpName: '序ノ口', enName: 'Lowest Division', sumoOrJpPage: 6 },
      { name: 'Maezumo', jpName: '前頭', enName: 'Unranked', sumoOrJpPage: undefined },
    ]
    Object.freeze(this.divisions)
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

  /**
   * Get the cache dir for banzuke data
   * @returns {Promise<string>} full path
   */
  async getCacheDirFullPath (base = false) {
    const d = await DataDir.getCachePath(cacheDirName)
    if (base) {
      console.assert(d.endsWith('\\' + cacheDirName))
      const cd = d.replace(new RegExp('\\\\' + cacheDirName + '$'), '')
      return cd
    }
    return d
  }

  urlBanzukeDivisionData (division) {
    return `https://www.sumo.or.jp/EnHonbashoBanzuke/indexAjax/${division}/1/`
  }

  cachePathBanzukeDivision (division) {
    return `${cacheDirName}/banzuke${division}.json`
  }

  getRikishiForDivision (division) {
    return this.rikishi.filter(r => r[Rikishi.cols.division] === division)
  }

  /**
   * Get rikishi table data by shikona (ring-name)
   * @param {string} name name (shikona) of the rikishi in romaji
   * @returns {Array} row from the table
   */
  getRikishiByName (name) {
    return this.rikishi.find(r => r[Rikishi.cols.shikona] === name)
  }

  /**
   * Get a new rikishi object by shikona (ring-name)
   * @param {string} name name (shikona) of the rikishi in romaji
   * @returns {Rikishi} new object from the table row data
   */
  getRikishiObjByName (name) {
    const row = this.getRikishiByName(name)
    if (!row) return null
    return new Rikishi(...row)
  }

  async checkDivisionChange (division) {
    // get the cached division - do not fetch!
    const data1 = await DataDir.getJson('', { cacheFile: this.cachePathBanzukeDivision(division) })
    // fetch the division - do not cache!
    const data2 = await DataDir.getJson(this.urlBanzukeDivisionData(division))
    // compare the dates or other info
    console.log('old vs new data', data1, data2)
    if (data1?.basho_name && data2?.basho_name && data1?.year_jp && data2?.year_jp) {
      const b1 = `${data1.basho_name} (${data1.year_jp})`
      const b2 = `${data2.basho_name} (${data2.year_jp})`
      if (b1 === b2) {
        return ''
      }
      return `New Basho: '${b2}' <-- ${b1}`
    }
    return 'dunno mate'
  }

  /**
   * Cache a single division from current sumo.or.jp website banzuke
   * @param {number} division - The division number
   * @returns {Promise<Array>} - The cached data
   */
  async cacheSumoOrJpDivision (division) {
    if (division === undefined) {
      return []
    }
    const data = await DataDir.getJson(this.urlBanzukeDivisionData(division), { cacheFile: this.cachePathBanzukeDivision(division) })
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
      const r = new Rikishi(e.rikishi_id, e.shikona, division, e.banzuke_id, e.banzuke_name, ew(e.ew), e.heya_name, e.photo, e.pref_name)
      tab.push(r.asRow())
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
    progressCallback(0, 'fetch banzuke JSON')
    const aa = this.divisions
    for (let i = 0; i < aa.length; i++) {
      const rows = await this.cacheSumoOrJpDivision(aa[i].sumoOrJpPage, false, false, false)
      this.rikishi.push(...rows)
      progressCallback(Math.floor((i / aa.length) * 100), `fetch division ${aa[i].sumoOrJpPage || 0}`)
    }
  }

  async isFullCacheAvailable () {
    const fullTableFile = `${cacheDirName}/all-rikishi.json`
    const data = await DataDir.getJson('', { cacheFile: fullTableFile })
    if (data instanceof Object && Array.isArray(data.rikishi)) {
      return true
    }
    return false
  }

  async load (progressCallback = (pct, stage) => {
    console.log(`Progress: ${pct}% - ${stage}`)
  }) {
    this.rikishi = []
    // 1. Before we start a long build, let's see if we have a fully built table...
    // NB: we should only create the full table if it is truly complete
    const fullTableFile = `${cacheDirName}/all-rikishi.json`
    const data = await DataDir.getJson('', { cacheFile: fullTableFile })
    if (data instanceof Object && Array.isArray(data.rikishi)) {
      this.rikishi = data.rikishi
      progressCallback(100, 'loaded all-rikishi ' + this.rikishi.length)
      return
    }
    let faults = 0
    // 2. we need to build it...
    // really should just go get the basic banzuke JSON data first...
    progressCallback(0, 'fetch banzuke JSON')
    const aa = this.divisions
    for (let i = 0; i < aa.length; i++) {
      const d = aa[i]
      progressCallback(Math.floor((i / aa.length) * 100), `fetch division ${d.sumoOrJpPage || 0}`)
      const rows = await this.cacheSumoOrJpDivision(d.sumoOrJpPage, false, false, false)
      this.rikishi.push(...rows)
    }
    // 3. get the thumbnails if not got already - this usually works OK when the website is up
    progressCallback(0, 'load/fetch rikishi profiles...')
    for (let i = 0; i < this.rikishi.length; i++) {
      const r = new Rikishi(...this.rikishi[i])
      progressCallback(Math.floor((i / this.rikishi.length) * 100), `rikishi ${r.shikona} (${i + 1} of ${this.rikishi.length})`)
      // Thumbnail - usually fine
      await DataDir.getBinary(r.urlThumbnail(), { cacheFile: r.cacheFileThumbnail(), noDataJustCache: true })
      // Profile - give it a try - can be a bit sketchy so nice if we throttle or naturally rate-limit by doing other things in-between
      const html = await DataDir.getText(r.urlProfileEnglish(), { cacheFile: r.cacheFileProfile() })
      // Photo - usually fine...
      await DataDir.getBinary(r.urlProfilePic(), { cacheFile: r.cacheFileProfilePic(), noDataJustCache: true })
      // Scrape the HTML for additional data
      if (!r.scrapeProfileDataEn(html)) {
        console.warn('problem scraping profile data for ' + r.shikona + ' ' + r.rikishiId)
        console.log(`go and test url: ${r.urlProfileEnglish()}`)
        // If bad then delete the cache file
        await DataDir.deleteFile(r.cacheFileProfile())
        faults++
      }
      this.rikishi[i] = r.asRow()
    }
    // 4. all good? Can save table to JSON
    if (faults === 0) {
      progressCallback(100, 'all good - saved table')
    } else {
      progressCallback(100, `faults: ${faults} - just reload to try again`)
      if (!this.saveTabAnyway) { return }
    }
    // Save it anyway
    const newData = {
      written: new Date().toISOString(),
      columns: Rikishi.cols,
      rikishi: this.rikishi
    }
    await DataDir.getJson(null, { cacheFile: fullTableFile, cacheThisData: newData })
  }
}
