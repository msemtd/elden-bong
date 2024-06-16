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

class CardsDude {
  constructor (game = games.bigSpider) {
    console.dir(game)
  }
}

export { CardsDude }
