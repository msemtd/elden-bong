import debug from 'debug'
import fs from 'fs-extra'

const dbg = debug('main')

class E57 {
  static async readE57 (fp) {
    dbg(`main thread async load e57 file from '${fp}'...`)
    console.log(`main thread async load e57 file from '${fp}'...`)
    try {
      const fh = await fs.open(fp, 'r')
      dbg('file opened OK')
      console.log('file opened OK')
      // test scan of file for e57 validation
      // header of 48 bytes
      const length = 48
      const offset = 0
      const buf = Buffer.alloc(length)
      const { bytesRead } = await fs.read(fh, buf, offset, length, 0)
      if (bytesRead !== length) throw Error('could not read header')
      console.log(`file block read OK: ${bytesRead}`)
      //   struct E57FileHeader {
      //     char        fileSignature[8];
      //     uint32_t    majorVersion;
      //     uint32_t    minorVersion;
      //     uint64_t    filePhysicalLength;
      //     uint64_t    xmlPhysicalOffset;
      //     uint64_t    xmlLogicalLength;
      //     uint64_t    pageSize;
      // }
      const fileSignature = buf.toString('utf8', 0, 8)
      console.log(`fileSignature='${fileSignature}'`)
      const majorVersion = buf.readUInt32LE(8)
      const minorVersion = buf.readUInt32LE(12)
      console.log(`majorVersion,minorVersion=${majorVersion},${minorVersion}`)
      const filePhysicalLength = buf.readBigInt64LE(16)
      console.log(`filePhysicalLength=${filePhysicalLength}`)
      const xmlPhysicalOffset = buf.readBigInt64LE(24)
      console.log(`xmlPhysicalOffset=${xmlPhysicalOffset}`)
      const xmlLogicalLength = buf.readBigInt64LE(32)
      console.log(`xmlLogicalLength=${xmlLogicalLength}`)
      const pageSize = buf.readBigInt64LE(40)
      console.log(`pageSize=${pageSize}`)
    } catch (error) {
      console.error(error)
      return `not too happy with the outcome: ${error}`
    }

    return 'gimme-a-minute'
  }
}

export { E57 }
