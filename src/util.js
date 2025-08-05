export function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomColour () {
  const h = randomInt(0, 360)
  const s = randomInt(42, 98)
  const l = randomInt(40, 90)
  return `hsl(${h},${s}%,${l}%)`
}

// JavaScript version of: (unsigned)
// printf "%0*d" width num
export function leftFillNum (num, targetLength) {
  return num.toString().padStart(targetLength, '0')
}

export function rxBetween (prefix, suffix) {
  return new RegExp('^(?:' + prefix + ')(.*)(?:' + suffix + ')$')
}

export function xyToIndex (x, y, tilesX, tilesY) {
  return ((tilesY - y - 1) * tilesX) + x
}

export function xyFmt (x, y, pad) {
  return `x${leftFillNum(x, pad)}-y${leftFillNum(y, pad)}`
}

export function tileFile (name, tileSize, x, y, pad, ext) {
  return `${name}-tile-${tileSize}-${xyFmt(x, y, pad)}${ext}`
}

// how many digits of padding to accommodate these numbers as strings?
export function getPad (tilesX, tilesY) {
  return Math.max(tilesX, tilesY).toString(10).length
}

// parse the output of magick identify -format '%m %B %w x %h'
// e.g. PNG 180816734 9728 x 9216
export function identifyDataParse (identifyData) {
  const rx = /^([A-Za-z0-9]+)\s([0-9]+)\s([0-9]+)\sx\s([0-9]+)$/
  const bits = identifyData.match(rx)
  if (!bits) {
    throw Error('bad info format')
  }
  return {
    imgType: bits[1],
    bytes: Number(bits[2]),
    width: Number(bits[3]),
    height: Number(bits[4]),
  }
}

// the file paths need to look like "mine" protocol to get through the
// electron net module via the various THREE loaders
// these will be munged back into file paths in the main process
export function filePathToMine (filePath) {
  return `mine://${filePath.replaceAll('\\', '/')}`
}

export function mineToFilePath (minePath) {
  let p = minePath.slice('mine://'.length)
  // for some reason the drive colon is lost in the URL mangling of THREE
  // loaders and the net module doesn't understand the remains
  // We try to re-insert that here...
  if (p[1] === '/') {
    p = p[0] + ':' + p.slice(1)
  }
  return `file://${p}`
}

/**
 * markdown table to 2D array - a bit of fun text processing
 */
export function tabToList (tab) {
  const lines = tab.split('\n').map(x => x.trim()).filter(x => x.length).map(x => x.split('|'))
  // Trim edges if appropriate to do so - check the header (the first line)...
  const regularHeader = lines.length && lines[0].length >= 2 && lines[0][0] === '' && lines[0][lines[0].length - 1] === ''
  if (regularHeader) {
    // Some fun with Array.reduce...
    // Check that all lines are the same length (i.e. same length as the first line)...
    const allSameLength = lines.reduce((acc, line) => acc && line.length === lines[0].length, true)
    console.log(`all same length: ${allSameLength}`)
    // Check that all lines have the first and last elements empty
    const allHaveEmptyFirstAndLast = lines.reduce((acc, line) => acc && line.length && line[0] === '' && line[line.length - 1] === '', true)
    console.log(`allHaveEmptyFirstAndLast: ${allHaveEmptyFirstAndLast}`)
    if (allSameLength && allHaveEmptyFirstAndLast) {
      for (const line of lines) {
        // empty front and back columns
        line.shift()
        line.pop()
        // can finally trim the field contents
        for (let fi = 0; fi < line.length; fi++) {
          line[fi] = line[fi].trim()
        }
      }
    }
    // remove the line after the header if it is all dashes...
    if (lines.length >= 2 && Array.isArray(lines[1])) {
      const ruler = lines[1].join('')
      if (ruler.match(/^[-]+$/)) { lines.splice(1, 1) }
    }
  }
  return lines
}

export function isInputEvent (event) {
  const target = event?.target
  if (!target) return
  return (target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable)
}

export async function delayMs (durationMs) {
  return await new Promise(resolve => setTimeout(resolve, durationMs))
}
