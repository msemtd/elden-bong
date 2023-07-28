const schema = {
  foo: {
    type: 'number',
    maximum: 100,
    minimum: 1,
    default: 50
  },
  maps: {
    type: 'string',
    format: 'uri',
    default: 'mine://unknown'
  },
  tools: {
    magick: {
      type: 'string',
    },
    blender: {
      type: 'string',
    },
  },
}

export { schema }
