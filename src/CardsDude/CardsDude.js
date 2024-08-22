import * as THREE from 'three'

/**
 * Cards Dude mini-game
 *
 * My original game seems to be lost! Recreating it from scratch.
 *
 * Card games database - using the terminology and human readable data from xmsol (https://github.com/plastovicka/xmsol)
 *
 * Card images and models - https://discourse.threejs.org/t/plane-mesh-with-rounded-corners-that-can-have-an-image-texture/46892
 * size and shape of real cards
 * bicycle brand playing cards - https://en.wikipedia.org/wiki/Bicycle_Playing_Cards
 * - poker size (3.5 by 2.5 inches [8.9 cm × 6.4 cm]), bridge size (3.5 by 2.25 inches [8.9 cm × 5.7 cm])
 *
 * - Standard playing card size: 2.5in x 3.5in
 * - Required bleed: 2mm along each edge
 * - Recommended margin: 5mm
 * - Rounded corner size: 3.5mm
 *
 *
 * layout spacing as per user preferences
 * the card table is the group
 * the entire group can be scaled in the parent game
 *
 * Shuffles - we want a simple seeded PRNG to create reusable shuffles from a shuffle number
 * Seeding a PRNG in JS https://github.com/davidbau/seedrandom
 * fisher-yates
 */
const games = {
  // use the terminology from xmsol
  bigSpider: {
    solType: 'spider',
    rules:
        `
        Big Spider
        Decks: 3

        4x  foundation
        The first card rank:  K
        Sequence rank:  descending continual
        Sequence suit:  same
        Moving group of cards:  all 13 cards

        13x  tableau
        Sequence rank:  descending
        Moving group of cards:  yes
        - Outgoing rules
        Sequence suit:  same

        1x  stock
        Deal: 13
        `
  }
}

const cardDims = `
| Type of Playing Card | Size (width x Height) | Required Bleed | Recommended Margin | Rounded Corner Size |
|----------------------|-----------------------|----------------|--------------------|---------------------|
| Standard (Poker)     | 2.5in x 3.5in         | 2mm            | 5mm                | 3.5mm               |
| Bridge (Slim)        | 2.25in x 3.5in        | 2mm            | 5mm                | 3.5mm               |
| Tarot                | 2.75in x 4.75in       | 2mm            | 5mm                | 6mm                 |
| Large                | 3.5in x 5.75in        | 2mm            | 5mm                | 6mm                 |
| MTG (Magic Gathering)| 2.5in x 3.5in         | 2mm            | 5mm                | 3.5mm               |
`
/**
 * markdown table to 2D array - a bit of fun text processing
 */
function tabToList (tab) {
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

class CardsDude {
  constructor (game = games.bigSpider) {
    console.dir(game)
    const ca = tabToList(cardDims)
    console.dir(ca)
  }
}

export { CardsDude }
