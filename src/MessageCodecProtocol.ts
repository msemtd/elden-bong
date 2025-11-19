import * as net from 'net'
import { EventEmitter } from 'node:events'

// Message codec protocol
const etx = 0x7e // '~'
const esc = 0x40 // '@'
const sub = 0x5e // '^'

// local ipv4 interface only
const ip = '127.0.0.1'

class MessageCodecProtocol extends EventEmitter {
  port: number = 0
  stats: { rxBytes: number, txBytes: number, rxMessages: number, txMessages: number }
  cSkt: net.Socket | null = null
  inChunks: Buffer[] = []
  sendBuffer = Buffer.allocUnsafe(1024)
  debugLogging: any = false
  constructor (cli: object) {
    super()
    const cp = cli['controlPort']
    this.port = cp
    this.stats = {
      rxBytes: 0,
      txBytes: 0,
      rxMessages: 0,
      txMessages: 0,
    }
  }

  start () {
    if (!this.port) {
      console.log('NB: port is not set - link is not used')
      return
    }
    this.cSkt = net.createConnection(this.port, ip, () => {
      this.emit('connected')
    })
    this.cSkt.setNoDelay(true)
    this.cSkt.on('data', (data) => {
      this.feedRxQueue(data)
    })
    this.cSkt.on('close', (hadErr) => {
      console.log('closed, err=' + hadErr)
      this.emit('disconnected')
    })
    this.cSkt.on('error', (hadErr) => {
      console.log('error, err=' + hadErr)
    })
  }

  feedRxQueue (chunk: Buffer) {
    const len = chunk.length
    this.stats.rxBytes += len
    for (let i = 0; i < len; i++) {
      const ei = chunk.indexOf(etx, i, 'binary')
      if (ei === -1) {
      // partial message trailing data from i to end...
        this.inChunks.push(chunk.slice(i))
        break
      }
      // create message from buffers and slices so far...
      this.inChunks.push(chunk.slice(i, ei))
      const msg = Buffer.concat(this.inChunks)
      this.inChunks = []
      this.stats.rxMessages += 1
      this.processMessage(this.deSubstitute(msg))
      i = ei
    }
  }

  sendMsg (msg: any) {
  // encode buffer, split into chunks and send chunks
    if (!this.cSkt || this.cSkt.destroyed) {
      console.log('sendMsg no socket!')
      return
    }
    let encLen = 0
    if (typeof msg === 'string' || msg instanceof String) {
      encLen = this.encodeMsgBuf(Buffer.from(msg))
    } else {
      encLen = this.encodeMsgBuf(msg)
    }
    this.stats.txBytes += encLen
    this.stats.txMessages += 1
    const cb = () => { if (this.debugLogging) { console.log('sendMsg done') } }
    this.cSkt.write(this.sendBuffer.slice(0, encLen), cb)
  }

  // encode message bytes into sendBuffer performing substitute and message termination
  // msg = buffer slice
  encodeMsgBuf (msg: Buffer): number {
    const maxLen = (msg.length * 2 + 2)
    if (this.sendBuffer.length < maxLen) {
      console.warn(`resize encoding buffer to ${maxLen}`)
      this.sendBuffer = Buffer.allocUnsafe(maxLen)
    }
    let len = this.substitute(msg, msg.length, this.sendBuffer, this.sendBuffer.length)
    this.sendBuffer[len++] = etx
    return len
  }

  // In the protocol, etx => esc,sub esc => esc,esc
  deSubstitute (buf) {
    // the message can not get bigger!
    const len = buf.length
    let j = 0
    for (let i = 0; i < len; i++, j++) {
      let b = buf[i]
      // substitute an escape sequence
      if (b === esc) {
      // get next byte if possible
        if (i + 1 >= len) {
          console.warn('last byte of message seems to be an escape!')
          return
        }
        i++
        const c = buf[i]
        if (c === esc) {
        // esc,esc => esc
          b = esc
        } else if (c === sub) {
        // esc,sub => etx
          b = etx
        } else {
        // erroneous but whatevs
          console.warn(`erroneous escape seq esc-${c} at index ${i}`)
          b = c
        }
      }
      buf[j] = b
    }
    return buf.slice(0, j)
  }

  // In the protocol, etx => esc,sub esc => esc,esc
  substitute (inBuf, len, outBuf, outBufLen) {
  //
    let j = 0
    for (let i = 0; i < len; i++, j++) {
      const c = inBuf[i]
      if (c === etx) {
        outBuf[j++] = esc
        outBuf[j] = sub
      } else if (c === esc) {
        outBuf[j++] = esc
        outBuf[j] = esc
      } else {
        outBuf[j] = c
      }
    }
    return j
  }

  // Message types and content can be defined here in the class.
  // Actual handlers for extracted data should be outside.
  processMessage (msg) {
    try {
      // The first few bytes of a message should be ASCII that indicate what follows...
      const inf = msg.slice(0, 40).toString()
      this.emit('rx', msg, inf)
    } catch (error) {
      console.error('caught an error during rx handler: ' + error?.toString?.())
    }
  }
}

export { MessageCodecProtocol as SceneLink }
