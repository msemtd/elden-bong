// Starting with an example config we can run it through a tool such as...
// https://json-schema-inferrer.herokuapp.com/
// to infer a schema.

const exampleConfig = {
  tools: {
    magick: 'C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick',
    sliceCommand: '{{BIG_MAP_FILE}} -verbose -crop {{TILE_SIZE}}x{{TILE_SIZE}} {{PREFIX}}%d.png',
    blender: 'whatever',
  },
  scene: {
    fog: {
      enabled: true,
    },
    grid: {
      visible: true,
      size: 100,
      divisions: 100,
    },
    axes: {
      visible: true,
    },
    demoCube: {
      rotating: true,
      visible: true,
    },
  },
  maps: [
    {
      name: 'Overground',
      sizeX: 38,
      sizeY: 36,
      prefix: 'map-00-overworld-tile256-',
      postfix: '.png',
      dir: 'c:/dev/maps/whatever',
    },
    {
      name: 'Underworld',
      sizeX: 38,
      sizeY: 36,
      prefix: 'map-01-underworld-tile256-',
      postfix: '.png',
      dir: 'c:/dev/maps/whatever',
    }
  ]
}

const schema = {
  $schema: 'https://json-schema.org/draft/2019-09/schema',
  $id: 'http://example.com/example.json',
  type: 'object',
  default: {},
  title: 'Root Schema',
  required: [
    'tools',
    'scene',
    'maps'
  ],
  properties: {
    tools: {
      type: 'object',
      default: {},
      title: 'The tools Schema',
      required: [
        'magick',
        'blender'
      ],
      properties: {
        magick: {
          type: 'string',
          default: '',
          title: 'The magick Schema',
          examples: [
            'c:/tools/magick'
          ]
        },
        blender: {
          type: 'string',
          default: '',
          title: 'The blender Schema',
          examples: [
            'whatever'
          ]
        }
      },
      examples: [{
        magick: 'c:/tools/magick',
        blender: 'whatever'
      }]
    },
    scene: {
      type: 'object',
      default: {},
      title: 'The scene Schema',
      required: [
        'fog',
        'grid',
        'axes',
        'demoCube'
      ],
      properties: {
        fog: {
          type: 'object',
          default: {},
          title: 'The fog Schema',
          required: [
            'enabled'
          ],
          properties: {
            enabled: {
              type: 'boolean',
              default: false,
              title: 'The enabled Schema',
              examples: [
                true
              ]
            }
          },
          examples: [{
            enabled: true
          }]
        },
        grid: {
          type: 'object',
          default: {},
          title: 'The grid Schema',
          required: [
            'visible',
            'size',
            'divisions'
          ],
          properties: {
            visible: {
              type: 'boolean',
              default: false,
              title: 'The visible Schema',
              examples: [
                true
              ]
            },
            size: {
              type: 'integer',
              default: 0,
              title: 'The size Schema',
              examples: [
                100
              ]
            },
            divisions: {
              type: 'integer',
              default: 0,
              title: 'The divisions Schema',
              examples: [
                100
              ]
            }
          },
          examples: [{
            visible: true,
            size: 100,
            divisions: 100
          }]
        },
        axes: {
          type: 'object',
          default: {},
          title: 'The axes Schema',
          required: [
            'visible'
          ],
          properties: {
            visible: {
              type: 'boolean',
              default: false,
              title: 'The visible Schema',
              examples: [
                true
              ]
            }
          },
          examples: [{
            visible: true
          }]
        },
        demoCube: {
          type: 'object',
          default: {},
          title: 'The demoCube Schema',
          required: [
            'rotating',
            'visible'
          ],
          properties: {
            rotating: {
              type: 'boolean',
              default: false,
              title: 'The rotating Schema',
              examples: [
                true
              ]
            },
            visible: {
              type: 'boolean',
              default: false,
              title: 'The visible Schema',
              examples: [
                true
              ]
            }
          },
          examples: [{
            rotating: true,
            visible: true
          }]
        }
      },
      examples: [{
        fog: {
          enabled: true
        },
        grid: {
          visible: true,
          size: 100,
          divisions: 100
        },
        axes: {
          visible: true
        },
        demoCube: {
          rotating: true,
          visible: true
        }
      }]
    },
    maps: {
      type: 'array',
      default: [],
      title: 'The maps Schema',
      items: {
        type: 'object',
        title: 'A Schema',
        required: [
          'name',
          'sizeX',
          'sizeY',
          'prefix',
          'postfix',
          'dir'
        ],
        properties: {
          name: {
            type: 'string',
            title: 'The name Schema',
            examples: [
              'Overground',
              'Underworld'
            ]
          },
          sizeX: {
            type: 'integer',
            title: 'The sizeX Schema',
            examples: [
              38
            ]
          },
          sizeY: {
            type: 'integer',
            title: 'The sizeY Schema',
            examples: [
              36
            ]
          },
          prefix: {
            type: 'string',
            title: 'The prefix Schema',
            examples: [
              'map-00-overworld-tile256-',
              'map-01-underworld-tile256-'
            ]
          },
          postfix: {
            type: 'string',
            title: 'The postfix Schema',
            examples: [
              '.png'
            ]
          },
          dir: {
            type: 'string',
            title: 'The dir Schema',
            examples: [
              'c:/dev/maps/whatever'
            ]
          }
        },
        examples: [{
          name: 'Overground',
          sizeX: 38,
          sizeY: 36,
          prefix: 'map-00-overworld-tile256-',
          postfix: '.png',
          dir: 'c:/dev/maps/whatever'
        },
        {
          name: 'Underworld',
          sizeX: 38,
          sizeY: 36,
          prefix: 'map-01-underworld-tile256-',
          postfix: '.png',
          dir: 'c:/dev/maps/whatever'
        }]
      },
      examples: [
        [{
          name: 'Overground',
          sizeX: 38,
          sizeY: 36,
          prefix: 'map-00-overworld-tile256-',
          postfix: '.png',
          dir: 'c:/dev/maps/whatever'
        },
        {
          name: 'Underworld',
          sizeX: 38,
          sizeY: 36,
          prefix: 'map-01-underworld-tile256-',
          postfix: '.png',
          dir: 'c:/dev/maps/whatever'
        }]
      ]
    }
  },
  examples: [{
    tools: {
      magick: 'c:/tools/magick',
      blender: 'whatever'
    },
    scene: {
      fog: {
        enabled: true
      },
      grid: {
        visible: true,
        size: 100,
        divisions: 100
      },
      axes: {
        visible: true
      },
      demoCube: {
        rotating: true,
        visible: true
      }
    },
    maps: [{
      name: 'Overground',
      sizeX: 38,
      sizeY: 36,
      prefix: 'map-00-overworld-tile256-',
      postfix: '.png',
      dir: 'c:/dev/maps/whatever'
    },
    {
      name: 'Underworld',
      sizeX: 38,
      sizeY: 36,
      prefix: 'map-01-underworld-tile256-',
      postfix: '.png',
      dir: 'c:/dev/maps/whatever'
    }]
  }]
}

export { schema, exampleConfig }
