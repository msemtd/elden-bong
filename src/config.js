import yaml from 'js-yaml'

// Starting with an example config we can run it through a tool such as...
// https://json-schema-inferrer.herokuapp.com/
// to infer a schema.

// I tried using the schema with electron-store but it wasn't as much fun as I
// expected so I think all I'm providing here is an example configuration for
// persistence.

// In the Electron context, it seems easier to just use local-storage from
// the browser and then tell the main thread of any changes using preload

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
    background: {
      colour: '#000000',
      x11Colour: 'black',
      skyBox: '...none',
      skyBoxList: ['...none'],
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
    },
    onScreen: {
      showTitleText: true,
      showControllerSvg: true,
      showCameraPosition: true,
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
  ],
  autoLoadMap: '',
  /* game state load and save */
  gameState: {
    region: 0,
    lastSafePosition: [0, 0, 0],
    cameraPosition: [1, -12, 1.7],
  },
}

// TODO: The schema is a great idea but I can't work with it easily so I don't!
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

function loadSettings (localStorageKey, defaultSettings) {
  let settings = structuredClone(defaultSettings)
  const sy = localStorage.getItem(localStorageKey)
  if (!sy) { return saveTheseSettings(localStorageKey, defaultSettings) }
  try {
    const incomingSettings = yaml.load(sy)
    settings = { ...settings, ...incomingSettings }
  } catch (error) {
    console.error(`failed to load settings key as YAML: ${error}`)
    return saveTheseSettings(localStorageKey, defaultSettings)
  }
  return settings
}

function saveTheseSettings (localStorageKey, settings) {
  localStorage.setItem(localStorageKey, yaml.dump(settings))
  return structuredClone(settings)
}

// Send settings to components and have them validated.
// Quite especially, in the Electron context, pass settings to main process
// (which may cause other async events)
// This expects preload to have made some things available on the window object.
// See passSettingsToMain in preload.js and settingsFromRenderer in main.js
function distributeSettings (settings) {
  window?.settings?.passSettingsToMain?.(settings)
}

export { schema, exampleConfig, loadSettings, saveTheseSettings, distributeSettings }
