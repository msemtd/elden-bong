// "Wah, wah, JS isn't strongly typed so I can't even!"
// If it matters then check your assumptions.
// Simple little functions used for assert, etc.

// Accepted as GOOD ENOUGH(th)

// These might be a BAD THING(tm) if they stop you from knowing what they do.

// Be aware that typeof(new String()) is 'object' (but why would you do that to yourself?)
export const isString = s => typeof s === 'string'

// Be aware that typeof(null) is 'object' - just deal with it
export const isObject = o => typeof o === 'object'

export const isInteger = n => Number.isInteger(n)
