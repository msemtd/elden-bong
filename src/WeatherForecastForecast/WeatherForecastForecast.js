import { MiniGameBase } from '../MiniGameBase'
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Dlg } from '../dlg'
import { shellOpenPath, shellOpenExternal } from '../HandyApi'
import { filePathToMine } from '../util'
import path from 'path-browserify'
import van from 'vanjs-core/debug'
import { FloatingWindow } from 'vanjs-ui'
import { WeatherForecast } from './WeatherForecast'

const { p, div, button, label, progress, table, tbody, thead, td, th, tr } = van.tags

export class WeatherForecastForecast extends MiniGameBase {
  constructor (parent) {
    super(parent, 'Forecast')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
      console.assert(this.gui instanceof GUI)
      console.assert(this.group instanceof THREE.Group)
      this.gui.add(this, 'tokyoWeatherForecast').name('Tokyo Weather')
    })
  }

  async tokyoWeatherForecast () {
    try {
      const wf = new WeatherForecast()
      console.log(wf.processedData)
      const fa = wf.processedData
      // make columns - find all days in all forecasts
      const allDays = new Set()
      fa.forEach(forecast => {
        forecast.days.forEach(day => {
          allDays.add(day.date)
        })
      })
      const head = Array.from(allDays).sort((a, b) => {
        const [ad, am] = a.split('/').map(n => parseInt(n, 10))
        const [bd, bm] = b.split('/').map(n => parseInt(n, 10))
        return am - bm || ad - bd
      })
      const tab = fa.map((f) => {
        const row = head.map(d => {
          const df = f.days.find(dd => dd.date === d)
          return df?.temperature || '-'
        })
        return row
      })
      const Table = ({ head, data }) => table(
        { border: '1px solid black', width: '100%' },
        head ? thead({ align: 'left' }, tr(head.map(h => th(h)))) : [],
        tbody(data.map(row => tr(
          row.map(col => td(col))
        )))
      )

      // let's make a dialog
      const closed = van.state(false)
      van.add(document.body, FloatingWindow(
        { title: `${wf.location} Weather Forecast Trends`, closed, width: 400, height: 300 },
        div({ style: 'overflow-x:auto;' },
          p(`Weather forecast for ${wf.location}`),
          button({ onclick: () => { shellOpenExternal(wf.pasteUrl) } }, 'Go grab forecast'),
          div({ id: 'weatherForecast' },
            Table({ head, data: tab })
          )
        )
      ))
    } catch (error) {
      Dlg.errorDialog(error)
    }
  }
}
