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
 */
export class WeatherForecast {
  constructor () {
    this.rawData = this.getData()
    this.processedData = this.processData(this.rawData)
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

  async tryScrapingDirectly () {
    // I don't think it's worth scraping this data - it's more fun to paste it in manually from the website!
    const url = 'https://www.accuweather.com/en/jp/tokyo/226396/daily-weather-forecast/226396'
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

    ]
  }
}
