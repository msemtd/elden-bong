import yaml from 'js-yaml'

// Provides some default settings to be updated from yaml in local storage.

const defaultSettings = {
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
      rotateX: Math.PI / 2.0,
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
  autoRunMiniGame: '',
  dataDir: '',
}

function loadSettings (localStorageKey, defaults) {
  let settings = structuredClone(defaults)
  const sy = localStorage.getItem(localStorageKey)
  if (!sy) { return saveTheseSettings(localStorageKey, defaults) }
  try {
    const incomingSettings = yaml.load(sy)
    settings = { ...settings, ...incomingSettings }
  } catch (error) {
    console.error(`failed to load settings key as YAML: ${error}`)
    return saveTheseSettings(localStorageKey, defaults)
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

export { defaultSettings, loadSettings, saveTheseSettings, distributeSettings }
