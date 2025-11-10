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
export function createRack (w, h, n) {
  const r = newEmptyRack(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const rnd = Math.floor(Math.random() * n)
      r[y][x] = `${rnd}`
    }
  }
  return r
}

export function rackToString (r) {
  return r.flat(Infinity).join('')
}

export function stringToRack (s, w, h) {
  if (s.length !== w * h) {
    throw new Error('stringToRack: string length does not match dimensions')
  }
  const r = newEmptyRack(w, h)
  let i = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      r[y][x] = s[i]
      i++
    }
  }
  return r
}

export function getColumnString (x, h, rack) {
  const col = []
  for (let y = 0; y < h; y++) {
    col.push(rack[y][x])
  }
  return col
}

export function getRowString (y, w, rack) {
  const col = []
  for (let x = 0; x < w; x++) {
    col.push(rack[y][x])
  }
  return col
}
