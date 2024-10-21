import './index.css'
import 'dockview-core/dist/styles/dockview.css'
import { createDockview } from 'dockview-core'
import { Bong } from './bong'

console.log('👋 This message is being logged by "renderer.js", included via webpack')
const appDiv = document.getElementById('app')

const v = window.versions
const t = `This app is using Chrome (v${v.chrome()}), Node.js (v${v.node()}), and Electron (v${v.electron()})`
console.log(t)

let bong = null

class BongPanel {
  constructor () {
    this._element = document.createElement('div')
    this._element.id = 'barryChipCob'
  }

  get element () {
    return this._element
  }

  // : GroupPanelPartInitParameters
  init (parameters) {
    bong = new Bong(this._element)
    window.notifications.onNotifyFromMain((event, topic, msg) => {
      bong.notifyFromMain(event, topic, msg)
    })
    //
  }
}
class OtherPanel {
  constructor () {
    this._element = document.createElement('div')
    this._element.style.color = 'orange'
  }

  get element () { return this._element }

  init (parameters) {
    this._element.textContent = 'Other!'
  }
}

const api = createDockview(appDiv, {
  className: 'dockview-theme-abyss',
  createComponent: (options) => {
    console.log(`create view for '${options.name}'...`)
    switch (options.name) {
      case 'bong':
        return new BongPanel()
      case 'default':
        return new OtherPanel()
    }
  }
})

api.addPanel({
  id: 'bong_id',
  component: 'bong',
  title: 'bong',
})
api.addPanel({
  id: 'panel_2',
  component: 'default',
  position: { referencePanel: 'bong_id', direction: 'left' },
  title: 'Panel 2',
  initialWidth: 100,
  initialHeight: 100
})
