import { MiniGameBase } from './MiniGameBase'

class PiTrain extends MiniGameBase {
  constructor (parent) {
    super(parent, 'PiTrain')
    super.addEventListener('ready', (ev) => {
      super.onReady()
    })
  }
}

export { PiTrain }
