/**
 * Card games database - using the terminology and human readable data from xmsol
 * (https://github.com/plastovicka/xmsol)
 *
 */
export const games = {
  // TODO: make a game class - let's formalise this!
  // Use the terminology and rules from xmsol
  // Try to interpret correctly!
  bigSpider: {
    solType: 'spider',
    rules: // from xmsol info dialog
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
        `,
    // from xmsol source...
    xmsolRule: `
        <game name="Big Spider" decks="3">
        <foundation repeat="4" x="500">k down all cont</foundation>
        <tableau y="250" repeat="13" count="78" hide="-1">group<out>suit</out></tableau>
        <stock deal="13"/>
        </game>
        `,
    // converted to YAML...
    xmsolYaml: `---
game:
  "-name": Big Spider
  "-decks": 3
  foundation:
    "-repeat": 4
    "-x": 500
    "#text": k down all cont
  tableau:
    "-y": 250
    "-repeat": 13
    "-count": 78
    "-hide": -1
    "#text": group
  stock:
    "-deal": 13
`,
    // as actual properties...
    name: 'Big Spider',
    decks: 3,
    foundation: {
      repeat: 4,
      x: 500,
      text: 'k down all cont',
    },
    tableau: {
      y: 250,
      repeat: 13,
      count: 78,
      hide: -1,
      text: 'group',
    },
    stock: {
      deal: 13,
    },
  }
}

class MoveNode {
  constructor () {
    // each move has a set of next options
    // some may not have been traversed/discovered
    // when we undo we can discard or keep the old tree
    this.moves = []
    // there's the move and that produces a result - do we save a state?
    // is this just Redux?
  }

}

export class SpiderAutomation {
  constructor () {
    this.situation = 'plan'
    this.moveTree = {
      // from initial state a node is made
      rootNode: new MoveNode()
    }


  }

  // strategy for deciding the next move
  // - what do we want?
  // look at the cards just newly dealt
  // find all possible moves and add a new MoveNode to the current node's moves array
  // rank moves array based on priorities
  // priority to competing a full suit King to Ace and removing it
  // priority to matching suit
  // priority to reducing tableau size - especially chasing an empty slot
  // priority to the left
  // when multiple options
  // when no options to progress
  //
  // Would be awesome to visualise the move tree!
  // would be awesome to be able to go to anywhere in the move tree
  // is this just setting state?
  // probably - this state also has access to the move tree below it

  // OK, let's get all the move options and rank them according to the strategy
  // object. The strategy object is just an ordered list of match-able move
  // types surely? These can have human readable names like
  // - "Prefer move from smaller stack" (a->origin-stack-height < b->origin-stack-height)
  // - "Prefer higher rank move" (a->rank > b->rank)
  // - "Prefer same suit move" (a->suit == b->suit)
  // and we need little sort functions to compare two optional situations
  // We can have as many strategies as we like to make the decisions. Each branch point created can be revisited
}
