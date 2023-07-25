import * as path from 'path'
import { app } from 'electron'
import debug from 'debug'
import * as Store from 'electron-store'

const dbg = debug('conf')
debug.enable('conf')

const schema = {
  foo: {
    type: 'number',
    maximum: 100,
    minimum: 1,
    default: 50
  },
  maps: {
    type: 'string',
    format: 'uri',
    default: 'mine://unknown'
  }
}

class Config {
  constructor () {
    this.store = null
  }

  load () {
    const p = app.getAppPath()
    dbg('app.getAppPath says "%s"', p)
    this.store = new Store({ schema })
  }
}

export { Config }
