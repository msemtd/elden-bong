import { DataDir } from '../DataDir'

/**
 *  Copy and paste days forecast text from...
 * https://www.accuweather.com/en/jp/tokyo/226396/daily-weather-forecast/226396
 * Then let's see how it changes over time
 *
 * So this loads a number of forward-looking forecasts (just text pasted from a page right now)
 * - with a view to seeing how it changes over time
 * - if fetched once a day we would see days pass and change
 * - we would be able to see a trend of "getting warmer", "looks like less rain forecast", etc.
 * - we would naturally expect a forecast to get more accurate as we approach the days in question!
 *
 * Try to fetch data regularly to keep a fresh set of forecasts with enough overlap to see trends over time!
 * Allow the user to set their location URL - provide Tokyo and go from there!
 * Use the DataDir caches and allow the user to manage their data.
 *
 * The nature of the data:
 * - no year in the text so we should assume that days are consecutive and that
 *   a day that is less then the capture date is going to be the next year!
 * - we add date objects - probably not necessary - they're already ordered
 * - it's up to the user to deal with the data
 * - weather alerts need to be stripped out manually - oh well!
 */
export class WeatherForecast {
  constructor () {
    this.rawData = this.getData()
    this.location = 'Tokyo'
    this.pasteUrl = 'https://www.accuweather.com/en/jp/tokyo/226396/daily-weather-forecast/226396'
    // the data is captured using a browser here in the UK with my local settings
    this.locale = new Intl.Locale('en-GB')
    this.processedData = this.processData(this.rawData)
    this.applyDateChecks()
  }

  processData (data) {
    // the data is a list of screen-grabs captured on certain days
    // each text dump is split into days and parsed into objects
    const allGrabs = data.map(item => {
      return {
        ...item,
        days: this.parseDays(item.pageText.trim())
      }
    })
    return allGrabs
  }

  parseDays (text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const dayPattern = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/
    const days = []
    let currentDay = null
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (dayPattern.test(line)) {
        currentDay = { dow: line, rem: [] }
        days.push(currentDay)
      } else {
        if (!currentDay) {
          console.warn('Unexpected line found before day header:', line)
        }
        currentDay?.rem.push(line)
      }
    }
    days.forEach(day => {
      day.date = day.rem[0] // e.g. 02/09
      day.temperature = day.rem[1] // e.g. 36° /27°
      day.precipitation = day.rem[2] // e.g. 6%
      day.description = day.rem[3] // e.g. Becoming windier and very hot with broken intervals; danger of dehydration and heatstroke if outside for extended periods of time
      day.realFeel = day.rem[5] // e.g. 41°
      day.realFeelShade = day.rem[7] // e.g. 38°
      day.maxUVIndex = day.rem[9] // e.g. 8.0 (Unhealthy)
      day.wind = day.rem[11] // e.g. S 24 km/h
    })
    return days
  }

  // For each forecast set the range with checks
  // do this once after the raw data processing
  // fully qualify the date objects
  // check the days of the week
  // TODO enforce the contiguity of the range of days
  // TODO enforce that the
  // not sure this is even necessary!
  // maybe don't do it!
  applyDateChecks () {
    const forecastYearStart = 2025
    // get the start and end days for the range of forecasts
    // we have locale-dependent data - but just live with it!
    this.processedData.forEach(f => {
      // take the capture date and try to use it to make the days fully specified
      {
        // each capture date is a forward looking forecast (naturally! safe assumption)
        const [yyyy, mm, dd, hh, mmi, ss] = [...f.captured.split('-').map(n => parseInt(n, 10)), 0, 0, 0]
        if (yyyy !== forecastYearStart) {
          throw Error(`unexpected forecast year ${yyyy}, need to update code`)
        }
        const capDate = new Date(yyyy, parseInt(mm, 10) - 1, dd, hh, mmi, ss)
        console.log('capture date ' + capDate.toLocaleDateString())
        f.captureDateObj = capDate
      }
      const capUtc = f.captureDateObj.valueOf()
      let [min, max] = [null, null]
      f.days.forEach(d => {
        const [day, month] = d.date.split('/').map(n => parseInt(n, 10))
        const o = new Date()
        o.setDate(day)
        o.setMonth(month - 1) // zero based month
        // console.log(`dd: ${dd} == ${o.toLocaleDateString()}`)
        d.dateObj = o

        // assert that the weekday matches that in the
        const dtf = new Intl.DateTimeFormat(this.locale, { weekday: 'short' })
        console.assert(dtf.format(o) === d.dow)
        const dms = o.valueOf()
        if (!min) {
          max = min = dms
        }
        if (min < capUtc) {
          // throw Error(`Forecast day data is less than ${f.captureDateObj.toLocaleDateString()}`)
        }
        if (dms > max) {
          max = dms
        }
      })
      console.log(`Forecast from ${new Date(min).toLocaleDateString()} to ${new Date(max).toLocaleDateString()}`)
    })
  }

  async tryScrapingDirectly () {
    // I don't think it's worth scraping this data - it's more fun to paste it in manually from the website!
    const url = this.pasteUrl
    // const ts = new Date().toISOString().substring(0, 19).replace(/[:T]/g, '-')
    const ts = new Date().toISOString().substring(0, 10).replace(/[:T]/g, '-')
    const d = await DataDir.getText(url, { useCache: false, timeout: 15000 })
    console.log(d)
    console.log(`Fetching ${url} at ${ts}`)
  }

  getData () {
    return [
      {
        captured: '2025-09-01-12-49-41',
        pageText: `

Tue
02/09
36° /27°
6%
Becoming windier and very hot with broken intervals; danger of dehydration and heatstroke if outside for extended periods of time
RealFeel®
41°

RealFeel Shade™
38°

Max UV Index
8.0 (Unhealthy)

Wind
S 24 km/h

Wed
03/09
35° /26°
66%
Some sun, then turning cloudy and hot, becoming breezy in the afternoon with a thunderstorm or two; caution advised if outside for extended periods of time
RealFeel®
42°

RealFeel Shade™
39°

Max UV Index
8.0 (Unhealthy)

Wind
SW 15 km/h

Thu
04/09
29° /24°
75%
Cloudy and not as hot; very humid in the morning, becoming breezy with a little rain at times in the afternoon
RealFeel®
35°

RealFeel Shade™
33°

Max UV Index
3.0 (Moderate)

Wind
SE 17 km/h

Fri
05/09
31° /25°
99%
Periods of rain, some heavy, and a thunderstorm, very windy in the morning; very humid; watch for flooding
RealFeel®
36°

RealFeel Shade™
36°

Max UV Index
1.0 (Good)

Wind
SSW 28 km/h

Sat
06/09
32° /24°
1%
Mostly sunny, very warm and muggy
RealFeel®
37°

RealFeel Shade™
33°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SE 15 km/h

Sun
07/09
32° /24°
2%
Clouds followed by a brightening sky, very warm and muggy
RealFeel®
35°

RealFeel Shade™
34°

Max UV Index
4.0 (Moderate)

Wind
S 20 km/h

Mon
08/09
30° /23°
4%
Very humid with sunny periods
RealFeel®
35°

RealFeel Shade™
33°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SSW 15 km/h


Tue
09/09
29° /23°
25%
Humid with bright periods
RealFeel®
34°

RealFeel Shade™
31°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
S 17 km/h

Wed
10/09
30° /24°
5%
Partly sunny and humid
RealFeel®
37°

RealFeel Shade™
33°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SSW 13 km/h

Thu
11/09
30° /24°
60%
Mostly cloudy and very humid; a little afternoon rain
RealFeel®
38°

RealFeel Shade™
35°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
NE 4 km/h

Fri
12/09
32° /24°
57%
A little morning rain; otherwise, overcast, very warm and muggy
RealFeel®
36°

RealFeel Shade™
36°

Max UV Index
2.0 (Good)

Wind
ENE 7 km/h


Sat
13/09
32° /25°
70%
Very warm and muggy with broken intervals; a passing morning shower followed by periods of rain in the afternoon
RealFeel®
38°

RealFeel Shade™
36°

Max UV Index
3.0 (Moderate)

Wind
WSW 6 km/h

Sun
14/09
29° /22°
20%
Partly sunny and humid
RealFeel®
37°

RealFeel Shade™
33°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
N 6 km/h

Mon
15/09
29° /23°
25%
Broken intervals and very humid
RealFeel®
35°

RealFeel Shade™
33°

Max UV Index
3.0 (Moderate)

Wind
N 7 km/h

Tue
16/09
29° /23°
25%
Broken intervals and humid
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
3.0 (Moderate)

Wind
NNE 9 km/h


Wed
17/09
29° /22°
10%
Mostly sunny and very humid
RealFeel®
38°

RealFeel Shade™
35°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
N 2 km/h

Thu
18/09
28° /22°
61%
Very humid with sunny periods; a couple of afternoon showers and a thunderstorm
RealFeel®
36°

RealFeel Shade™
31°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
N 6 km/h

Fri
19/09
28° /22°
59%
Periods of rain
RealFeel®
28°

RealFeel Shade™
28°

Max UV Index
2.0 (Good)

Wind
N 15 km/h

Sat
20/09
27° /22°
25%
Cloudy and humid
RealFeel®
31°

RealFeel Shade™
31°

Max UV Index
2.0 (Good)

Wind
SSW 6 km/h


Sun
21/09
28° /22°
20%
Partly sunny and very humid
RealFeel®
34°

RealFeel Shade™
33°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
SSW 11 km/h

Mon
22/09
28° /22°
57%
Very humid with more clouds than sun; a few showers in the afternoon
RealFeel®
34°

RealFeel Shade™
31°

Max UV Index
4.0 (Moderate)

Wind
NW 7 km/h

Tue
23/09
27° /21°
55%
A passing shower in the morning; otherwise, humid with sunny periods
RealFeel®
33°

RealFeel Shade™
31°

Max UV Index
3.0 (Moderate)

Wind
NNE 7 km/h

Wed
24/09
28° /22°
25%
Very humid with sunny periods
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
3.0 (Moderate)

Wind
SSW 6 km/h


Thu
25/09
28° /21°
57%
A little rain in the morning; otherwise, cloudy and humid
RealFeel®
32°

RealFeel Shade™
31°

Max UV Index
2.0 (Good)

Wind
NNE 6 km/h

Fri
26/09
27° /21°
25%
Broken intervals and less humid
RealFeel®
28°

RealFeel Shade™
27°

Max UV Index
2.0 (Good)

Wind
NE 9 km/h

Sat
27/09
25° /20°
25%
Cloudy
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
N 11 km/h

Sun
28/09
26° /20°
55%
Cloudy and humid with a little rain
RealFeel®
28°

RealFeel Shade™
28°

Max UV Index
2.0 (Good)

Wind
N 9 km/h


Mon
29/09
25° /20°
55%
Cloudy and humid with a shower in spots
RealFeel®
27°

RealFeel Shade™
27°

Max UV Index
1.0 (Good)

Wind
NW 7 km/h

Tue
30/09
27° /19°
25%
Humid with broken intervals
RealFeel®
28°

RealFeel Shade™
27°

Max UV Index
2.0 (Good)

Wind
N 6 km/h

Wed
01/10
26° /20°
55%
Overcast and humid with a shower in spots
RealFeel®
27°

RealFeel Shade™
26°

Max UV Index
2.0 (Good)

Wind
NNE 7 km/h

Thu
02/10
25° /19°
55%
Overcast and humid with a little rain
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
NNE 11 km/h


Fri
03/10
24° /19°
25%
Cloudy and humid
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
W 6 km/h

Sat
04/10
26° /19°
25%
Cloudy and humid
RealFeel®
30°

RealFeel Shade™
28°

Max UV Index
2.0 (Good)

Wind
WNW 9 km/h

Sun
05/10
24° /19°
59%
Cloudy with showers
RealFeel®
24°

RealFeel Shade™
24°

Max UV Index
1.0 (Good)

Wind
NNE 11 km/h

Mon
06/10
23° /18°
25%
Broken intervals
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
NNE 9 km/h


Tue
07/10
23° /16°
70%
Broken intervals with showers and thunderstorms, mainly early on
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 13 km/h

Wed
08/10
23° /15°
25%
Turning cloudy
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
2.0 (Good)

Wind
ENE 2 km/h

Thu
09/10
22° /18°
79%
Rain
RealFeel®
20°

RealFeel Shade™
19°

Max UV Index
1.0 (Good)

Wind
ENE 6 km/h

Fri
10/10
22° /18°
25%
Bright periods
RealFeel®
23°

RealFeel Shade™
22°

Max UV Index
2.0 (Good)

Wind
NW 9 km/h


Sat
11/10
24° /17°
65%
Overcast and humid; a couple of afternoon showers and a thunderstorm
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
NE 6 km/h

Sun
12/10
23° /17°
20%
Spells of sunshine
RealFeel®
25°

RealFeel Shade™
22°

Max UV Index
4.0 (Moderate)

Wind
N 11 km/h

Mon
13/10
22° /15°
0%
Sunny periods
RealFeel®
21°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NE 20 km/h

Tue
14/10
23° /16°
2%
Sunny periods
RealFeel®
24°

RealFeel Shade™
21°

Max UV Index
4.0 (Moderate)

Wind
NE 11 km/h


Wed
15/10
21° /15°
40%
Sunny periods with a shower in places in the afternoon
RealFeel®
22°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NE 15 km/h

`
      },
      {
        captured: '2025-09-02-09-13-45',
        pageText: `

Tue
02/09
35° /27°
6%
Becoming windier and very hot with increasing cloud; danger of dehydration and heatstroke if outside for extended periods of time

RealFeel®
40°

RealFeel Shade™
37°

Max UV Index
8.0 (Unhealthy)

Wind
S 24 km/h

Wed
03/09
36° /26°
55%
Some sun, then turning cloudy and hot, becoming breezy in the afternoon with a thunderstorm around; caution advised if outside for extended periods of time
RealFeel®
43°

RealFeel Shade™
39°

Max UV Index
8.0 (Unhealthy)

Wind
SE 15 km/h

Thu
04/09
30° /25°
75%
Cloudy, very humid and not as hot; a little rain at times in the afternoon
RealFeel®
35°

RealFeel Shade™
33°

Max UV Index
2.0 (Good)

Wind
E 13 km/h

Fri
05/09
30° /25°
100%
Periods of heavy rain and a thunderstorm; cloudy, breezy and very humid; watch for flooding
RealFeel®
35°

RealFeel Shade™
35°

Max UV Index
1.0 (Good)

Wind
SSW 20 km/h

Sat
06/09
33° /24°
2%
Very warm and muggy with broken intervals
RealFeel®
36°

RealFeel Shade™
35°

Max UV Index
4.0 (Moderate)

Wind
ENE 19 km/h

Sun
07/09
32° /25°
2%
Very warm and muggy with sunny spells
RealFeel®
37°

RealFeel Shade™
34°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
S 15 km/h

Mon
08/09
34° /25°
10%
Hot and humid with long sunny spells
RealFeel®
41°

RealFeel Shade™
37°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SSE 15 km/h

Tue
09/09
31° /24°
61%
Bright periods, very warm and very humid; a couple of thundery showers in the afternoon
RealFeel®
36°

RealFeel Shade™
36°

Max UV Index
3.0 (Moderate)

Wind
SSW 9 km/h


Wed
10/09
28° /23°
55%
Broken intervals and very humid with a thundery shower
RealFeel®
33°

RealFeel Shade™
33°

Max UV Index
3.0 (Moderate)

Wind
SSW 9 km/h

Thu
11/09
32° /25°
55%
Mostly cloudy, very warm and muggy; a little afternoon rain
RealFeel®
36°

RealFeel Shade™
35°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SSW 13 km/h

Fri
12/09
30° /23°
56%
Overcast and humid; a little morning rain followed by a shower in spots in the afternoon
RealFeel®
32°

RealFeel Shade™
30°

Max UV Index
3.0 (Moderate)

Wind
NNE 9 km/h

Sat
13/09
29° /23°
57%
Cloudy and humid with the odd shower
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
4.0 (Moderate)

Wind
ENE 9 km/h


Sun
14/09
30° /24°
55%
Cloudy and humid with a shower in spots
RealFeel®
32°

RealFeel Shade™
32°

Max UV Index
2.0 (Good)

Wind
SSW 11 km/h

Mon
15/09
29° /23°
25%
Broken intervals and very humid
RealFeel®
35°

RealFeel Shade™
33°

Max UV Index
3.0 (Moderate)

Wind
N 7 km/h

Tue
16/09
29° /23°
25%
Broken intervals and humid
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
3.0 (Moderate)

Wind
NNE 9 km/h

Wed
17/09
29° /22°
10%
Mostly sunny and very humid
RealFeel®
38°

RealFeel Shade™
35°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
N 2 km/h


Thu
18/09
28° /22°
61%
Very humid with sunny periods; a couple of afternoon showers and a thunderstorm
RealFeel®
36°

RealFeel Shade™
31°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
N 6 km/h

Fri
19/09
28° /22°
59%
Periods of rain
RealFeel®
28°

RealFeel Shade™
28°

Max UV Index
2.0 (Good)

Wind
N 15 km/h

Sat
20/09
27° /22°
25%
Cloudy and humid
RealFeel®
31°

RealFeel Shade™
31°

Max UV Index
2.0 (Good)

Wind
SSW 6 km/h

Sun
21/09
28° /22°
20%
Partly sunny and very humid
RealFeel®
34°

RealFeel Shade™
33°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
SSW 11 km/h


Mon
22/09
28° /22°
57%
Very humid with more clouds than sun; a few showers in the afternoon
RealFeel®
34°

RealFeel Shade™
31°

Max UV Index
4.0 (Moderate)

Wind
NW 7 km/h

Tue
23/09
27° /21°
55%
A passing shower in the morning; otherwise, humid with sunny periods
RealFeel®
33°

RealFeel Shade™
31°

Max UV Index
3.0 (Moderate)

Wind
NNE 7 km/h

Wed
24/09
28° /22°
25%
Very humid with sunny periods
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
3.0 (Moderate)

Wind
SSW 6 km/h

Thu
25/09
28° /21°
57%
A little rain in the morning; otherwise, cloudy and humid
RealFeel®
32°

RealFeel Shade™
31°

Max UV Index
2.0 (Good)

Wind
NNE 6 km/h


Fri
26/09
27° /21°
25%
Broken intervals and less humid
RealFeel®
28°

RealFeel Shade™
27°

Max UV Index
2.0 (Good)

Wind
NE 9 km/h

Sat
27/09
25° /20°
25%
Cloudy
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
N 11 km/h

Sun
28/09
26° /20°
55%
Cloudy and humid with a little rain
RealFeel®
28°

RealFeel Shade™
28°

Max UV Index
2.0 (Good)

Wind
N 9 km/h

Mon
29/09
25° /20°
55%
Cloudy and humid with a shower in spots
RealFeel®
27°

RealFeel Shade™
27°

Max UV Index
1.0 (Good)

Wind
NW 7 km/h


Tue
30/09
27° /19°
25%
Humid with broken intervals
RealFeel®
28°

RealFeel Shade™
27°

Max UV Index
2.0 (Good)

Wind
N 6 km/h

Wed
01/10
26° /20°
55%
Overcast and humid with a shower in spots
RealFeel®
27°

RealFeel Shade™
26°

Max UV Index
2.0 (Good)

Wind
NNE 7 km/h

Thu
02/10
25° /19°
55%
Overcast and humid with a little rain
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
NNE 11 km/h

Fri
03/10
24° /19°
25%
Cloudy and humid
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
W 6 km/h


Sat
04/10
26° /19°
25%
Cloudy and humid
RealFeel®
30°

RealFeel Shade™
28°

Max UV Index
2.0 (Good)

Wind
WNW 9 km/h

Sun
05/10
24° /19°
59%
Cloudy with showers
RealFeel®
24°

RealFeel Shade™
24°

Max UV Index
1.0 (Good)

Wind
NNE 11 km/h

Mon
06/10
23° /18°
25%
Broken intervals
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
NNE 9 km/h

Tue
07/10
23° /16°
70%
Broken intervals with showers and thunderstorms, mainly early on
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 13 km/h


Wed
08/10
23° /15°
25%
Turning cloudy
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
2.0 (Good)

Wind
ENE 2 km/h

Thu
09/10
22° /18°
79%
Rain
RealFeel®
20°

RealFeel Shade™
19°

Max UV Index
1.0 (Good)

Wind
ENE 6 km/h

Fri
10/10
22° /18°
25%
Bright periods
RealFeel®
23°

RealFeel Shade™
22°

Max UV Index
2.0 (Good)

Wind
NW 9 km/h

Sat
11/10
24° /17°
65%
Overcast and humid; a couple of afternoon showers and a thunderstorm
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
NE 6 km/h


Sun
12/10
23° /17°
20%
Spells of sunshine
RealFeel®
25°

RealFeel Shade™
22°

Max UV Index
4.0 (Moderate)

Wind
N 11 km/h

Mon
13/10
22° /15°
0%
Sunny periods
RealFeel®
21°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NE 20 km/h

Tue
14/10
23° /16°
2%
Sunny periods
RealFeel®
24°

RealFeel Shade™
21°

Max UV Index
4.0 (Moderate)

Wind
NE 11 km/h

Wed
15/10
21° /15°
40%
Sunny periods with a shower in places in the afternoon
RealFeel®
22°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NE 15 km/h


Thu
16/10
21° /14°
57%
A little rain in the morning; otherwise, low clouds
RealFeel®
20°

RealFeel Shade™
20°

Max UV Index
1.0 (Good)

Wind
NNE 15 km/h


`

      },
      {
        captured: '2025-09-03-09-54-16',
        pageText: `

Wed
03/09
35° /26°
55%
Some sun, then clouds and very hot; breezy this afternoon with a thunderstorm in a couple of spots; caution advised if outside for extended periods of time

RealFeel®
43°

RealFeel Shade™
39°

Max UV Index
8.0 (Unhealthy)

Wind
SE 17 km/h

Thu
04/09
30° /25°
75%
Cloudy and very humid; a little rain at times in the afternoon
RealFeel®
35°

RealFeel Shade™
33°

Max UV Index
2.0 (Good)

Wind
SE 13 km/h

Fri
05/09
28° /24°
98%
Breezy in the morning with periods of rain and a thunderstorm, overcast and very humid; a couple of heavy thunderstorms in the afternoon; watch for flooding
RealFeel®
33°

RealFeel Shade™
31°

Max UV Index
3.0 (Moderate)

Wind
WSW 19 km/h

Sat
06/09
32° /24°
1%
Very warm and muggy with sunny periods
RealFeel®
38°

RealFeel Shade™
34°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SE 13 km/h

Sun
07/09
32° /25°
2%
Humid with sunny periods; breezy in the afternoon
RealFeel®
35°

RealFeel Shade™
33°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
S 20 km/h

Mon
08/09
34° /25°
6%
Hot and humid with long sunny spells
RealFeel®
40°

RealFeel Shade™
37°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SSE 17 km/h

Tue
09/09
32° /25°
25%
Partly sunny, very warm and very humid
RealFeel®
40°

RealFeel Shade™
36°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
ENE 15 km/h

Wed
10/09
26° /21°
55%
Cloudy and not as warm but humid; a passing thunderstorm in the afternoon
RealFeel®
33°

RealFeel Shade™
30°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
N 4 km/h


Thu
11/09
26° /21°
55%
Overcast with a thunderstorm in parts of the area
RealFeel®
27°

RealFeel Shade™
27°

Max UV Index
2.0 (Good)

Wind
NE 11 km/h

Fri
12/09
30° /24°
61%
Mostly cloudy; a few morning showers followed by a little rain in the afternoon
RealFeel®
35°

RealFeel Shade™
31°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SSE 6 km/h

Sat
13/09
31° /23°
65%
Very warm and muggy with periods of rain
RealFeel®
38°

RealFeel Shade™
35°

Max UV Index
5.0 (Moderate)

Wind
NE 2 km/h

Sun
14/09
31° /24°
55%
A little rain in the morning; otherwise, broken intervals, very warm and muggy
RealFeel®
37°

RealFeel Shade™
33°

Max UV Index
5.0 (Moderate)

Wind
E 4 km/h


Mon
15/09
32° /25°
2%
Remaining very warm with sunny spells
RealFeel®
35°

RealFeel Shade™
33°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SSW 13 km/h

Tue
16/09
29° /23°
25%
Broken intervals and humid
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
3.0 (Moderate)

Wind
NNE 7 km/h

Wed
17/09
29° /23°
25%
Very humid with sunny periods
RealFeel®
38°

RealFeel Shade™
33°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
NNW 6 km/h

Thu
18/09
29° /22°
25%
Humid with sunny periods
RealFeel®
34°

RealFeel Shade™
31°

Max UV Index
3.0 (Moderate)

Wind
N 4 km/h


Fri
19/09
28° /22°
25%
Humid with decreasing cloud
RealFeel®
34°

RealFeel Shade™
30°

Max UV Index
4.0 (Moderate)

Wind
S 4 km/h

Sat
20/09
28° /21°
25%
Humid with bright periods
RealFeel®
30°

RealFeel Shade™
29°

Max UV Index
3.0 (Moderate)

Wind
S 6 km/h

Sun
21/09
28° /22°
20%
Humid with broken cloud and sunny spells
RealFeel®
32°

RealFeel Shade™
30°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
SSW 9 km/h

Mon
22/09
28° /21°
5%
Very humid with spells of sunshine
RealFeel®
36°

RealFeel Shade™
33°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
NW 4 km/h


Tue
23/09
28° /20°
55%
Cloudy with a little rain
RealFeel®
27°

RealFeel Shade™
26°

Max UV Index
1.0 (Good)

Wind
NE 11 km/h

Wed
24/09
24° /19°
55%
Cloudy with a little rain
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
1.0 (Good)

Wind
N 9 km/h

Thu
25/09
24° /21°
58%
A little rain in the morning; otherwise, cloudy and humid
RealFeel®
26°

RealFeel Shade™
26°

Max UV Index
1.0 (Good)

Wind
NNE 4 km/h

Fri
26/09
27° /21°
25%
Broken intervals and humid
RealFeel®
28°

RealFeel Shade™
28°

Max UV Index
2.0 (Good)

Wind
NE 7 km/h


Sat
27/09
25° /20°
25%
Broken intervals and humid
RealFeel®
29°

RealFeel Shade™
28°

Max UV Index
1.0 (Good)

Wind
SSW 9 km/h

Sun
28/09
27° /20°
55%
Cloudy and very humid; a shower in spots in the morning followed by a thunderstorm in spots in the afternoon
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
2.0 (Good)

Wind
NW 7 km/h

Mon
29/09
26° /19°
55%
Cloudy with a shower in spots
RealFeel®
26°

RealFeel Shade™
26°

Max UV Index
1.0 (Good)

Wind
NNE 7 km/h

Tue
30/09
25° /19°
25%
Broken intervals
RealFeel®
26°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
N 6 km/h


Wed
01/10
25° /20°
65%
Mostly cloudy and humid; a couple of showers and a thunderstorm in the afternoon
RealFeel®
27°

RealFeel Shade™
26°

Max UV Index
2.0 (Good)

Wind
NE 7 km/h

Thu
02/10
24° /18°
59%
Humid with occasional rain
RealFeel®
26°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
N 6 km/h

Fri
03/10
23° /16°
25%
Broken intervals
RealFeel®
24°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 6 km/h

Sat
04/10
24° /16°
10%
Sunny spells
RealFeel®
25°

RealFeel Shade™
23°

Max UV Index
5.0 (Moderate)

Wind
N 13 km/h


Sun
05/10
24° /17°
25%
Increasing cloud
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
3.0 (Moderate)

Wind
N 6 km/h

Mon
06/10
25° /19°
20%
Humid with sunny spells
RealFeel®
30°

RealFeel Shade™
26°

Max UV Index
5.0 (Moderate)

Wind
WNW 4 km/h

Tue
07/10
23° /18°
68%
Rain
RealFeel®
23°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 15 km/h

Wed
08/10
22° /17°
25%
Cloudy
RealFeel®
21°

RealFeel Shade™
21°

Max UV Index
1.0 (Good)

Wind
N 13 km/h


Thu
09/10
23° /16°
20%
Long sunny spells
RealFeel®
24°

RealFeel Shade™
21°

Max UV Index
5.0 (Moderate)

Wind
N 13 km/h

Fri
10/10
24° /18°
55%
Bright periods with a few showers
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
3.0 (Moderate)

Wind
N 13 km/h

Sat
11/10
24° /18°
76%
Overcast; a passing shower in the morning followed by rain in the afternoon
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 11 km/h

Sun
12/10
24° /14°
25%
Less humid with periods of sunshine
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
2.0 (Good)

Wind
NNW 11 km/h


Mon
13/10
21° /13°
5%
Long periods of sunshine
RealFeel®
23°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NNE 6 km/h

Tue
14/10
20° /13°
25%
Increasing cloud
RealFeel®
21°

RealFeel Shade™
20°

Max UV Index
3.0 (Moderate)

Wind
NNE 4 km/h

Wed
15/10
21° /16°
25%
Cloudy
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
W 4 km/h

Thu
16/10
23° /17°
75%
Rain ending in the morning; cloudy and humid
RealFeel®
24°

RealFeel Shade™
24°

Max UV Index
1.0 (Good)

Wind
SSW 22 km/h


Fri
17/10
22° /15°
2%
Sunny spells
RealFeel®
23°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NE 9 km/h
  `

      },
      {

        captured: '2025-09-04-09-29-33',
        pageText: `

Thu
04/09
28° /25°
75%
Cloudy, very humid and not as hot; rain and drizzle this afternoon

RealFeel®
35°

RealFeel Shade™
32°

Max UV Index
3.0 (Moderate)

Wind
SE 13 km/h

Fri
05/09
27° /24°
99%
Periods of rain and a thunderstorm in the morning, overcast and very humid; a couple of heavy thunderstorms in the afternoon; watch for flooding
RealFeel®
31°

RealFeel Shade™
31°

Max UV Index
2.0 (Good)

Wind
WNW 13 km/h

Sat
06/09
32° /24°
1%
Warmer and very humid with sunny periods
RealFeel®
39°

RealFeel Shade™
35°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
ESE 15 km/h

Sun
07/09
33° /25°
3%
Partly sunny, very warm and muggy; breezy in the afternoon
RealFeel®
38°

RealFeel Shade™
35°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
S 20 km/h

Mon
08/09
34° /26°
8%
Partly sunny, hot and humid; danger of dehydration and heatstroke if outside for extended periods of time
RealFeel®
41°

RealFeel Shade™
38°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
ESE 13 km/h

Tue
09/09
34° /26°
61%
Hot and humid; bright periods with a brief shower or two
RealFeel®
42°

RealFeel Shade™
38°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
ESE 15 km/h

Wed
10/09
33° /24°
55%
Cloudy, windy and humid; an afternoon thunderstorm in parts of the area
RealFeel®
36°

RealFeel Shade™
35°

Max UV Index
4.0 (Moderate)

Wind
SSW 32 km/h

Thu
11/09
31° /23°
55%
Mostly cloudy, very warm and muggy; a thunderstorm in spots in the afternoon
RealFeel®
36°

RealFeel Shade™
35°

Max UV Index
3.0 (Moderate)

Wind
SSW 11 km/h


Fri
12/09
29° /24°
65%
Overcast and very humid; a few morning showers followed by a little rain in the afternoon
RealFeel®
37°

RealFeel Shade™
34°

Max UV Index
2.0 (Good)

Wind
ESE 6 km/h

Sat
13/09
31° /24°
59%
Cloudy, very warm and muggy; a little rain in the afternoon
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
4.0 (Moderate)

Wind
SSW 13 km/h

Sun
14/09
32° /23°
0%
Very warm and less humid with sun through high clouds
RealFeel®
31°

RealFeel Shade™
31°

Max UV Index
3.0 (Moderate)

Wind
SW 9 km/h

Mon
15/09
31° /24°
10%
Very warm and muggy with sun and areas of high clouds
RealFeel®
37°

RealFeel Shade™
34°

Max UV Index
4.0 (Moderate)

Wind
SSW 4 km/h


Tue
16/09
33° /25°
19%
Remaining very warm with sunny periods
RealFeel®
35°

RealFeel Shade™
33°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
ENE 11 km/h

Wed
17/09
29° /23°
25%
Very humid with sunny periods
RealFeel®
38°

RealFeel Shade™
33°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
NNW 6 km/h

Thu
18/09
29° /22°
25%
Humid with sunny periods
RealFeel®
34°

RealFeel Shade™
31°

Max UV Index
3.0 (Moderate)

Wind
N 4 km/h

Fri
19/09
28° /22°
25%
Humid with decreasing cloud
RealFeel®
34°

RealFeel Shade™
30°

Max UV Index
4.0 (Moderate)

Wind
S 4 km/h


Sat
20/09
28° /21°
25%
Humid with bright periods
RealFeel®
30°

RealFeel Shade™
29°

Max UV Index
3.0 (Moderate)

Wind
S 6 km/h

Sun
21/09
28° /22°
20%
Humid with broken cloud and sunny spells
RealFeel®
32°

RealFeel Shade™
30°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
SSW 9 km/h

Mon
22/09
28° /21°
5%
Very humid with spells of sunshine
RealFeel®
36°

RealFeel Shade™
33°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
NW 4 km/h

Tue
23/09
28° /20°
55%
Cloudy with a little rain
RealFeel®
27°

RealFeel Shade™
26°

Max UV Index
1.0 (Good)

Wind
NE 11 km/h


Wed
24/09
24° /19°
55%
Cloudy with a little rain
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
1.0 (Good)

Wind
N 9 km/h

Thu
25/09
24° /21°
58%
A little rain in the morning; otherwise, cloudy and humid
RealFeel®
26°

RealFeel Shade™
26°

Max UV Index
1.0 (Good)

Wind
NNE 4 km/h

Fri
26/09
27° /21°
25%
Broken intervals and humid
RealFeel®
28°

RealFeel Shade™
28°

Max UV Index
2.0 (Good)

Wind
NE 7 km/h

Sat
27/09
25° /20°
25%
Broken intervals and humid
RealFeel®
29°

RealFeel Shade™
28°

Max UV Index
1.0 (Good)

Wind
SSW 9 km/h


Sun
28/09
27° /20°
55%
Cloudy and very humid; a shower in spots in the morning followed by a thunderstorm in spots in the afternoon
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
2.0 (Good)

Wind
NW 7 km/h

Mon
29/09
26° /19°
55%
Cloudy with a shower in spots
RealFeel®
26°

RealFeel Shade™
26°

Max UV Index
1.0 (Good)

Wind
NNE 7 km/h

Tue
30/09
25° /19°
25%
Broken intervals
RealFeel®
26°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
N 6 km/h

Wed
01/10
25° /20°
65%
Mostly cloudy and humid; a couple of showers and a thunderstorm in the afternoon
RealFeel®
27°

RealFeel Shade™
26°

Max UV Index
2.0 (Good)

Wind
NE 7 km/h


Thu
02/10
24° /18°
59%
Humid with occasional rain
RealFeel®
26°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
N 6 km/h

Fri
03/10
23° /16°
25%
Broken intervals
RealFeel®
24°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 6 km/h

Sat
04/10
24° /16°
10%
Sunny spells
RealFeel®
25°

RealFeel Shade™
23°

Max UV Index
5.0 (Moderate)

Wind
N 13 km/h

Sun
05/10
24° /17°
25%
Increasing cloud
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
3.0 (Moderate)

Wind
N 6 km/h


Mon
06/10
25° /19°
20%
Humid with sunny spells
RealFeel®
30°

RealFeel Shade™
26°

Max UV Index
5.0 (Moderate)

Wind
WNW 4 km/h

Tue
07/10
23° /18°
68%
Rain
RealFeel®
23°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 15 km/h

Wed
08/10
22° /17°
25%
Cloudy
RealFeel®
21°

RealFeel Shade™
21°

Max UV Index
1.0 (Good)

Wind
N 13 km/h

Thu
09/10
23° /16°
20%
Long sunny spells
RealFeel®
24°

RealFeel Shade™
21°

Max UV Index
5.0 (Moderate)

Wind
N 13 km/h


Fri
10/10
24° /18°
55%
Bright periods with a few showers
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
3.0 (Moderate)

Wind
N 13 km/h

Sat
11/10
24° /18°
76%
Overcast; a passing shower in the morning followed by rain in the afternoon
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 11 km/h

Sun
12/10
24° /14°
25%
Less humid with periods of sunshine
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
2.0 (Good)

Wind
NNW 11 km/h

Mon
13/10
21° /13°
5%
Long periods of sunshine
RealFeel®
23°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NNE 6 km/h


Tue
14/10
20° /13°
25%
Increasing cloud
RealFeel®
21°

RealFeel Shade™
20°

Max UV Index
3.0 (Moderate)

Wind
NNE 4 km/h

Wed
15/10
21° /16°
25%
Cloudy
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
W 4 km/h

Thu
16/10
23° /17°
75%
Rain ending in the morning; cloudy and humid
RealFeel®
24°

RealFeel Shade™
24°

Max UV Index
1.0 (Good)

Wind
SSW 22 km/h

Fri
17/10
22° /15°
2%
Sunny spells
RealFeel®
23°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NE 9 km/h


Sat
18/10
22° /16°
3%
Long sunny spells
RealFeel®
23°

RealFeel Shade™
21°

Max UV Index
4.0 (Moderate)

Wind
NE 11 km/h

        `
      },
      {
        captured: '2025-09-01-12-49-41',
        pageText:
`
Mon
08/09
35° /26°
25%
Partly cloudy, warm and very humid

RealFeel®
31°

Cloud Cover
52%

Wind
E 11 km/h

Wind Gusts
19 km/h

Tue
09/09
34° /26°
70%
A brief shower or two in the morning; otherwise, partly sunny, hot and humid; possible danger of dehydration and heatstroke while doing strenuous activities
RealFeel®
40°

RealFeel Shade™
37°

Max UV Index
7.0 (Unhealthy (Sensitive))

Wind
SSE 15 km/h

Wed
10/09
32° /25°
60%
Very warm and very humid with variable clouds; an afternoon thundery shower
RealFeel®
38°

RealFeel Shade™
36°

Max UV Index
5.0 (Moderate)

Wind
ENE 15 km/h

Thu
11/09
29° /23°
80%
Considerable cloudiness and very humid; a couple of afternoon thundery showers
RealFeel®
33°

RealFeel Shade™
33°

Max UV Index
2.0 (Good)

Wind
ENE 19 km/h

Fri
12/09
29° /23°
60%
Humid; a passing shower in the morning, then sunny periods in the afternoon
RealFeel®
32°

RealFeel Shade™
32°

Max UV Index
5.0 (Moderate)

Wind
NE 17 km/h

Sat
13/09
32° /26°
25%
Very humid with broken intervals; breezy in the afternoon
RealFeel®
34°

RealFeel Shade™
34°

Max UV Index
2.0 (Good)

Wind
SSE 20 km/h

Sun
14/09
32° /25°
19%
Windy and humid with clouds followed by a brightening sky
RealFeel®
34°

RealFeel Shade™
34°

Max UV Index
3.0 (Moderate)

Wind
SSW 35 km/h

Mon
15/09
30° /23°
25%
Very warm and muggy with low clouds
RealFeel®
34°

RealFeel Shade™
34°

Max UV Index
2.0 (Good)

Wind
NE 6 km/h

Tue
16/09
29° /26°
6%
Humid with sunny periods
RealFeel®
36°

RealFeel Shade™
33°

Max UV Index
5.0 (Moderate)

Wind
E 4 km/h

Wed
17/09
33° /25°
18%
Very warm and muggy with sunny periods
RealFeel®
38°

RealFeel Shade™
36°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
SSW 9 km/h

Thu
18/09
32° /25°
55%
Broken intervals and remaining very warm with a shower in spots
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
2.0 (Good)

Wind
ENE 9 km/h

Fri
19/09
29° /22°
55%
Broken intervals; a morning shower in spots followed by a little rain in the afternoon
RealFeel®
31°

RealFeel Shade™
29°

Max UV Index
3.0 (Moderate)

Wind
ENE 7 km/h

Sat
20/09
28° /22°
60%
Humid with periods of rain
RealFeel®
32°

RealFeel Shade™
31°

Max UV Index
2.0 (Good)

Wind
E 4 km/h

Sun
21/09
28° /22°
20%
Humid with broken cloud and sunny spells
RealFeel®
32°

RealFeel Shade™
30°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
SSW 7 km/h

Mon
22/09
28° /21°
5%
Very humid with spells of sunshine
RealFeel®
36°

RealFeel Shade™
33°

Max UV Index
6.0 (Unhealthy (Sensitive))

Wind
NW 4 km/h

Tue
23/09
28° /20°
55%
Cloudy with a little rain
RealFeel®
27°

RealFeel Shade™
26°

Max UV Index
1.0 (Good)

Wind
NE 11 km/h

Wed
24/09
24° /19°
55%
Cloudy with a little rain
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
1.0 (Good)

Wind
N 9 km/h

Thu
25/09
24° /21°
58%
A little rain in the morning; otherwise, cloudy and humid
RealFeel®
26°

RealFeel Shade™
26°

Max UV Index
1.0 (Good)

Wind
NNE 4 km/h

Fri
26/09
27° /21°
25%
Broken intervals and humid
RealFeel®
28°

RealFeel Shade™
28°

Max UV Index
2.0 (Good)

Wind
NE 7 km/h

Sat
27/09
25° /20°
25%
Broken intervals and humid
RealFeel®
29°

RealFeel Shade™
28°

Max UV Index
1.0 (Good)

Wind
SSW 9 km/h

Sun
28/09
27° /20°
55%
Cloudy and very humid; a shower in spots in the morning followed by a thunderstorm in spots in the afternoon
RealFeel®
33°

RealFeel Shade™
32°

Max UV Index
2.0 (Good)

Wind
NW 7 km/h

Mon
29/09
26° /19°
55%
Cloudy with a shower in spots
RealFeel®
26°

RealFeel Shade™
26°

Max UV Index
1.0 (Good)

Wind
NNE 7 km/h

Tue
30/09
25° /19°
25%
Broken intervals
RealFeel®
26°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
N 6 km/h

Wed
01/10
25° /20°
65%
Mostly cloudy and humid; a couple of showers and a thunderstorm in the afternoon
RealFeel®
27°

RealFeel Shade™
26°

Max UV Index
2.0 (Good)

Wind
NE 7 km/h

Thu
02/10
24° /18°
59%
Humid with occasional rain
RealFeel®
26°

RealFeel Shade™
25°

Max UV Index
1.0 (Good)

Wind
N 6 km/h

Fri
03/10
23° /16°
25%
Broken intervals
RealFeel®
24°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 6 km/h

Sat
04/10
24° /16°
10%
Sunny spells
RealFeel®
25°

RealFeel Shade™
23°

Max UV Index
5.0 (Moderate)

Wind
N 13 km/h

Sun
05/10
24° /17°
25%
Increasing cloud
RealFeel®
25°

RealFeel Shade™
25°

Max UV Index
3.0 (Moderate)

Wind
N 6 km/h

Mon
06/10
25° /19°
20%
Humid with sunny spells
RealFeel®
30°

RealFeel Shade™
26°

Max UV Index
5.0 (Moderate)

Wind
WNW 4 km/h

Tue
07/10
23° /18°
68%
Rain
RealFeel®
23°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 15 km/h

Wed
08/10
22° /17°
25%
Cloudy
RealFeel®
21°

RealFeel Shade™
21°

Max UV Index
1.0 (Good)

Wind
N 13 km/h

Thu
09/10
23° /16°
20%
Long sunny spells
RealFeel®
24°

RealFeel Shade™
21°

Max UV Index
5.0 (Moderate)

Wind
N 13 km/h

Fri
10/10
24° /18°
55%
Bright periods with a few showers
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
3.0 (Moderate)

Wind
N 13 km/h

Sat
11/10
24° /18°
76%
Overcast; a passing shower in the morning followed by rain in the afternoon
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
N 11 km/h

Sun
12/10
24° /14°
25%
Less humid with periods of sunshine
RealFeel®
23°

RealFeel Shade™
23°

Max UV Index
2.0 (Good)

Wind
NNW 11 km/h

Mon
13/10
21° /13°
5%
Long periods of sunshine
RealFeel®
23°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NNE 6 km/h

Tue
14/10
20° /13°
25%
Increasing cloud
RealFeel®
21°

RealFeel Shade™
20°

Max UV Index
3.0 (Moderate)

Wind
NNE 4 km/h

Wed
15/10
21° /16°
25%
Cloudy
RealFeel®
22°

RealFeel Shade™
22°

Max UV Index
1.0 (Good)

Wind
W 4 km/h

Thu
16/10
23° /17°
75%
Rain ending in the morning; cloudy and humid
RealFeel®
24°

RealFeel Shade™
24°

Max UV Index
1.0 (Good)

Wind
SSW 22 km/h

Fri
17/10
22° /15°
2%
Sunny spells
RealFeel®
23°

RealFeel Shade™
20°

Max UV Index
4.0 (Moderate)

Wind
NE 9 km/h

Sat
18/10
22° /16°
3%
Long sunny spells
RealFeel®
23°

RealFeel Shade™
21°

Max UV Index
4.0 (Moderate)

Wind
NE 11 km/h

Sun
19/10
22° /16°
25%
Broken intervals
RealFeel®
22°

RealFeel Shade™
21°

Max UV Index
3.0 (Moderate)

Wind
NE 19 km/h

Mon
20/10
22° /12°
7%
Bright periods
RealFeel®
24°

RealFeel Shade™
22°

Max UV Index
4.0 (Moderate)

Wind
N 6 km/h

Tue
21/10
20° /11°
25%
Broken cloud and sunny spells
RealFeel®
20°

RealFeel Shade™
18°

Max UV Index
4.0 (Moderate)

Wind
NNW 15 km/h

Wed
22/10
20° /12°
0%
Spells of sunshine
RealFeel®
19°

RealFeel Shade™
18°

Max UV Index
4.0 (Moderate)

Wind
N 22 km/h

`
      }
    ]
  }
}
