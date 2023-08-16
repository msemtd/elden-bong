import './index.css'
import { Bong } from './bong'

console.log('👋 This message is being logged by "renderer.js", included via webpack')
const appDiv = document.getElementById('app')

const v = window.versions
const t = `This app is using Chrome (v${v.chrome()}), Node.js (v${v.node()}), and Electron (v${v.electron()})`
console.log(t)

const bong = new Bong(appDiv)

window.notifications.onNotifyFromMain((event, topic, msg) => {
  bong.notifyFromMain(event, topic, msg)
})
