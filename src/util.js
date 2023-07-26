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
