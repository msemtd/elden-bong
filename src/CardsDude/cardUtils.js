
// https://en.wikipedia.org/wiki/Standard_52-card_deck
// A standard 52-card deck comprises 13 ranks in each of the four French suits:
// clubs (♣), diamonds (♦), hearts (♥) and spades (♠), with reversible (double-headed)
// court cards (face cards). Each suit includes an Ace, a King, Queen and Jack,
// each depicted alongside a symbol of its suit; and numerals or pip cards from
// the Deuce (Two) to the Ten, with each card depicting that many symbols (pips)
// of its suit.
// https://commons.wikimedia.org/wiki/Category:OpenClipart_simple_playing_cards

const theFrenchSuits = 'CLUBS ♣ black, DIAMONDS ♦ red, HEARTS ♥ red, SPADES ♠ black'
const theRanks = 'ACE A, TWO 2, THREE 3, FOUR 4, FIVE 5, SIX 6, SEVEN 7, EIGHT 8, NINE 9, TEN 10, JACK J, QUEEN Q, KING K'
const suitInfo = theFrenchSuits.split(', ').map(x => { return x.split(' ') })
const rankInfo = theRanks.split(', ').map(x => { return x.split(' ') })
const aDeck = deck()
const suitClrs = mkSuitClrs(suitInfo)

function deck (long) {
  const d = []
  for (let i = 0; i < suitInfo.length; i++) {
    for (let j = 0; j < rankInfo.length; j++) {
      d.push(long ? `${rankInfo[j][0]} OF ${suitInfo[i][0]}` : `${rankInfo[j][1]}${suitInfo[i][1]}`)
    }
  }
  return d
}

function getDecks (n) {
  let aa = []
  for (let i = 0; i < n; i++) {
    aa = aa.concat(aDeck)
  }
  return aa
}

function mkSuitClrs (aa) {
  const o = {}
  for (let i = 0; i < aa.length; i++) {
    const a = aa[i]
    o[a[1]] = a[2]
  }
  return o
}

// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
// https://bost.ocks.org/mike/shuffle/
function shuffle (array) {
  let m = array.length; let t; let i
  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--)
    // And swap it with the current element.
    t = array[m]
    array[m] = array[i]
    array[i] = t
  }
  return array
}

export { getDecks, shuffle, suitClrs }
