import { MiniGameBase } from '../MiniGameBase'

class PiTrain extends MiniGameBase {
  constructor (parent) {
    super(parent, 'PiTrain')
    parent.addEventListener('ready', (ev) => {
      this.onReady(ev)
    })
  }
}

export { PiTrain }
