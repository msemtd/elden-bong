import debug from 'debug'
import fs from 'fs-extra'

const dbg = debug('main')

// 6. General File Structure
// 6.1 E57 files shall use the filename extension “.e57” (note
// lowercase e).
// 6.2 This specification defines a binary file format composed
// of a sequence of pages.
// 6.2.1 Each page shall be composed of 1020 bytes of data
// (known as the payload) followed by a 32-bit cyclic redundancy
// check (CRC) checksum computed on the preceding payload.
// 6.2.2 The length of an E57 file shall be an integral multiple
// of 1024 bytes. Any unused bytes in the payload of the final
// page in a file shall be filled with 0 values.
// 6.2.3 The CRC checksum shall be computed on the 1020
// bytes of data using the iSCSI polynomial CRC32C (CRC
// 32-bit Castagnioli) as documented in IETF RFC 3720, Section
// 12.1 (http://tools.ietf.org/html/rfc3720).
// 6.2.4 Discussion—Sequences of data without the CRC
// checksum bytes are known as logical sequences, while sequences
// of data with the CRC checksum bytes included are
// known as physical sequences. All sequences of characters (in
// XML section) or bytes (in binary sections) described in this
// standard are logical sequences. The physical sequence representation
// of a logical sequence may have an intervening
// checksum if the logical sequence crosses a page boundary.
// Page boundaries occur every 1020 bytes of logical data.
// 6.3 An E57 file shall be composed of two or more sections
// in the following order:
// 6.3.1 File header section (required, see Section 7),
// 6.3.2 Binary sections (optional, see Section 9), and
// 6.3.3 XML section (required, see Section 8).
// 6.4 Binary portions (including the header and binary sections) of
// an E57 file are encoded using the little-endian byte order.

class E57 {
  static async readE57 (fp) {
    dbg(`main thread async load e57 file from '${fp}'...`)
    console.log(`main thread async load e57 file from '${fp}'...`)
    try {
      const stats = await fs.stat(fp, { bigint: true })
      console.dir(stats)
      if (stats.size > Number.MAX_SAFE_INTEGER) {
        throw Error(`vast file size not supported: ${stats.size}`)
      }
      // make a checking pass through entire file
      await E57.checkingPass(fp, Number(stats.size))
      const fh = await fs.open(fp, 'r')
      dbg('file opened OK')
      console.log('file opened OK')
      const h = await E57.readHeader(fh)
      console.dir(h)
      const xml = await E57.readXmlSection(fh, h.xmlPhysicalOffset, h.xmlLogicalLength)
      console.log(`XML of length ${xml.length}`)
      const lines = xml.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        console.log(line)
      }
    } catch (error) {
      console.error(error)
      return `not too happy with the outcome: ${error}`
    }

    return 'gimme-a-minute'
  }

  static async checkingPass (fp, size) {
    const fh = await fs.open(fp, 'r')
    const ps = 1024
    const np = size / ps
    console.log(np)
    const pc = Math.ceil(np)
    if (pc !== np) {
      console.warn(`page count is not whole ${np} !== ${pc}`)
    }
    console.log(`reading ${pc} pages`)
    const buf = Buffer.alloc(ps)
    const t1 = Date.now()
    for (let index = 0; index < pc; index++) {
      const pos = index * ps
      const { bytesRead } = await fs.read(fh, buf, 0, ps, pos)
      if (bytesRead !== ps) {
        console.warn(`page ${index} bytesRead: ${bytesRead} <> ${ps}`)
      }
    }
    const t2 = Date.now()
    const ms = t2 - t1
    console.log(`seconds elapsed = ${Math.floor(ms / 1000)}`)
  }

  static async readHeader (fh) {
    const offset = 0
    const length = 48
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
    // Validation...
    if (fileSignature !== 'ASTM-E57') throw Error('fileSignature must be \'ASTM-E57\'')
    // eslint-disable-next-line eqeqeq
    if (pageSize != 1024) throw Error('header page size must be 1024')
    return { fileSignature, majorVersion, minorVersion, filePhysicalLength, xmlPhysicalOffset, xmlLogicalLength, pageSize }
  }

  static async readXmlSection (fh, xmlPhysicalOffset, xmlLogicalLength) {
    console.log(`readXmlSection: xmlPhysicalOffset ${xmlPhysicalOffset}, xmlLogicalLength ${xmlLogicalLength}`)
    // XML section offset - we will only deal with "reasonable" file lengths...
    if (xmlPhysicalOffset >= Number.MAX_SAFE_INTEGER) {
      throw Error('big file offset not yet supported here')
    }
    // If our section was beyond file position was beyond MAX_SAFE_INTEGER
    // (9,007,199,254,740,991) then we would be dealing with a file bigger than
    // 9000 terabytes. That is undeniably unreasonable!
    const offset = Number(xmlPhysicalOffset)
    // attempt to slurp enough physical pages that would contain the logical size
    if (xmlLogicalLength >= Number.MAX_SAFE_INTEGER) {
      throw Error('massive logical section length is not supported here')
    }
    const logicalBytes = Number(xmlLogicalLength)

    const pageStart = offset & ~(1024 - 1)
    console.log(`offset is ${offset} and page starts at ${pageStart}`)
    // read page by page and append content to big XML buffer...
    const page = Buffer.alloc(1024)
    const xBuf = Buffer.alloc(logicalBytes)
    // Here the number of physical pages could be over by one - just make that ok later
    const physicalPages = Math.ceil(logicalBytes / 1020) + 1
    let totalBytesRead = 0
    let xPos = 0
    for (let b = 0; b < physicalPages; b++) {
      const pPos = pageStart + (b * 1024)
      console.log(` - reading page ${b} from page offset at ${pPos}...`)
      const { bytesRead } = await fs.read(fh, page, 0, 1024, pPos)
      totalBytesRead += bytesRead
      console.log(`   +got ${bytesRead} bytes`)
      const crcGiven = page.readUint32LE(1020)
      console.log(`   +crc ${crcGiven}`)
      // TODO calc and compare CRC32C, see https://github.com/SheetJS/js-crc32
      // what byte range of the page do we need to copy?
      let p1 = 0
      let len = 1020
      // first page may start before data...
      if (b === 0 && pPos < offset) {
        const c = offset - pPos
        p1 = c
        len = 1020 - c
        console.log(`first page read from ${p1} for ${len} bytes`)
      }
      // TODO last page? well, I'll sort that out later!
      if (xPos + 1020 > logicalBytes) {
        console.log(`last page read from ${p1} for ${len} bytes`)
      }
      // padded blocks? Only padding to 4 byte boundary?
      // copy block bytes into big buffer
      const ncb = page.copy(xBuf, xPos, p1, len)
      xPos += ncb
      if (xPos >= logicalBytes) {
        console.warn(`I think we are finished at xPos ${xPos}`)
      }
      // TODO temp dump of first page bytes to string and try to work out why CRC appears in wrong place!
      if (b < 2) {
        const tempXml = xBuf.toString('utf8', 0, xPos)
        console.warn(tempXml)
      }
    }
    console.log(`Total: ${totalBytesRead} bytes in the pages`)
    const xml = xBuf.toString('utf8', 0, logicalBytes)
    return xml
  }
}

export { E57 }
