/*
 * 2D arrays of text with string serialised equivalents.
 * All pure functions.
 * (I seem to do a lot of this!)
 */

export function newEmptyRack (w, h) {
  return Array.from(Array(h), () => new Array(w).fill('-'))
}

/**
 * pure function to create 2D array of random text digits
 * @param {number} w width
 * @param {number} h height
 * @param {number} n number of different digits (0 to n-1)
 * @returns {string[][]} 2D array of text digits
 */
export function createRack (w, h, n, randYoFunc = Math.random) {
  const r = newEmptyRack(w, h)
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const rnd = Math.floor(randYoFunc() * n)
      r[row][col] = `${rnd}`
    }
  }
  return r
}

export function rackToString (r) {
  return r.flat(Infinity).join('')
}

export function stringToRack (sIn, w, h) {
  // Accept any whitespace - just remove it with a regex...
  const s = sIn.replaceAll(/\s/gm, '')
  // NB: this makes the function non-reversible! If you want to use it in a
  // reversible manner then remove the whitespace before use.
  if (s.length !== w * h) {
    throw new Error('stringToRack: string length does not match dimensions')
  }
  const r = newEmptyRack(w, h)
  let i = 0
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      r[row][col] = s[i]
      i++
    }
  }
  return r
}

export function getColumnString (col, h, rack) {
  const ca = []
  for (let row = 0; row < h; row++) {
    ca.push(rack[row][col])
  }
  return ca.join('')
}

export function getRowString (row, w, rack) {
  const ra = []
  for (let col = 0; col < w; col++) {
    ra.push(rack[row][col])
  }
  return ra.join('')
}
