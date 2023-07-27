import * as THREE from 'three'
import { CanvasThree } from './CanvasThree'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { MapMan, WorldMap } from './WorldMap'

class Bong {
  constructor (appDiv) {
    this.canvas = new CanvasThree(appDiv)
    const c = this.canvas
    this.PROPS = {
      rotating: true,
      addMapTiles: () => { this.mapMan.loadMap(c.scene) },
      resetCamera: () => { c.cameraControls.reset() },
      pickFile: async () => {
        // just a test...
        const res = await window.bong.pickFile()
        console.dir(res)
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
      }
    }
    this.gui = new GUI({ width: 310 })
    this.mapMan = new MapMan()
    this.fog = new THREE.Fog(0x444444, 10, 200)
    c.scene.fog = this.fog
    addGrid(c.scene)
    {
      const axesHelper = new THREE.AxesHelper(5)
      axesHelper.name = 'axesHelper'
      c.scene.add(axesHelper)
    }
    this.addStats(c)
    this.addCamInfo(c)
    this.addDemoCube(c)
    this.makeGui()
  }

  addStats (c) {
    const stats = new Stats()
    c.container.appendChild(stats.dom)
    stats.domElement.style.cssText = 'position:absolute;top:40px;left:10px;'
    c.addMixer('stats', (_delta) => {
      stats.update()
      return false
    })
  }

  addCamInfo (c) {
    const camInfo = document.getElementById('camInfo')
    const dp = 2
    const timer = setInterval(() => {
      if (c.camInfo.count) {
        const p = c.camInfo.position
        const t = c.camInfo.target
        const s = `position: ${p.x.toFixed(dp)}, ${p.y.toFixed(dp)}, ${p.z.toFixed(dp)} target: ${t.x.toFixed(dp)}, ${t.y.toFixed(dp)}, ${t.z.toFixed(dp)} `
        c.camInfo.count = 0
        camInfo.textContent = s
        // console.log(s)
      }
    }, 100)
    c.updateCamInfo()
  }

  addDemoCube (c) {
    const p = this.PROPS.scene.demoCube
    const geometry = new THREE.BoxGeometry(1.2, 1.2, 0.5)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    const cube = new THREE.Mesh(geometry, material)
    cube.name = 'demoCube'
    c.scene.add(cube)
    c.addMixer('demoCube', (_delta) => {
      if (!p.rotating) return false
      // cube.rotation.x += 0.01;
      cube.rotation.z += 0.01
      return true
    })
  }

  /**
   * Some things in the GUI need to be persisted in config.
   * Some things are temporary.
   * Some things drive THREE objects.
   */
  makeGui () {
    {
      const fld = this.gui.addFolder('General Setup')
      fld.add(this.PROPS, 'addMapTiles')
      fld.add(this.PROPS, 'pickFile')
    }
    {
      const fld = this.gui.addFolder('Base Actions')
      fld.add(this.PROPS, 'resetCamera')
    }
    {
      const s = this.gui.addFolder('Scene')
      const sp = this.PROPS.scene
      {
        const fld = s.addFolder('Fog')
        fld.add(sp.fog, 'enabled').onChange(v => { this.canvas.scene.fog = v ? this.fog : null })
        fld.addColor(this.fog, 'color')
        fld.add(this.fog, 'near')
        fld.add(this.fog, 'far')
      }
      {
        const fld = s.addFolder('Grid')
        fld.add(sp.grid, 'visible').onChange(v => {
          const g = this.canvas.scene.getObjectByName('grid')
          if (g) g.visible = v
        })
      }
      {
        const fld = s.addFolder('Axes')
        fld.add(sp.axes, 'visible').onChange(v => {
          const g = this.canvas.scene.getObjectByName('axesHelper')
          if (g) g.visible = v
        })
      }
      {
        const fld = s.addFolder('Demo Cube')
        fld.add(sp.demoCube, 'rotating')
        fld.add(sp.demoCube, 'visible').onChange(v => {
          const g = this.canvas.scene.getObjectByName('demoCube')
          if (g) g.visible = v
        })
      }
    }
  }

  hello () {
    // set resource dir or set map dir
    // set tools dir
    // get imageMagick
    // get other tools
    // dirs for icons, sounds, models, etc.
    // cube map backgrounds
    // routes for map
    // general dir picker and file picker in GUI
    // external hyperlinks with shell.openExternal(url)
    // shell.showItemInFolder(fullPath)
  }
}

function addGrid (scene) {
  const width = 100
  const gridPos = new THREE.Vector3(0, 0, 0)
  const gridVisible = true

  const grid = new THREE.GridHelper(width, width)
  grid.geometry.rotateX(Math.PI / 2)

  grid.position.copy(gridPos)
  grid.name = 'grid'
  grid.visible = gridVisible
  scene.add(grid)
}

export { Bong }
